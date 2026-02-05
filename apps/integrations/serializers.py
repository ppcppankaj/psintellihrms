"""Integration Serializers"""
from rest_framework import serializers
from .models import Integration, Webhook, APIKey

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = '__all__'
        extra_kwargs = {'credentials': {'write_only': True}}

class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webhook
        fields = '__all__'
        extra_kwargs = {'secret': {'write_only': True}}

class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = '__all__'
        read_only_fields = ['key', 'last_used']
