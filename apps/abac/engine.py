"""
ABAC Policy Engine - Evaluates attribute-based access control policies

SECURITY GUARANTEES:
- Hard-fails if organization context is missing
- Enforces tenant isolation for all policy resolution
- Prevents silent allow/deny behavior
"""

from typing import Dict, Any, Optional, List
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from apps.core.context import get_current_organization
from .models import Policy, PolicyLog, UserPolicy, GroupPolicy


class PolicyEngine:
    """
    Main engine for evaluating ABAC policies.
    Determines if a user has access to perform an action on a resource.
    """

    def __init__(self, user, log_decisions=True):
        self.user = user
        self.log_decisions = log_decisions

        # 🔒 CRITICAL: Organization context is mandatory
        self.organization = get_current_organization()
        if not self.organization and not self.user.is_superuser:
            raise PermissionDenied(
                "ABAC denied: Organization context is missing"
            )

    # --------------------------------------------------
    # PUBLIC ENTRY POINT
    # --------------------------------------------------
    def check_access(
        self,
        resource_type: str,
        action: str,
        resource_attrs: Dict[str, Any] = None,
        resource_id: str = None
    ) -> bool:
        """
        Main access control check.
        """

        # Superusers bypass ABAC
        if self.user.is_superuser:
            return True

        subject_attrs = self._get_subject_attributes()

        # 🔒 SECURITY FIX: Org Admins bypass policies within their organization scope
        if subject_attrs.get('is_org_admin'):
            return True
        resource_attrs = resource_attrs or {}
        environment_attrs = self._get_environment_attributes()

        policies = self._get_applicable_policies(
            resource_type, action, resource_id
        )

        decision, reason, evaluated_policies = self._evaluate_policies(
            policies,
            subject_attrs,
            resource_attrs,
            action,
            environment_attrs
        )

        if self.log_decisions:
            self._log_decision(
                resource_type=resource_type,
                resource_id=resource_id or '',
                action=action,
                result=decision,
                subject_attrs=subject_attrs,
                resource_attrs=resource_attrs,
                environment_attrs=environment_attrs,
                evaluated_policies=evaluated_policies,
                reason=reason
            )

        return decision

    # --------------------------------------------------
    # ATTRIBUTE EXTRACTION
    # --------------------------------------------------
    def _get_subject_attributes(self) -> Dict[str, Any]:
        """Extract subject (user) attributes"""

        attrs = {
            'user_id': str(self.user.id),
            'email': self.user.email,
            'is_superuser': self.user.is_superuser,
            'is_org_admin': getattr(self.user, 'is_org_admin', False),
            'is_verified': self.user.is_verified,
            'organization_id': str(self.organization.id) if self.organization else None,
            'organization_name': self.organization.name if self.organization else None,
        }

        # Employee attributes
        if hasattr(self.user, 'employee') and self.user.employee:
            emp = self.user.employee
            attrs.update({
                'employee_id': emp.employee_id,
                'department': emp.department.name if emp.department else None,
                'department_id': str(emp.department.id) if emp.department else None,
                'designation': emp.designation.name if emp.designation else None,
                'job_level': getattr(emp.designation, 'level', None) if emp.designation else None,
                'location': emp.location.name if emp.location else None,
                'location_id': str(emp.location.id) if emp.location else None,
                'employment_status': emp.employment_status,
                'employment_type': emp.employment_type,
                'date_of_joining': emp.date_of_joining,
                'is_manager': emp.direct_reports.exists(),
                'manager_id': str(emp.reporting_manager.id) if emp.reporting_manager else None,
            })

        return attrs

    def _get_environment_attributes(self) -> Dict[str, Any]:
        """Extract environmental attributes"""

        now = timezone.now()

        return {
            'current_time': now.time().isoformat(),
            'current_date': now.date().isoformat(),
            'current_datetime': now.isoformat(),
            'day_of_week': now.strftime('%A'),
            'is_weekend': now.weekday() >= 5,
            'hour': now.hour,
        }

    # --------------------------------------------------
    # POLICY RESOLUTION
    # --------------------------------------------------
    def _get_applicable_policies(
        self,
        resource_type: str,
        action: str,
        resource_id: Optional[str] = None
    ) -> List[Policy]:
        """
        Fetch policies applicable to this request.
        """

        # 🔒 USER POLICIES (TENANT SCOPED)
        user_policies = UserPolicy.objects.filter(
            user=self.user,
            organization=self.organization,
            is_active=True
        ).select_related('policy')

        active_user_policies = [
            up.policy
            for up in user_policies
            if up.is_valid_now()
            and up.policy.is_active
            and up.policy.is_valid_now()
        ]

        # 🔒 GROUP POLICIES (TENANT SCOPED)
        subject_attrs = self._get_subject_attributes()
        group_policies = self._get_group_policies(subject_attrs)

        all_policies = list(set(active_user_policies + group_policies))

        applicable = []
        for policy in all_policies:
            if policy.resource_type and policy.resource_type != resource_type:
                continue

            if policy.actions and action not in policy.actions:
                continue

            if policy.resource_id and resource_id and policy.resource_id != resource_id:
                continue

            applicable.append(policy)

        applicable.sort(key=lambda p: p.priority, reverse=True)
        return applicable

    def _get_group_policies(self, subject_attrs: Dict[str, Any]) -> List[Policy]:
        """Resolve group-based policies (tenant scoped)"""

        group_policies = []

        active_groups = GroupPolicy.objects.filter(
            organization=self.organization,
            is_active=True
        ).prefetch_related('policies')

        for group in active_groups:
            if group.group_type == 'department':
                if subject_attrs.get('department') == group.group_value:
                    group_policies.extend(group.policies.filter(is_active=True))
            elif group.group_type == 'location':
                if subject_attrs.get('location') == group.group_value:
                    group_policies.extend(group.policies.filter(is_active=True))
            elif group.group_type == 'job_level':
                if subject_attrs.get('job_level') == group.group_value:
                    group_policies.extend(group.policies.filter(is_active=True))
            elif group.group_type == 'employment_type':
                if subject_attrs.get('employment_type') == group.group_value:
                    group_policies.extend(group.policies.filter(is_active=True))

        return list(group_policies)

    # --------------------------------------------------
    # POLICY EVALUATION
    # --------------------------------------------------
    def _evaluate_policies(
        self,
        policies: List[Policy],
        subject_attrs: Dict,
        resource_attrs: Dict,
        action: str,
        environment_attrs: Dict
    ) -> tuple:
        """
        Evaluate policies and return decision.
        """

        if not policies:
            return False, "No applicable policies found", []

        deny_policies = []
        allow_policies = []
        evaluated_ids = []

        for policy in policies:
            evaluated_ids.append(str(policy.id))

            if policy.evaluate(
                subject_attrs,
                resource_attrs,
                action,
                environment_attrs
            ):
                if policy.effect == Policy.DENY:
                    deny_policies.append(policy)
                else:
                    allow_policies.append(policy)

        if deny_policies:
            return (
                False,
                f"Denied by policy: {', '.join(p.name for p in deny_policies)}",
                evaluated_ids
            )

        if allow_policies:
            return (
                True,
                f"Allowed by policy: {', '.join(p.name for p in allow_policies)}",
                evaluated_ids
            )

        return False, "No matching policy rules", evaluated_ids

    # --------------------------------------------------
    # AUDIT LOGGING
    # --------------------------------------------------
    def _log_decision(
        self,
        resource_type: str,
        resource_id: str,
        action: str,
        result: bool,
        subject_attrs: Dict,
        resource_attrs: Dict,
        environment_attrs: Dict,
        evaluated_policies: List,
        reason: str
    ):
        """Persist policy decision for auditing"""

        try:
            PolicyLog.objects.create(
                user=self.user,
                organization=self.organization,
                resource_type=resource_type,
                resource_id=resource_id,
                action=action,
                result=result,
                subject_attributes=subject_attrs,
                resource_attributes=resource_attrs,
                environment_attributes=environment_attrs,
                policies_evaluated=evaluated_policies,
                decision_reason=reason,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"ABAC audit log failed: {e}")
