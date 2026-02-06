"""
Attendance Serializers
"""

from rest_framework import serializers
from django.utils import timezone
from .models import (
    Shift, GeoFence, AttendanceRecord,
    AttendancePunch, FraudLog, FaceEmbedding,
    ShiftAssignment, OvertimeRequest
)
from apps.employees.models import Location


class ShiftSerializer(serializers.ModelSerializer):
    """Shift serializer"""
    
    class Meta:
        model = Shift
        fields = [
            'id', 'name', 'code', 'start_time', 'end_time',
            'grace_in_minutes', 'grace_out_minutes',
            'break_duration_minutes', 'working_hours', 'half_day_hours',
            'overtime_allowed', 'max_overtime_hours', 'is_night_shift',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GeoFenceSerializer(serializers.ModelSerializer):
    """Geo-fence serializer"""
    
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = GeoFence
        fields = [
            'id', 'name', 'location', 'location_name',
            'latitude', 'longitude', 'radius_meters',
            'is_primary', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GeoFenceBulkImportSerializer(serializers.ModelSerializer):
    """Bulk import serializer for GeoFence with location resolution"""
    location_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = GeoFence
        fields = [
            'name', 'location_code',
            'latitude', 'longitude', 'radius_meters',
            'is_primary', 'is_active'
        ]

    def validate(self, attrs):
        location_code = attrs.pop('location_code', None)
        if location_code:
            try:
                # Resolve location by code
                attrs['location'] = Location.objects.get(code=location_code)
            except Location.DoesNotExist:
                raise serializers.ValidationError({'location_code': f"Location with code '{location_code}' not found."})
        return attrs





class AttendancePunchSerializer(serializers.ModelSerializer):
    """Individual punch serializer"""
    
    class Meta:
        model = AttendancePunch
        fields = [
            'id', 'punch_type', 'punch_time',
            'latitude', 'longitude', 'accuracy',
            'face_verified', 'liveness_verified',
            'fraud_score', 'fraud_flags', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AttendanceRecordListSerializer(serializers.ModelSerializer):
    """Attendance record list serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 'date',
            'check_in', 'check_out', 'status', 'total_hours',
            'overtime_hours', 'late_minutes', 'early_out_minutes',
            'is_flagged', 'is_regularized'
        ]


class AttendanceRecordDetailSerializer(serializers.ModelSerializer):
    """Attendance record detail serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    punches = AttendancePunchSerializer(many=True, read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.user.full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 'date',
            'check_in', 'check_out', 'status', 'total_hours',
            'overtime_hours', 'late_minutes', 'early_out_minutes',
            'check_in_latitude', 'check_in_longitude',
            'check_out_latitude', 'check_out_longitude',
            'check_in_fraud_score', 'check_out_fraud_score',
            'is_flagged', 'is_regularized', 'regularization_reason',
            'approved_by', 'approved_by_name', 'device_id',
            'punches', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PunchInSerializer(serializers.Serializer):
    """Punch-in request serializer"""
    
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=True)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=True)
    accuracy = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)
    
    device_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    device_model = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    is_rooted = serializers.BooleanField(required=False, default=False)
    is_emulator = serializers.BooleanField(required=False, default=False)
    is_mock_gps = serializers.BooleanField(required=False, default=False)
    
    selfie = serializers.ImageField(required=False, allow_null=True)


class PunchOutSerializer(PunchInSerializer):
    """Punch-out request serializer (same as punch-in)"""
    pass


class PunchResponseSerializer(serializers.Serializer):
    """Punch response serializer"""
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    fraud_score = serializers.FloatField()
    warnings = serializers.ListField(child=serializers.CharField())
    attendance = AttendanceRecordDetailSerializer(required=False, allow_null=True)


class AttendanceRegularizationSerializer(serializers.Serializer):
    """Attendance regularization request"""
    
    date = serializers.DateField()
    check_in = serializers.DateTimeField(required=False, allow_null=True)
    check_out = serializers.DateTimeField(required=False, allow_null=True)
    reason = serializers.CharField(max_length=500)
    
    def validate(self, data):
        if not data.get('check_in') and not data.get('check_out'):
            raise serializers.ValidationError("At least one of check_in or check_out is required")
        return data


class FraudLogSerializer(serializers.ModelSerializer):
    """Fraud log serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.user.full_name', read_only=True)
    
    class Meta:
        model = FraudLog
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 'punch',
            'fraud_type', 'severity', 'details',
            'action_taken', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AttendanceSummarySerializer(serializers.Serializer):
    """Attendance summary for dashboard"""
    
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    leave_days = serializers.IntegerField()
    wfh_days = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    overtime_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_hours_per_day = serializers.DecimalField(max_digits=5, decimal_places=2)


class TeamAttendanceSerializer(serializers.Serializer):
    """Team attendance status"""
    
    employee_id = serializers.CharField()
    employee_name = serializers.CharField()
    avatar = serializers.URLField(allow_null=True)
    status = serializers.CharField()
    check_in = serializers.DateTimeField(allow_null=True)
    check_out = serializers.DateTimeField(allow_null=True)


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    """Shift assignment serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    shift_code = serializers.CharField(source='shift.code', read_only=True)
    
    class Meta:
        model = ShiftAssignment
        fields = [
            'id', 'employee', 'employee_id', 'employee_name',
            'shift', 'shift_name', 'shift_code',
            'branch', 'effective_from', 'effective_to',
            'is_primary', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ShiftAssignmentBulkSerializer(serializers.Serializer):
    """Bulk assign shifts to multiple employees"""
    
    employee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    shift = serializers.PrimaryKeyRelatedField(queryset=Shift.objects.none())
    effective_from = serializers.DateField()
    effective_to = serializers.DateField(required=False, allow_null=True)
    is_primary = serializers.BooleanField(default=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'organization'):
            self.fields['shift'].queryset = Shift.objects.filter(
                organization=request.organization,
                is_active=True
            )
        else:
            self.fields['shift'].queryset = Shift.objects.none()


class OvertimeRequestSerializer(serializers.ModelSerializer):
    """Overtime request serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.user.full_name', read_only=True)
    attendance_date = serializers.DateField(source='attendance.date', read_only=True)
    
    class Meta:
        model = OvertimeRequest
        fields = [
            'id', 'attendance', 'attendance_date',
            'employee', 'employee_id', 'employee_name',
            'branch', 'requested_hours', 'approved_hours',
            'reason', 'status', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'review_notes', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'approved_hours', 'created_at']


class OvertimeApprovalSerializer(serializers.Serializer):
    """Overtime approval request"""
    
    approved_hours = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class MonthlyReportSerializer(serializers.Serializer):
    """Monthly attendance report data"""
    
    employee_id = serializers.CharField()
    employee_name = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    leave_days = serializers.IntegerField()
    wfh_days = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    overtime_hours = serializers.DecimalField(max_digits=10, decimal_places=2)


class AnnualReportSerializer(serializers.Serializer):
    """Annual attendance report data"""
    
    employee_id = serializers.CharField()
    employee_name = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    months = serializers.ListField(child=serializers.DictField())
