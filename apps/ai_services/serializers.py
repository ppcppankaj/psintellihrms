"""AI Serializers"""
from rest_framework import serializers
from .models import AIModelVersion, AIPrediction


class AIModelVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModelVersion
        fields = [
            'id', 'organization', 'name', 'model_type', 'version', 'model_path',
            'is_active', 'accuracy', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class AIPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPrediction
        fields = [
            'id', 'organization', 'model_version', 'entity_type', 'entity_id',
            'prediction', 'confidence', 'human_reviewed', 'human_override',
            'reviewed_by', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']
