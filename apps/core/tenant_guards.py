"""
Organization Safety Guards - Prevent cross-organization data leakage
"""

from django.db import models
from django.db.models import QuerySet
from .context import get_current_organization


class OrganizationQuerySet(QuerySet):
    """
    QuerySet that automatically filters by current organization.
    Prevents cross-organization data leakage.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._organization_filtered = False
    
    def _filter_by_organization(self):
        """Apply organization filter if not already applied"""
        if self._organization_filtered:
            return self
        
        org = get_current_organization()
        if org and hasattr(self.model, 'organization_id'):
            # Clone and mark as filtered
            clone = self._clone()
            clone._organization_filtered = True
            return clone.filter(organization_id=org.id)
        
        self._organization_filtered = True
        return self
    
    def _clone(self):
        clone = super()._clone()
        clone._organization_filtered = self._organization_filtered
        return clone
    
    def all(self):
        return super().all()._filter_by_organization()
    
    def filter(self, *args, **kwargs):
        return super().filter(*args, **kwargs)._filter_by_organization()
    
    def exclude(self, *args, **kwargs):
        return super().exclude(*args, **kwargs)._filter_by_organization()
    
    def get(self, *args, **kwargs):
        return self._filter_by_organization().get(*args, **kwargs)
    
    def first(self):
        return self._filter_by_organization().first()
    
    def last(self):
        return self._filter_by_organization().last()
    
    def exists(self):
        return self._filter_by_organization().exists()
    
    def count(self):
        return self._filter_by_organization().count()
    
    def aggregate(self, *args, **kwargs):
        return self._filter_by_organization().aggregate(*args, **kwargs)
    
    def values(self, *fields, **expressions):
        return self._filter_by_organization().values(*fields, **expressions)
    
    def values_list(self, *fields, flat=False, named=False):
        return self._filter_by_organization().values_list(*fields, flat=flat, named=named)
    
    def unfiltered(self):
        """
        Bypass organization filtering (USE WITH EXTREME CAUTION).
        Only for system-level operations.
        """
        clone = self._clone()
        clone._organization_filtered = True  # Mark as filtered to skip auto-filter
        return clone


class OrganizationManager(models.Manager):
    """
    Manager that uses OrganizationQuerySet.
    Apply to any model that should be organization-scoped.
    """
    
    def get_queryset(self):
        return OrganizationQuerySet(self.model, using=self._db)
    
    def unfiltered(self):
        """Access all records across organizations (admin use only)"""
        return self.get_queryset().unfiltered()


class OrganizationSafeModelMixin(models.Model):
    """
    Mixin that enforces organization isolation.
    - Auto-sets organization on save
    - Auto-filters by organization on queries
    """
    
    # Override the default manager
    objects = OrganizationManager()
    
    # Keep access to unfiltered for migrations/admin
    all_objects = models.Manager()
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Auto-set organization on save if not set"""
        if hasattr(self, 'organization_id') and not self.organization_id:
            org = get_current_organization()
            if org:
                self.organization_id = org.id
        super().save(*args, **kwargs)


class OrganizationViewSetMixin:
    """
    Mixin for ViewSets that ensures organization filtering.
    Add this to any ViewSet that handles organization-scoped data.
    """
    
    def get_queryset(self):
        """
        Ensure queryset is filtered by organization.
        This is a safety net in case the model manager doesn't filter.
        """
        queryset = super().get_queryset()
        
        # Get current organization
        org = getattr(self.request, 'organization', None)
        if not org:
            org = get_current_organization()
        
        # Filter by organization only if model explicitly has organization_id
        if org and hasattr(queryset.model, 'organization_id'):
            queryset = queryset.filter(organization_id=org.id)
        
        return queryset


def validate_organization_access(obj, request=None):
    """
    Validate that the current user can access this object.
    Raises PermissionDenied if organization mismatch.
    """
    from rest_framework.exceptions import PermissionDenied
    
    org = get_current_organization()
    if not org:
        return True  # No organization context
    
    if hasattr(obj, 'organization_id') and obj.organization_id != org.id:
        raise PermissionDenied("Access denied: resource belongs to different organization")
    
    return True
