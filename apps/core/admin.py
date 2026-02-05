"""
Core Admin - Secure base classes with automatic org/branch filtering
"""

from django.contrib import admin
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from .models import Organization, AuditLog, FeatureFlag
from apps.authentication.models_hierarchy import Branch, BranchUser, OrganizationUser


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """
    🏢 Organization Administration - Superuser Only
    
    Rules:
    - Superuser: See all orgs, full CRUD
    - Org Admin: See own org, read-only
    - Regular User: No access
    """
    
    list_display = ['name', 'email', 'subscription_status', 'is_active', 'created_at']
    list_filter = ['subscription_status', 'is_active', 'created_at']
    search_fields = ['name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'email')
        }),
        ('Business Settings', {
            'fields': ('timezone', 'currency')
        }),
        ('Subscription', {
            'fields': ('subscription_status', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        """
        🔍 Visibility:
        - Superuser: All organizations
        - Org Admin: Own organization only
        - Regular User: Empty queryset
        """
        qs = super().get_queryset(request)
        
        if request.user.is_superuser:
            return qs
        
        if request.user.is_org_admin and request.user.organization:
            return qs.filter(id=request.user.organization_id)
        
        return qs.none()
    
    def has_add_permission(self, request):
        """🔐 Only superusers can create organizations"""
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """
        🔐 Only superusers can edit organizations
        Org admins can view own organization (read-only)
        """
        if request.user.is_superuser:
            return True
        
        if request.user.is_org_admin and obj:
            # Org admin can VIEW but not EDIT their org
            return False
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """🔐 Only superusers can delete organizations"""
        return request.user.is_superuser


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user_email', 'action', 'resource_type', 'resource_id', 'ip_address']
    list_filter = ['action', 'resource_type', 'timestamp']
    search_fields = ['user_email', 'resource_id', 'ip_address']
    readonly_fields = [
        'id', 'timestamp', 'user', 'user_email', 'action',
        'resource_type', 'resource_id', 'resource_repr',
        'old_values', 'new_values', 'changed_fields',
        'ip_address', 'user_agent', 'request_id', 'organization_id'
    ]
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_enabled', 'enabled_for_all', 'enabled_percentage', 'updated_at']
    list_filter = ['is_enabled', 'enabled_for_all']
    search_fields = ['name', 'description']
    ordering = ['name']


# ==================== SECURE ADMIN BASE CLASSES ====================
# Use these as base classes for all model admins to enforce org/branch isolation

class OrgBranchAdmin(admin.ModelAdmin):
    """
    🔒 Secure Base Admin with automatic organization/branch filtering
    Prevents cross-organization data access in Django admin
    
    Usage:
        @admin.register(Employee)
        class EmployeeAdmin(OrgBranchAdmin):
            list_display = ['employee_id', 'name', 'branch']
    """
    
    def get_queryset(self, request):
        """Filter queryset by user's organization/branch"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser:
            return qs
        
        try:
            org_user = OrganizationUser.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('organization').first()
            
            if not org_user:
                return qs.none()
            
            # Filter by branch if model has branch field
            if hasattr(self.model, 'branch'):
                branch_users = BranchUser.objects.filter(
                    user=request.user,
                    is_active=True
                ).select_related('branch')
                
                branch_ids = [bu.branch_id for bu in branch_users]
                
                if not branch_ids:
                    return qs.none()
                
                return qs.filter(branch_id__in=branch_ids)
            
            # Filter by organization if model has organization field
            elif hasattr(self.model, 'organization'):
                return qs.filter(organization=org_user.organization)
            
            return qs
            
        except Exception:
            return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter foreign key dropdowns by user's organization"""
        if request.user.is_superuser:
            return super().formfield_for_foreignkey(db_field, request, **kwargs)
        
        try:
            org_user = OrganizationUser.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('organization').first()
            
            if not org_user:
                kwargs["queryset"] = db_field.related_model.objects.none()
                return super().formfield_for_foreignkey(db_field, request, **kwargs)
            
            organization = org_user.organization
            
            # Filter Branch dropdown
            if db_field.name == "branch":
                branch_users = BranchUser.objects.filter(
                    user=request.user,
                    is_active=True
                ).select_related('branch')
                
                branch_ids = [bu.branch_id for bu in branch_users]
                kwargs["queryset"] = Branch.objects.filter(id__in=branch_ids)
            
            # Filter by organization for other FKs
            elif db_field.name in ["department", "designation", "location"]:
                if hasattr(db_field.related_model, 'organization'):
                    kwargs["queryset"] = db_field.related_model.objects.filter(
                        organization=organization
                    )
            
            # Filter Employee dropdowns
            elif db_field.name in ["reporting_manager", "approved_by", "created_by"]:
                if db_field.related_model.__name__ == "Employee":
                    branch_users = BranchUser.objects.filter(
                        user=request.user,
                        is_active=True
                    ).select_related('branch')
                    
                    branch_ids = [bu.branch_id for bu in branch_users]
                    kwargs["queryset"] = db_field.related_model.objects.filter(
                        branch_id__in=branch_ids
                    )
            
        except Exception:
            kwargs["queryset"] = db_field.related_model.objects.none()
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        """Auto-set created_by/updated_by fields"""
        if not change and hasattr(obj, 'created_by') and not obj.created_by:
            obj.created_by = request.user
        
        if hasattr(obj, 'updated_by'):
            obj.updated_by = request.user
        
        super().save_model(request, obj, form, change)
    
    def _check_object_permission(self, request, obj):
        """Check if user has permission to access this object"""
        if request.user.is_superuser:
            return True
        
        try:
            org_user = OrganizationUser.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('organization').first()
            
            if not org_user:
                return False
            
            if hasattr(obj, 'branch'):
                return BranchUser.objects.filter(
                    user=request.user,
                    branch=obj.branch,
                    is_active=True
                ).exists()
            
            elif hasattr(obj, 'organization'):
                return obj.organization_id == org_user.organization_id
            
            return True
            
        except Exception:
            return False


class OrganizationScopedAdmin(admin.ModelAdmin):
    """
    🔒 Admin for organization-level resources (no branch filtering)
    Examples: Departments, Designations, Leave Types
    """
    
    def get_queryset(self, request):
        """Filter by user's organization"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser:
            return qs
        
        try:
            org_user = OrganizationUser.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('organization').first()
            
            if not org_user:
                return qs.none()
            
            if hasattr(self.model, 'organization'):
                return qs.filter(organization=org_user.organization)
            
            return qs
            
        except Exception:
            return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter FK fields by organization"""
        if not request.user.is_superuser:
            try:
                org_user = OrganizationUser.objects.filter(
                    user=request.user,
                    is_active=True
                ).select_related('organization').first()
                
                if org_user and hasattr(db_field.related_model, 'organization'):
                    kwargs["queryset"] = db_field.related_model.objects.filter(
                        organization=org_user.organization
                    )
            except Exception:
                kwargs["queryset"] = db_field.related_model.objects.none()
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class ReadOnlyOrgBranchAdmin(OrgBranchAdmin):
    """
    🔒 Read-only admin with organization filtering
    Useful for viewing audit logs, reports, etc.
    """
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

