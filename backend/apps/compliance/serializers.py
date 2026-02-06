"""
Compliance Serializers
"""

from rest_framework import serializers
from .models import (
    DataRetentionPolicy,
    ConsentRecord,
    LegalHold,
    DataSubjectRequest,
    AuditExportRequest,
    RetentionExecution,
)

class DataRetentionPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = DataRetentionPolicy
        fields = '__all__'

class ConsentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentRecord
        fields = '__all__'

class LegalHoldSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalHold
        fields = '__all__'


class DataSubjectRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSubjectRequest
        fields = '__all__'


class AuditExportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditExportRequest
        fields = '__all__'


class RetentionExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetentionExecution
        fields = '__all__'
