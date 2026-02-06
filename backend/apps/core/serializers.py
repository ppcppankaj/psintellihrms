from rest_framework import serializers
from .models import AuditLog, FeatureFlag, Organization

class OrganizationSerializer(serializers.ModelSerializer):
    """
    🏢 Organization Serializer
    
    Superuser: Full read/write access to all orgs
    Org Admin: Read-only access to own org
    Regular User: No access
    """
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'email', 'currency', 'timezone', 
            'subscription_status', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Ensure organization name is unique (case-insensitive)"""
        queryset = Organization.objects.filter(name__iexact=value)
        
        # Exclude current instance if updating
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError("Organization name must be unique.")
        
        return value

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'

class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = '__all__'
