"""Billing ViewSets"""
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Plan, Subscription, Invoice, Payment, BankDetails
from .serializers import (
    PlanSerializer, SubscriptionSerializer, InvoiceSerializer, 
    PaymentSerializer, BankDetailsSerializer, UpgradeDowngradeSerializer,
    ProcessPaymentSerializer
)
from apps.core.permissions import IsSuperAdmin

class PlanViewSet(viewsets.ModelViewSet):
    """
    Plans:
    - Super Admin: CRUD
    - Tenants: Read Only
    """
    queryset = Plan.objects.none()
    serializer_class = PlanSerializer
    
    def get_queryset(self):
        return Plan.objects.filter()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()] # Or IsAuthenticated & IsSuperUser
        return [permissions.IsAuthenticated()]

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    Subscriptions:
    - Managed via Admin usually, or auto-created.
    - Tenants should see their own.
    """
    queryset = Subscription.objects.none()
    serializer_class = SubscriptionSerializer
    filterset_fields = ['status', 'organization', 'plan']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'is_superuser') and user.is_superuser:
            return Subscription.objects.filter()
            
        # For tenants, show only their subscription
        org = getattr(self.request, 'organization', None)
        if not org and hasattr(user, 'get_organization'):
            org = user.get_organization()
            
        if org:
            return Subscription.objects.filter(organization=org)
        return Subscription.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def upgrade(self, request, pk=None):
        """Upgrade subscription to a higher plan"""
        subscription = self.get_object()
        serializer = UpgradeDowngradeSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                new_plan = Plan.objects.get(id=serializer.validated_data['plan_id'])
            except Plan.DoesNotExist:
                return Response(
                    {'success': False, 'message': 'Plan not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            current_price = subscription.plan.price_monthly if subscription.billing_cycle == 'monthly' else subscription.plan.price_yearly
            new_price = new_plan.price_monthly if subscription.billing_cycle == 'monthly' else new_plan.price_yearly
            
            if new_price <= current_price:
                return Response(
                    {'success': False, 'message': 'Upgrade requires a higher-priced plan. Use downgrade for lower plans.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            old_plan = subscription.plan
            subscription.plan = new_plan
            subscription.price = new_price
            if serializer.validated_data.get('billing_cycle'):
                subscription.billing_cycle = serializer.validated_data['billing_cycle']
            subscription.save()
            
            return Response({
                'success': True,
                'message': f'Subscription upgraded from {old_plan.name} to {new_plan.name}',
                'data': SubscriptionSerializer(subscription).data,
                'proration_note': 'Prorated charges will be applied to next invoice' if serializer.validated_data.get('prorate', True) else None
            })
        
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def downgrade(self, request, pk=None):
        """Downgrade subscription to a lower plan"""
        subscription = self.get_object()
        serializer = UpgradeDowngradeSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                new_plan = Plan.objects.get(id=serializer.validated_data['plan_id'])
            except Plan.DoesNotExist:
                return Response(
                    {'success': False, 'message': 'Plan not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            current_price = subscription.plan.price_monthly if subscription.billing_cycle == 'monthly' else subscription.plan.price_yearly
            new_price = new_plan.price_monthly if subscription.billing_cycle == 'monthly' else new_plan.price_yearly
            
            if new_price >= current_price:
                return Response(
                    {'success': False, 'message': 'Downgrade requires a lower-priced plan. Use upgrade for higher plans.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            old_plan = subscription.plan
            subscription.plan = new_plan
            subscription.price = new_price
            if serializer.validated_data.get('billing_cycle'):
                subscription.billing_cycle = serializer.validated_data['billing_cycle']
            subscription.save()
            
            return Response({
                'success': True,
                'message': f'Subscription downgraded from {old_plan.name} to {new_plan.name}. Changes take effect at next billing cycle.',
                'data': SubscriptionSerializer(subscription).data
            })
        
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def calculate_usage(self, request, pk=None):
        """Calculate usage-based billing for a subscription"""
        subscription = self.get_object()
        
        from apps.employees.models import Employee
        from decimal import Decimal
        
        employee_count = Employee.objects.filter(
            organization=subscription.organization,
            is_deleted=False,
            is_active=True
        ).count()
        
        max_employees = subscription.plan.max_employees
        overage_count = max(0, employee_count - (max_employees or 0)) if max_employees else 0
        
        base_price = subscription.price
        overage_rate = Decimal('10.00')
        overage_charge = Decimal(overage_count) * overage_rate
        total_amount = base_price + overage_charge
        
        return Response({
            'success': True,
            'data': {
                'subscription_id': subscription.id,
                'organization_name': subscription.organization.name,
                'billing_period_start': str(subscription.start_date),
                'billing_period_end': str(subscription.end_date),
                'employee_count': employee_count,
                'max_employees': max_employees,
                'overage_count': overage_count,
                'overage_rate_per_employee': str(overage_rate),
                'base_price': str(base_price),
                'overage_charge': str(overage_charge),
                'total_amount': str(total_amount)
            }
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        subscription = self.get_object()
        subscription.status = 'cancelled'
        subscription.save(update_fields=['status'])
        return Response({'success': True, 'data': SubscriptionSerializer(subscription).data})

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        subscription = self.get_object()
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        return Response({'success': True, 'data': SubscriptionSerializer(subscription).data})

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Invoices:
    - Super Admin: CRUD (Create manually)
    - Tenants: Read List/Retrieve own
    """
    queryset = Invoice.objects.none()
    serializer_class = InvoiceSerializer
    filterset_fields = ['status', 'subscription']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'is_superuser') and user.is_superuser:
            return Invoice.objects.filter()
        
        # Tenants view their own invoices
        org = getattr(self.request, 'organization', None)
        if not org and hasattr(user, 'get_organization'):
            org = user.get_organization()
            
        if org:
            return Invoice.objects.filter(organization=org)
        return Invoice.objects.none()
        
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        """Generate PDF for an invoice"""
        invoice = self.get_object()
        
        try:
            from django.template.loader import render_to_string
            from django.http import HttpResponse
            from io import BytesIO
            
            context = {
                'invoice': invoice,
                'subscription': invoice.subscription,
                'organization': invoice.subscription.organization,
                'items': [
                    {
                        'description': f'{invoice.subscription.plan.name} - {invoice.subscription.billing_cycle.capitalize()}',
                        'amount': invoice.amount
                    }
                ],
                'subtotal': invoice.amount,
                'tax': invoice.tax,
                'total': invoice.total
            }
            
            try:
                from weasyprint import HTML
                html_string = render_to_string('billing/invoice_pdf.html', context)
                html = HTML(string=html_string)
                pdf_file = BytesIO()
                html.write_pdf(pdf_file)
                pdf_file.seek(0)
                
                response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
                return response
            except ImportError:
                return Response({
                    'success': True,
                    'message': 'PDF generation placeholder - WeasyPrint not installed',
                    'data': {
                        'invoice_number': invoice.invoice_number,
                        'organization': invoice.subscription.organization.name,
                        'amount': str(invoice.amount),
                        'tax': str(invoice.tax),
                        'total': str(invoice.total),
                        'status': invoice.status,
                        'due_date': str(invoice.due_date),
                        'billing_period': f'{invoice.billing_period_start} to {invoice.billing_period_end}'
                    }
                })
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Error generating PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=['status', 'paid_at'])
        return Response({'success': True, 'data': InvoiceSerializer(invoice).data})

    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'failed'
        invoice.save(update_fields=['status'])
        return Response({'success': True, 'data': InvoiceSerializer(invoice).data})

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.none()
    serializer_class = PaymentSerializer
    filterset_fields = ['status', 'invoice']

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Payment.objects.filter()
            
        org = getattr(self.request, 'organization', None)
        if not org and hasattr(user, 'get_organization'):
            org = user.get_organization()
            
        if org:
            return Payment.objects.filter(organization=org)
        return Payment.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def mark_success(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'success'
        payment.save(update_fields=['status'])
        return Response({'success': True, 'data': PaymentSerializer(payment).data})

    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return Response({'success': True, 'data': PaymentSerializer(payment).data})

class BankDetailsViewSet(viewsets.ModelViewSet):
    """
    Bank Details:
    - Super Admin: CRUD
    - Tenants: Read Only
    """
    queryset = BankDetails.objects.none() # Required for router basename, overridden by get_queryset
    serializer_class = BankDetailsSerializer
    
    def get_queryset(self):
        # Always fetch bank details (Provider's bank details)
        return BankDetails.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]


class ProcessPaymentView(APIView):
    """Endpoint stub for processing payments via payment gateway"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Process payment through payment gateway.
        This is a stub that should be integrated with actual payment gateway (Razorpay, Stripe, etc.)
        """
        serializer = ProcessPaymentSerializer(data=request.data)
        
        if serializer.is_valid():
            invoice_id = serializer.validated_data['invoice_id']
            payment_method = serializer.validated_data['payment_method']
            payment_details = serializer.validated_data.get('payment_details', {})
            
            try:
                invoice = Invoice.objects.get(id=invoice_id)
            except Invoice.DoesNotExist:
                return Response(
                    {'success': False, 'message': 'Invoice not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if invoice.status == 'paid':
                return Response(
                    {'success': False, 'message': 'Invoice is already paid'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            import uuid
            transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
            
            payment = Payment.objects.create(
                invoice=invoice,
                amount=invoice.total,
                payment_method=payment_method,
                transaction_id=transaction_id,
                status='pending',
                gateway_response={
                    'stub': True,
                    'message': 'Payment gateway integration pending',
                    'payment_details': payment_details
                }
            )
            
            return Response({
                'success': True,
                'message': 'Payment initiated (stub - integrate with actual payment gateway)',
                'data': {
                    'payment_id': str(payment.id),
                    'transaction_id': transaction_id,
                    'amount': str(invoice.total),
                    'status': 'pending',
                    'next_steps': [
                        'Integrate with Razorpay/Stripe/PayU',
                        'Implement webhook handler for payment confirmation',
                        'Update invoice status on successful payment'
                    ]
                }
            })
        
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
