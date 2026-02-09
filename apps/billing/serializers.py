"""Billing Serializers"""
from rest_framework import serializers
from .models import Plan, Subscription, Invoice, Payment, BankDetails


class BankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetails
        fields = [
            'id', 'organization', 'account_name', 'account_number',
            'bank_name', 'ifsc_code', 'swift_code', 'branch_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'code', 'description',
            'price_monthly', 'price_yearly',
            'max_employees', 'max_admins', 'features',
            'is_trial', 'trial_days',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = PlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'organization', 'plan', 'plan_details',
            'billing_cycle', 'price', 'start_date', 'end_date',
            'next_billing_date', 'status', 'payment_method',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Auto-calculate next_billing_date if not provided
        if 'next_billing_date' not in validated_data:
            from datetime import timedelta
            start_date = validated_data.get('start_date')
            billing_cycle = validated_data.get('billing_cycle', 'monthly')
            # Simple calculation: monthly = 30 days, yearly = 365 days
            
            if billing_cycle == 'yearly':
                validated_data['next_billing_date'] = start_date + timedelta(days=365)
            else:
                validated_data['next_billing_date'] = start_date + timedelta(days=30)
        
        return super().create(validated_data)


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'organization', 'subscription', 'invoice_number',
            'amount', 'tax', 'total',
            'billing_period_start', 'billing_period_end',
            'status', 'due_date', 'paid_at', 'pdf_file',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'organization', 'invoice', 'amount', 'payment_method',
            'transaction_id', 'status', 'gateway_response',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class UpgradeDowngradeSerializer(serializers.Serializer):
    """Serializer for subscription upgrade/downgrade"""
    plan_id = serializers.IntegerField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'], required=False)
    prorate = serializers.BooleanField(default=True)


class ProcessPaymentSerializer(serializers.Serializer):
    """Serializer for processing payments"""
    invoice_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=['card', 'bank_transfer', 'upi', 'wallet'])
    payment_details = serializers.JSONField(required=False, default=dict)


class UsageCalculationSerializer(serializers.Serializer):
    """Serializer for usage calculation response"""
    subscription_id = serializers.IntegerField()
    organization_name = serializers.CharField()
    billing_period_start = serializers.DateField()
    billing_period_end = serializers.DateField()
    employee_count = serializers.IntegerField()
    max_employees = serializers.IntegerField(allow_null=True)
    overage_count = serializers.IntegerField()
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    overage_charge = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
