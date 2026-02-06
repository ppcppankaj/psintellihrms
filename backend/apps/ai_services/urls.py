"""AI URLs"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIModelVersionViewSet, AIPredictionViewSet

router = DefaultRouter()
router.register(r'models', AIModelVersionViewSet)
router.register(r'predictions', AIPredictionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
