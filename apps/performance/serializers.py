"""
Performance Serializers
"""

from rest_framework import serializers
from .models import (
    PerformanceCycle, OKRObjective, KeyResult, PerformanceReview, ReviewFeedback,
    KeyResultArea, EmployeeKRA, KPI, Competency, EmployeeCompetency, TrainingRecommendation
)
from apps.employees.serializers import EmployeeListSerializer

class PerformanceCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceCycle
        fields = '__all__'

class KeyResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyResult
        fields = '__all__'

class OKRObjectiveSerializer(serializers.ModelSerializer):
    key_results = KeyResultSerializer(many=True, read_only=True)
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    
    class Meta:
        model = OKRObjective
        fields = '__all__'

class ReviewFeedbackSerializer(serializers.ModelSerializer):
    reviewer_details = EmployeeListSerializer(source='reviewer', read_only=True)
    
    class Meta:
        model = ReviewFeedback
        fields = '__all__'

class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    cycle_details = PerformanceCycleSerializer(source='cycle', read_only=True)
    feedbacks = ReviewFeedbackSerializer(many=True, read_only=True)
    
    class Meta:
        model = PerformanceReview
        fields = '__all__'

class KeyResultAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyResultArea
        fields = '__all__'

class EmployeeKRASerializer(serializers.ModelSerializer):
    kra_details = KeyResultAreaSerializer(source='kra', read_only=True)
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    
    class Meta:
        model = EmployeeKRA
        fields = '__all__'

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'

class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = '__all__'

class EmployeeCompetencySerializer(serializers.ModelSerializer):
    competency_details = CompetencySerializer(source='competency', read_only=True)
    
    class Meta:
        model = EmployeeCompetency
        fields = '__all__'

class TrainingRecommendationSerializer(serializers.ModelSerializer):
    competency_details = CompetencySerializer(source='competency', read_only=True)
    
    class Meta:
        model = TrainingRecommendation
        fields = '__all__'
