"""
Leave Serializers
"""

from rest_framework import serializers
from django.utils import timezone
from .models import LeaveType, LeavePolicy, LeaveBalance, LeaveRequest, LeaveApproval, Holiday, LeaveEncashment
from .services import LeaveCalculationService, LeaveBalanceService


class LeaveTypeSerializer(serializers.ModelSerializer):
    """Leave type serializer"""
    
    class Meta:
        model = LeaveType
        fields = [
            'id', 'name', 'code', 'description',
            'annual_quota', 'accrual_type',
            'carry_forward_allowed', 'max_carry_forward',
            'encashment_allowed', 'max_encashment',
            'is_paid', 'requires_approval', 'requires_attachment',
            'min_days_notice', 'max_consecutive_days',
            'applicable_gender', 'applicable_after_months',
            'color', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeavePolicySerializer(serializers.ModelSerializer):
    """Leave policy serializer"""
    
    class Meta:
        model = LeavePolicy
        fields = [
            'id', 'name', 'description',
            'sandwich_rule', 'probation_leave_allowed',
            'negative_balance_allowed', 'max_negative_balance',
            'count_holidays', 'count_weekends',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    """Leave balance serializer"""
    
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_code = serializers.CharField(source='leave_type.code', read_only=True)
    color = serializers.CharField(source='leave_type.color', read_only=True)
    available = serializers.DecimalField(
        source='available_balance', max_digits=5, decimal_places=1, read_only=True
    )
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'employee', 'employee_name', 'employee_code',
            'leave_type', 'leave_type_name', 'leave_type_code',
            'color', 'year',
            'opening_balance', 'accrued', 'taken', 'carry_forward',
            'adjustment', 'encashed', 'available'
        ]
        read_only_fields = ['id', 'available']


class LeaveApprovalSerializer(serializers.ModelSerializer):
    """Leave approval serializer"""
    
    approver_name = serializers.CharField(source='approver.user.full_name', read_only=True)
    
    class Meta:
        model = LeaveApproval
        fields = [
            'id', 'leave_request', 'approver', 'approver_name',
            'level', 'action', 'comments', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeaveRequestListSerializer(serializers.ModelSerializer):
    """Leave request list serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_code = serializers.CharField(source='leave_type.code', read_only=True)
    color = serializers.CharField(source='leave_type.color', read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_id', 'employee_name',
            'leave_type', 'leave_type_name', 'leave_type_code', 'color',
            'start_date', 'end_date', 'start_day_type', 'end_day_type',
            'total_days', 'status', 'created_at'
        ]


class LeaveRequestDetailSerializer(serializers.ModelSerializer):
    """Leave request detail serializer"""
    
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_avatar = serializers.ImageField(source='employee.user.avatar', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    color = serializers.CharField(source='leave_type.color', read_only=True)
    current_approver_name = serializers.CharField(
        source='current_approver.user.full_name', read_only=True
    )
    approvals = LeaveApprovalSerializer(many=True, read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 'employee_avatar',
            'leave_type', 'leave_type_name', 'color',
            'start_date', 'end_date', 'start_day_type', 'end_day_type',
            'total_days', 'reason', 'status',
            'contact_number', 'contact_address', 'attachment',
            'current_approver', 'current_approver_name',
            'approvals', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_days', 'status', 'created_at', 'updated_at']


class LeaveApplySerializer(serializers.Serializer):
    """Apply leave serializer"""
    
    leave_type = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    start_day_type = serializers.ChoiceField(
        choices=['full', 'first_half', 'second_half'],
        default='full'
    )
    end_day_type = serializers.ChoiceField(
        choices=['full', 'first_half', 'second_half'],
        default='full'
    )
    reason = serializers.CharField(max_length=1000)
    contact_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    contact_address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    attachment = serializers.FileField(required=False, allow_null=True)
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        
        # Check notice period
        leave_type = self._get_leave_type(data['leave_type'])
        if leave_type and leave_type.min_days_notice > 0:
            days_notice = (data['start_date'] - timezone.now().date()).days
            if days_notice < leave_type.min_days_notice:
                raise serializers.ValidationError(
                    f"Minimum {leave_type.min_days_notice} days notice required"
                )
        
        return data
    
    def _get_leave_type(self, leave_type_id):
        from .models import LeaveType
        try:
            return LeaveType.objects.get(id=leave_type_id, is_active=True)
        except LeaveType.DoesNotExist:
            return None


class LeaveApproveSerializer(serializers.Serializer):
    """Approve/reject leave serializer"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    comments = serializers.CharField(max_length=500, required=False, allow_blank=True)


class LeaveCancelSerializer(serializers.Serializer):
    """Cancel leave serializer"""
    
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)


class LeaveBalanceSummarySerializer(serializers.Serializer):
    """Leave balance summary for dashboard"""
    
    leave_type_id = serializers.UUIDField()
    leave_type_name = serializers.CharField()
    leave_type_code = serializers.CharField()
    color = serializers.CharField()
    opening_balance = serializers.DecimalField(max_digits=5, decimal_places=1)
    accrued = serializers.DecimalField(max_digits=5, decimal_places=1)
    taken = serializers.DecimalField(max_digits=5, decimal_places=1)
    carry_forward = serializers.DecimalField(max_digits=5, decimal_places=1)
    adjustment = serializers.DecimalField(max_digits=5, decimal_places=1)
    available = serializers.DecimalField(max_digits=5, decimal_places=1)


class LeaveCalculateSerializer(serializers.Serializer):
    """Calculate leave days - preview before apply"""
    
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    start_day_type = serializers.ChoiceField(
        choices=['full', 'first_half', 'second_half'],
        default='full'
    )
    end_day_type = serializers.ChoiceField(
        choices=['full', 'first_half', 'second_half'],
        default='full'
    )


class LeaveCalculateResponseSerializer(serializers.Serializer):
    """Leave calculation response"""
    
    total_days = serializers.DecimalField(max_digits=5, decimal_places=1)
    leave_dates = serializers.ListField(child=serializers.DateField())
    holidays_excluded = serializers.ListField(child=serializers.DateField())
    weekends_excluded = serializers.ListField(child=serializers.DateField())


class HolidaySerializer(serializers.ModelSerializer):
    """Holiday serializer"""
    
    class Meta:
        model = Holiday
        fields = [
            'id', 'name', 'date', 'is_optional', 'is_restricted',
            'locations', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class HolidayBulkImportSerializer(serializers.ModelSerializer):
    """Bulk import for Holiday with M2M location resolution"""
    location_codes = serializers.CharField(write_only=True, required=False, help_text="Comma separated location codes")

    class Meta:
        model = Holiday
        fields = [
            'name', 'date', 'is_optional', 'is_restricted',
            'location_codes', 'is_active'
        ]

    def create(self, validated_data):
        location_codes = validated_data.pop('location_codes', None)
        holiday = Holiday.objects.create(**validated_data)
        
        if location_codes:
            codes = [c.strip() for c in location_codes.split(',') if c.strip()]
            from apps.employees.models import Location
            locations = Location.objects.filter(code__in=codes)
            holiday.locations.set(locations)
            
        return holiday


class TeamLeaveSerializer(serializers.Serializer):
    """Team leave for calendar view"""
    
    employee_id = serializers.CharField()
    employee_name = serializers.CharField()
    avatar = serializers.URLField(allow_null=True)
    leave_type = serializers.CharField()
    color = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    status = serializers.CharField()


class LeaveEncashmentSerializer(serializers.ModelSerializer):
    """Leave encashment serializer"""
    
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    
    class Meta:
        model = LeaveEncashment
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
            'year', 'days_requested', 'days_approved', 'per_day_amount',
            'total_amount', 'status', 'approved_by', 'approved_at',
            'rejection_reason', 'created_at'
        ]
        read_only_fields = [
            'id', 'employee_name', 'leave_type_name', 'days_approved',
            'per_day_amount', 'total_amount', 'status', 'approved_by',
            'approved_at', 'created_at'
        ]


class CompensatoryLeaveSerializer(serializers.ModelSerializer):
    """Compensatory leave serializer"""
    
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    
    class Meta:
        from .models import CompensatoryLeave
        model = CompensatoryLeave
        fields = [
            'id', 'employee', 'employee_name',
            'work_date', 'work_type', 'reason',
            'days_credited', 'expiry_date',
            'status', 'approved_by', 'approved_at',
            'rejection_reason', 'created_at'
        ]
        read_only_fields = [
            'id', 'employee_name', 'days_credited', 'expiry_date',
            'status', 'approved_by', 'approved_at', 'created_at'
        ]
