"""
Employee Serializers
"""

from rest_framework import serializers

from .models import (
    Employee, Department, Designation, Location,
    EmployeeAddress, EmployeeBankAccount, EmergencyContact,
    EmployeeDependent, Skill, EmployeeSkill,
    EmploymentHistory, Document, Certification,
    EmployeeTransfer, EmployeePromotion, ResignationRequest, ExitInterview
)


# =========================
# SAFE SERIALIZERS (UNCHANGED)
# =========================

class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    head_name = serializers.CharField(source='head.full_name', read_only=True)

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'description', 'parent', 'parent_name',
            'head', 'head_name', 'cost_center', 'employee_count', 'is_active'
        ]
        read_only_fields = ['id']

    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = [
            'id', 'name', 'code', 'description', 'level',
            'grade', 'job_family', 'min_salary', 'max_salary', 'is_active'
        ]
        read_only_fields = ['id']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'code', 'address_line1', 'address_line2',
            'city', 'state', 'country', 'postal_code',
            'latitude', 'longitude', 'geo_fence_radius',
            'phone', 'email', 'timezone', 'is_headquarters', 'is_active'
        ]
        read_only_fields = ['id']


class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    first_name = serializers.ReadOnlyField(source='user.first_name')
    last_name = serializers.ReadOnlyField(source='user.last_name')
    email = serializers.ReadOnlyField()
    phone = serializers.ReadOnlyField(source='user.phone')
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    manager_name = serializers.CharField(source='reporting_manager.full_name', read_only=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'avatar',
            'department_name', 'designation_name', 'location_name',
            'manager_name', 'employment_type', 'employment_status',
            'date_of_joining', 'is_active'
        ]



class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class EmployeeSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    class Meta:
        model = EmployeeSkill
        fields = ['id', 'employee', 'skill', 'proficiency', 'years_of_experience', 'skill_name']
        read_only_fields = ['id']

class EmployeeAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAddress
        fields = '__all__'
        read_only_fields = ['id']

class EmployeeBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeBankAccount
        fields = '__all__'
        read_only_fields = ['id']

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = '__all__'
        read_only_fields = ['id']

class EmployeeDependentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDependent
        fields = '__all__'
        read_only_fields = ['id']

class EmploymentHistorySerializer(serializers.ModelSerializer):
    previous_department_name = serializers.CharField(source='previous_department.name', read_only=True)
    new_department_name = serializers.CharField(source='new_department.name', read_only=True)
    previous_designation_name = serializers.CharField(source='previous_designation.name', read_only=True)
    new_designation_name = serializers.CharField(source='new_designation.name', read_only=True)
    
    class Meta:
        model = EmploymentHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'file_size', 'file_type']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class CertificationSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()
    certificate_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Certification
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified', 'verified_by', 'verified_at']

    def get_certificate_file_url(self, obj):
        if obj.certificate_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.certificate_file.url)
            return obj.certificate_file.url
        return None

    def validate_employee(self, employee):
        request = self.context.get('request')
        if request and employee.organization_id != request.organization.id:
            raise serializers.ValidationError("Employee does not belong to this organization.")
        return employee


class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    role_ids = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    
    # Nested Write Fields
    skills = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    bank_account = serializers.DictField(required=False, write_only=True)
    salary_structure = serializers.DictField(required=False, write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'department', 'designation', 'location', 'reporting_manager', 
            'employment_type', 'employment_status', 'date_of_joining',
            'email', 'first_name', 'last_name', 'phone', 'password', 'role_ids',
            'gender', 'date_of_birth', 'marital_status', 'blood_group',
            'employee_id', 'skills', 'bank_account', 'salary_structure'
        ]

class EmployeeUpdateSerializer(serializers.ModelSerializer):
    role_ids = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    
    # Nested Write Fields
    skills = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    bank_account = serializers.DictField(required=False, write_only=True)
    salary_structure = serializers.DictField(required=False, write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'department', 'designation', 'location', 'reporting_manager', 
            'employment_type', 'employment_status', 'date_of_joining',
            'gender', 'date_of_birth', 'marital_status', 'blood_group',
            'first_name', 'last_name', 'role_ids', 'is_active',
            'skills', 'bank_account', 'salary_structure'
        ]

class EmployeeDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    first_name = serializers.ReadOnlyField(source='user.first_name')
    last_name = serializers.ReadOnlyField(source='user.last_name')
    email = serializers.ReadOnlyField()
    phone = serializers.ReadOnlyField(source='user.phone')
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    manager_name = serializers.CharField(source='reporting_manager.full_name', read_only=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    addresses = EmployeeAddressSerializer(many=True, read_only=True)
    bank_accounts = EmployeeBankAccountSerializer(many=True, read_only=True)
    skills = EmployeeSkillSerializer(many=True, read_only=True)
    dependents = EmployeeDependentSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'avatar',
            'department', 'department_name', 
            'designation', 'designation_name', 
            'location', 'location_name',
            'reporting_manager', 'manager_name', 
            'employment_type', 'employment_status', 'date_of_joining', 
            'gender', 'date_of_birth', 'marital_status', 'blood_group',
            'addresses', 'bank_accounts', 'skills', 'dependents', 'documents',
            'is_active', 'created_at', 'updated_at'
        ]

class OrgChartSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    name = serializers.ReadOnlyField(source='full_name')
    title = serializers.ReadOnlyField(source='designation.name')
    
    class Meta:
        model = Employee
        fields = ['id', 'name', 'title', 'avatar', 'children']
    
    def get_children(self, obj):
        if hasattr(obj, 'direct_reports'):
             return OrgChartSerializer(obj.direct_reports.filter(is_active=True), many=True).data
        return []

class EmployeeBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()

class DepartmentBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()

class DesignationBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()


# =========================
# 🔒 HARDENED SERIALIZERS
# =========================

class EmployeeTransferSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    from_department = serializers.PrimaryKeyRelatedField(source='department', queryset=Department.objects.all(), required=False, allow_null=True)
    from_department_name = serializers.CharField(source='department.name', read_only=True)
    to_department_name = serializers.CharField(source='to_department.name', read_only=True)
    from_location = serializers.PrimaryKeyRelatedField(source='location', queryset=Location.objects.all(), required=False, allow_null=True)
    from_location_name = serializers.CharField(source='location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    from_manager = serializers.PrimaryKeyRelatedField(source='employee.reporting_manager', read_only=True)
    from_manager_name = serializers.CharField(source='employee.reporting_manager.full_name', read_only=True)
    to_manager_name = serializers.CharField(source='to_manager.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    transfer_type_display = serializers.CharField(source='get_transfer_type_display', read_only=True)
    remarks = serializers.CharField(source='reason', required=False, allow_blank=True)

    class Meta:
        model = EmployeeTransfer
        fields = [
            'id',
            'employee',
            'employee_name',
            'transfer_type',
            'from_department',
            'from_department_name',
            'to_department',
            'to_department_name',
            'from_location',
            'from_location_name',
            'to_location',
            'to_location_name',
            'from_manager',
            'from_manager_name',
            'to_manager',
            'to_manager_name',
            'effective_date',
            'remarks',
            'status',
            'status_display',
            'transfer_type_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'employee_name',
            'from_department_name',
            'to_department_name',
            'from_location_name',
            'to_location_name',
            'from_manager',
            'from_manager_name',
            'to_manager_name',
            'status',
            'initiated_by',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
        ]

    def validate_employee(self, employee):
        request = self.context['request']
        if employee.organization_id != request.organization.id:
            raise serializers.ValidationError("Employee does not belong to this organization.")
        return employee


class EmployeePromotionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    from_designation_name = serializers.CharField(source='from_designation.name', read_only=True)
    to_designation_name = serializers.CharField(source='to_designation.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remarks = serializers.CharField(source='reason', required=False, allow_blank=True)

    class Meta:
        model = EmployeePromotion
        fields = [
            'id',
            'employee',
            'employee_name',
            'from_designation',
            'from_designation_name',
            'to_designation',
            'to_designation_name',
            'effective_date',
            'remarks',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'employee_name',
            'from_designation_name',
            'to_designation_name',
            'status',
            'recommended_by',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
        ]

    def validate_employee(self, employee):
        request = self.context['request']
        if employee.organization_id != request.organization.id:
            raise serializers.ValidationError("Employee does not belong to this organization.")
        return employee


class ResignationRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    primary_reason_display = serializers.CharField(source='get_primary_reason_display', read_only=True)
    secondary_reason = serializers.CharField(source='detailed_reason', required=False, allow_blank=True)
    last_working_date = serializers.DateField(source='requested_last_working_date', required=False)
    remarks = serializers.CharField(source='detailed_reason', read_only=True)

    class Meta:
        model = ResignationRequest
        fields = [
            'id',
            'employee',
            'employee_name',
            'primary_reason',
            'secondary_reason',
            'last_working_date',
            'remarks',
            'status',
            'status_display',
            'primary_reason_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'employee_name',
            'remarks',
            'status',
            'accepted_by',
            'accepted_at',
            'created_at',
            'updated_at',
        ]

    def validate_employee(self, employee):
        request = self.context['request']
        if employee.organization_id != request.organization.id:
            raise serializers.ValidationError("Employee does not belong to this organization.")
        return employee


class ExitInterviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    interviewer_name = serializers.CharField(source='interviewer.full_name', read_only=True)
    average_rating = serializers.ReadOnlyField()
    responses = serializers.JSONField(source='additional_feedback', required=False)

    class Meta:
        model = ExitInterview
        fields = [
            'id',
            'employee',
            'employee_name',
            'interviewer',
            'interviewer_name',
            'responses',
            'average_rating',
            'is_completed',
            'completed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'employee_name',
            'interviewer_name',
            'average_rating',
            'is_completed',
            'completed_at',
            'created_at',
            'updated_at',
        ]

    def validate_employee(self, employee):
        request = self.context['request']
        if employee.organization_id != request.organization.id:
            raise serializers.ValidationError("Employee does not belong to this organization.")
        return employee
