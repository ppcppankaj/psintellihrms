"""Billing URLs"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlanViewSet, SubscriptionViewSet, InvoiceViewSet, PaymentViewSet,
    BankDetailsViewSet, ProcessPaymentView
)

router = DefaultRouter()
router.register(r'plans', PlanViewSet)
router.register(r'subscriptions', SubscriptionViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'bank-details', BankDetailsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('process-payment/', ProcessPaymentView.as_view(), name='process-payment'),
]
