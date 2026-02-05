"""AI Serializers"""
from rest_framework import serializers
from .models import AIModelVersion, AIPrediction

class AIModelVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModelVersion
        fields = '__all__'

class AIPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPrediction
        fields = '__all__'
