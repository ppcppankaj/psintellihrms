"""Billing Serializers"""
from rest_framework import serializers
from .models import Plan, Subscription, Invoice, Payment, BankDetails

class BankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetails
        fields = '__all__'

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = PlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'
    
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
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


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
