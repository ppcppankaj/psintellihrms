"""
Branch-Aware DRF Permissions and Filters
Implements branch-level data isolation for REST API endpoints
"""

from rest_framework import permissions
from rest_framework.filters import BaseFilterBackend
from django.db.models import Q
from apps.core.middleware import get_current_organization, get_current_branch


class BranchPermission(permissions.BasePermission):
    """
    Permission class to enforce branch-level access control in API.
    
    Access Rules:
    - Superusers: Full access to all data
    - Org Admins: Access to all branches within their organization
    - Branch Users: Access only to their assigned branch(es)
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, BranchPermission]
    """
    
    def has_permission(self, request, view):
        """Check if user has general permission to access the view"""
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers always have permission
        if request.user.is_superuser:
            return True
        
        # Must have an organization
        user_org = request.user.get_organization()
        if not user_org:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access specific object"""
        # Superusers always have permission
        if request.user.is_superuser:
            return True
        
        # Check if object has branch field
        if not hasattr(obj, 'branch'):
            return True  # No branch field, allow access
        
        # If branch is None, allow access
        if obj.branch is None:
            return True
        
        # Get user's organization
        user_org = request.user.get_organization()
        if not user_org:
            return False
        
        # Org admins can access all branches in their organization
        if request.user.is_org_admin or request.user.is_organization_admin():
            return obj.branch.organization == user_org
        
        # Regular users can only access their branch(es)
        user_branches = self._get_user_branches(request.user)
        return obj.branch in user_branches
    
    def _get_user_branches(self, user):
        """Get all branches assigned to the user"""
        branches = []
        
        # Try BranchUser mapping
        try:
            from apps.authentication.models import BranchUser
            branch_memberships = BranchUser.objects.filter(
                user=user,
                is_active=True
            ).select_related('branch')
            branches = [membership.branch for membership in branch_memberships]
        except:
            pass
        
        # Fallback to Employee branch
        if not branches:
            try:
                from apps.employees.models import Employee
                employee = Employee.objects.filter(user=user, is_active=True).first()
                if employee and employee.branch:
                    branches = [employee.branch]
            except:
                pass
        
        return branches


class OrganizationPermission(permissions.BasePermission):
    """
    Permission class to enforce organization-level access control in API.
    
    For models that have organization field but no branch field.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, OrganizationPermission]
    """
    
    def has_permission(self, request, view):
        """Check if user has general permission to access the view"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        user_org = request.user.get_organization()
        return user_org is not None
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access specific object"""
        if request.user.is_superuser:
            return True
        
        # Check if object has organization field
        if not hasattr(obj, 'organization'):
            return True
        
        if obj.organization is None:
            return True
        
        user_org = request.user.get_organization()
        if not user_org:
            return False
        
        return obj.organization == user_org


class BranchFilterBackend(BaseFilterBackend):
    """
    Filter backend that automatically filters querysets by branch.
    
    Filtering Rules:
    - Superusers: No filtering (see all data)
    - Org Admins: Filter by organization (all branches in org)
    - Branch Users: Filter by assigned branches only
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            filter_backends = [BranchFilterBackend]
    """
    
    def filter_queryset(self, request, queryset, view):
        """Apply branch filtering to queryset"""
        # Superusers see everything
        if request.user.is_superuser:
            return queryset
        
        # Get user's organization
        user_org = request.user.get_organization()
        if not user_org:
            return queryset.none()
        
        # Check if model has branch field
        model = queryset.model
        has_branch_field = hasattr(model, 'branch')
        
        if not has_branch_field:
            # No branch field - filter by organization if available
            if hasattr(model, 'organization'):
                return queryset.filter(organization=user_org)
            return queryset  # No tenant fields
        
        # Model has branch field - apply branch filtering
        
        # Org admins see all branches in their organization
        if request.user.is_org_admin or request.user.is_organization_admin():
            return queryset.filter(
                Q(branch__organization=user_org) | Q(branch__isnull=True)
            )
        
        # Regular users see only their branch(es)
        user_branches = self._get_user_branches(request.user)
        if user_branches:
            branch_ids = [branch.id for branch in user_branches]
            return queryset.filter(
                Q(branch__id__in=branch_ids) | Q(branch__isnull=True)
            )
        
        # No branch access - only show records with null branch
        return queryset.filter(branch__isnull=True)
    
    def _get_user_branches(self, user):
        """Get all branches assigned to the user"""
        branches = []
        
        # Try BranchUser mapping
        try:
            from apps.authentication.models import BranchUser
            branch_memberships = BranchUser.objects.filter(
                user=user,
                is_active=True
            ).select_related('branch')
            branches = [membership.branch for membership in branch_memberships]
        except:
            pass
        
        # Fallback to Employee branch
        if not branches:
            try:
                from apps.employees.models import Employee
                employee = Employee.objects.filter(user=user, is_active=True).first()
                if employee and employee.branch:
                    branches = [employee.branch]
            except:
                pass
        
        return branches


class OrganizationFilterBackend(BaseFilterBackend):
    """
    Filter backend that automatically filters querysets by organization.
    
    For models that have organization field but no branch field.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            filter_backends = [OrganizationFilterBackend]
    """
    
    def filter_queryset(self, request, queryset, view):
        """Apply organization filtering to queryset"""
        if request.user.is_superuser:
            return queryset
        
        user_org = request.user.get_organization()
        if not user_org:
            return queryset.none()
        
        # Filter by organization if field exists
        if hasattr(queryset.model, 'organization'):
            return queryset.filter(organization=user_org)
        
        return queryset


class IsBranchAdmin(permissions.BasePermission):
    """
    Permission to check if user is a branch admin.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, IsBranchAdmin]
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Check if user is org admin
        if request.user.is_org_admin or request.user.is_organization_admin():
            return True
        
        # Check if user is branch admin via BranchUser
        try:
            from apps.authentication.models import BranchUser
            return BranchUser.objects.filter(
                user=request.user,
                is_active=True,
                role=BranchUser.RoleChoices.BRANCH_ADMIN
            ).exists()
        except:
            pass
        
        return False


class IsSelfOrBranchAdmin(permissions.BasePermission):
    """
    Permission to allow users to access their own data or branch admins to access branch data.
    
    Useful for employee self-service endpoints.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, IsSelfOrBranchAdmin]
    """
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        # Check if accessing own data
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        if hasattr(obj, 'employee') and hasattr(obj.employee, 'user'):
            if obj.employee.user == request.user:
                return True
        
        # Check if user is branch admin
        if request.user.is_org_admin or request.user.is_organization_admin():
            return True
        
        # Check branch admin via BranchUser
        try:
            from apps.authentication.models import BranchUser
            is_branch_admin = BranchUser.objects.filter(
                user=request.user,
                is_active=True,
                role=BranchUser.RoleChoices.BRANCH_ADMIN
            ).exists()
            
            if is_branch_admin:
                # Verify object is in same branch
                if hasattr(obj, 'branch') and obj.branch:
                    user_branches = self._get_user_branches(request.user)
                    return obj.branch in user_branches
        except:
            pass
        
        return False
    
    def _get_user_branches(self, user):
        """Get all branches assigned to the user"""
        try:
            from apps.authentication.models import BranchUser
            branch_memberships = BranchUser.objects.filter(
                user=user,
                is_active=True
            ).select_related('branch')
            return [membership.branch for membership in branch_memberships]
        except:
            pass
        
        try:
            from apps.employees.models import Employee
            employee = Employee.objects.filter(user=user, is_active=True).first()
            if employee and employee.branch:
                return [employee.branch]
        except:
            pass
        
        return []
