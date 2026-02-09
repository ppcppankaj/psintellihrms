from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import (
    EmployeeSalary, PayrollRun, Payslip, TaxDeclaration, ReimbursementClaim,
    EmployeeLoan, LoanRepayment
)
from apps.employees.serializers import EmployeeListSerializer


class EmployeeSalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.full_name')

    class Meta:
        model = EmployeeSalary
        fields = [
            'id', 'organization', 'employee', 'employee_name',
            'effective_from', 'effective_to', 'is_active',
            'basic', 'hra', 'da', 'special_allowance', 'conveyance', 'medical_allowance', 'lta',
            'other_allowances', 'performance_bonus', 'variable_pay', 'arrears',
            'pf_employee', 'esi_employee', 'professional_tax', 'tds', 'other_deductions',
            'pf_employer', 'esi_employer', 'gratuity',
            'annual_ctc', 'monthly_gross', 'total_deductions', 'net_salary',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'annual_ctc', 'monthly_gross', 'total_deductions', 'net_salary', 'created_at', 'updated_at']


class PayrollRunSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PayrollRun
        fields = [
            'id', 'branch', 'month', 'year', 'status', 'status_display',
            'pay_date', 'total_employees', 'total_gross', 'total_deductions',
            'total_net', 'processed_at', 'approved_at', 'locked_at', 'paid_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class PayslipListSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.full_name')
    employee_id = serializers.ReadOnlyField(source='employee.employee_id')
    month = serializers.ReadOnlyField(source='payroll_run.month')
    year = serializers.ReadOnlyField(source='payroll_run.year')

    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 
            'month', 'year', 'net_salary', 'created_at'
        ]


class PayslipSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    payroll_run_details = PayrollRunSerializer(source='payroll_run', read_only=True)

    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'payroll_run', 'employee_details', 'payroll_run_details',
            'gross_salary', 'total_deductions', 'net_salary', 
            'earnings_breakdown', 'deductions_breakdown', 'pdf_file', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TaxDeclarationSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.full_name')

    class Meta:
        model = TaxDeclaration
        fields = [
            'id', 'employee', 'employee_name', 'financial_year', 'tax_regime',
            'declarations', 'proofs_submitted', 'proofs_verified',
            'total_exemptions', 'taxable_income', 'annual_tax', 'monthly_tds',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_employee(self, employee):
        request = self.context['request']
        if employee.organization_id != request.organization.id:
            raise serializers.ValidationError("Employee does not belong to this organization.")
        return employee


class ReimbursementClaimListSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ReimbursementClaim
        fields = [
            'id', 'employee', 'employee_name', 'title', 'amount', 
            'status', 'status_display', 'submitted_at', 'created_at'
        ]


class ReimbursementClaimSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ReimbursementClaim
        fields = [
            'id', 'organization', 'employee', 'employee_details',
            'title', 'amount', 'description', 'bill',
            'status', 'status_display', 'submitted_at', 'approved_at', 'paid_at',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'status', 'submitted_at', 'approved_at', 'paid_at', 'created_at', 'updated_at']


class SalaryRevisionSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.full_name')
    revision_type = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeSalary
        fields = [
            'id', 'employee', 'employee_name', 'effective_from', 'effective_to',
            'is_active', 'basic', 'hra', 'da', 'special_allowance', 'conveyance',
            'medical_allowance', 'lta', 'other_allowances', 'pf_employee', 'esi_employee',
            'professional_tax', 'annual_ctc', 'monthly_gross', 'net_salary',
            'revision_type', 'created_at'
        ]

    @extend_schema_field({'type': 'string', 'enum': ['initial', 'increment', 'decrement', 'restructure']})
    def get_revision_type(self, obj):
        previous = EmployeeSalary.objects.filter(
            employee=obj.employee,
            effective_from__lt=obj.effective_from
        ).order_by('-effective_from').first()
        if not previous:
            return 'initial'
        if obj.annual_ctc > previous.annual_ctc:
            return 'increment'
        elif obj.annual_ctc < previous.annual_ctc:
            return 'decrement'
        return 'restructure'


class EmployeeLoanListSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.full_name')
    employee_id = serializers.ReadOnlyField(source='employee.employee_id')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    loan_type_display = serializers.CharField(source='get_loan_type_display', read_only=True)

    class Meta:
        model = EmployeeLoan
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'loan_type',
            'loan_type_display', 'principal_amount', 'emi_amount', 'outstanding_balance',
            'status', 'status_display', 'applied_at'
        ]


class EmployeeLoanSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    loan_type_display = serializers.CharField(source='get_loan_type_display', read_only=True)

    class Meta:
        model = EmployeeLoan
        fields = [
            'id', 'organization', 'employee', 'employee_details',
            'loan_type', 'loan_type_display', 'principal_amount', 'interest_rate', 'tenure_months',
            'emi_amount', 'total_repayable', 'amount_repaid', 'outstanding_balance',
            'status', 'status_display', 'reason',
            'applied_at', 'approved_at', 'disbursed_at', 'closed_at', 'approved_by',
            'deduct_from_salary', 'start_deduction_month', 'start_deduction_year',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization', 'status', 'emi_amount', 'total_repayable', 'amount_repaid',
            'outstanding_balance', 'applied_at', 'approved_at', 'disbursed_at',
            'closed_at', 'approved_by', 'created_at', 'updated_at'
        ]


class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRepayment
        fields = [
            'id', 'organization', 'loan', 'amount', 'repayment_date',
            'payslip', 'remarks', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']
