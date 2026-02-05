"""AI Services Admin"""
from django.contrib import admin
from .models import AIModelVersion, AIPrediction


@admin.register(AIModelVersion)
class AIModelVersionAdmin(admin.ModelAdmin):
    list_display = ['name', 'model_type', 'version', 'is_active', 'accuracy', 'created_at']
    list_filter = ['model_type', 'is_active']
    search_fields = ['name']


@admin.register(AIPrediction)
class AIPredictionAdmin(admin.ModelAdmin):
    list_display = ['entity_type', 'entity_id', 'confidence', 'human_reviewed', 'created_at']
    list_filter = ['entity_type', 'human_reviewed']
    raw_id_fields = ['model_version', 'reviewed_by']
