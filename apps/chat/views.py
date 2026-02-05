"""
Chat Views - REST API endpoints for chat functionality
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from django.utils import timezone

from apps.core.tenant_guards import OrganizationViewSetMixin
from .models import Conversation, ConversationParticipant, Message, MessageReaction
from .serializers import (
    ConversationListSerializer, ConversationDetailSerializer,
    MessageSerializer, CreateDirectConversationSerializer,
    CreateGroupConversationSerializer, SendMessageSerializer
)


class ConversationViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing conversations.
    Users can only see conversations they are a participant of.
    """
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            participants__user=user,
            participants__is_archived=False,
            is_deleted=False
        ).annotate(
            latest_message=Max('messages__created_at')
        ).order_by('-latest_message')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationListSerializer
    
    @action(detail=False, methods=['post'], url_path='start-direct')
    def start_direct(self, request):
        """Start or get existing 1:1 conversation with another user"""
        serializer = CreateDirectConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_user_id = serializer.validated_data['user_id']
        current_user = request.user
        
        # Look up the target user - could be User ID or Employee ID
        from django.contrib.auth import get_user_model
        from apps.employees.models import Employee
        User = get_user_model()
        
        target_user = None
        # First try as User ID
        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            # Try as Employee ID - get the linked user
            try:
                employee = Employee.objects.get(id=target_user_id)
                target_user = employee.user
            except Employee.DoesNotExist:
                pass
        
        if not target_user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check for existing direct conversation
        existing = Conversation.objects.filter(
            type=Conversation.Type.DIRECT,
            participants__user=current_user
        ).filter(
            participants__user=target_user
        ).first()
        
        if existing:
            return Response(ConversationDetailSerializer(existing).data)
        
        # Create new direct conversation
        conversation = Conversation.objects.create(type=Conversation.Type.DIRECT)
        ConversationParticipant.objects.create(conversation=conversation, user=current_user, role=ConversationParticipant.Role.MEMBER)
        ConversationParticipant.objects.create(conversation=conversation, user=target_user, role=ConversationParticipant.Role.MEMBER)
        
        # Send initial message if provided
        initial_message = serializer.validated_data.get('initial_message')
        if initial_message:
            Message.objects.create(conversation=conversation, sender=current_user, content=initial_message)
            conversation.last_message_at = timezone.now()
            conversation.save()
        
        return Response(ConversationDetailSerializer(conversation).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='create-group')
    def create_group(self, request):
        """Create a new group chat"""
        serializer = CreateGroupConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        current_user = request.user
        conversation = Conversation.objects.create(
            type=Conversation.Type.GROUP,
            name=serializer.validated_data['name'],
            description=serializer.validated_data.get('description', '')
        )
        
        # Add creator as admin
        ConversationParticipant.objects.create(
            conversation=conversation, user=current_user, role=ConversationParticipant.Role.ADMIN
        )
        
        # Add other members
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for user_id in serializer.validated_data['user_ids']:
            try:
                user = User.objects.get(id=user_id)
                ConversationParticipant.objects.get_or_create(
                    conversation=conversation, user=user,
                    defaults={'role': ConversationParticipant.Role.MEMBER}
                )
            except User.DoesNotExist:
                pass # Skip invalid user IDs
        
        return Response(ConversationDetailSerializer(conversation).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        participant = ConversationParticipant.objects.filter(
            conversation=conversation, user=request.user
        ).first()
        
        if participant:
            participant.last_read_at = timezone.now()
            participant.save()
            return Response({'status': 'marked as read'})
        return Response({'error': 'Not a participant'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True, methods=['post'])
    def mute(self, request, pk=None):
        """Mute/unmute a conversation"""
        conversation = self.get_object()
        participant = ConversationParticipant.objects.filter(
            conversation=conversation, user=request.user
        ).first()
        
        if participant:
            participant.is_muted = not participant.is_muted
            participant.save()
            return Response({'is_muted': participant.is_muted})
        return Response({'error': 'Not a participant'}, status=status.HTTP_403_FORBIDDEN)


class MessageViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """
    API endpoint for messages within a conversation.
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """Validate conversation + participant before listing messages"""
        conversation_id = request.query_params.get('conversation')
        if not conversation_id:
            return Response({'error': 'conversation parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        conversation = Conversation.objects.filter(id=conversation_id).first()
        if not conversation:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        is_participant = ConversationParticipant.objects.filter(
            conversation=conversation, user=request.user
        ).exists()
        if not is_participant:
            return Response({'error': 'Not a participant of this conversation'}, status=status.HTTP_403_FORBIDDEN)

        queryset = Message.objects.filter(
            conversation=conversation, is_deleted=False
        ).select_related('sender').order_by('created_at')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Safe create with participant + payload validation to avoid 500s"""
        conversation_id = request.data.get('conversation')
        if not conversation_id:
            return Response({'error': 'conversation is required'}, status=status.HTTP_400_BAD_REQUEST)

        conversation = Conversation.objects.filter(id=conversation_id).first()
        if not conversation:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        # Ensure the requester is a participant of this conversation
        is_participant = ConversationParticipant.objects.filter(
            conversation=conversation, user=request.user
        ).exists()
        if not is_participant:
            return Response({'error': 'Not a participant of this conversation'}, status=status.HTTP_403_FORBIDDEN)

        payload = SendMessageSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=payload.validated_data.get('content', ''),
            attachment=payload.validated_data.get('attachment'),
            reply_to_id=payload.validated_data.get('reply_to_id'),
        )

        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])

        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
    
    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get('conversation')
        
        if not conversation_id:
            return Message.objects.none()
        
        # Ensure user is a participant
        is_participant = ConversationParticipant.objects.filter(
            conversation_id=conversation_id, user=user
        ).exists()
        
        if not is_participant:
            return Message.objects.none()
        
        return Message.objects.filter(
            conversation_id=conversation_id, is_deleted=False
        ).select_related('sender').order_by('created_at')
    
    def perform_create(self, serializer):
        conversation_id = self.request.data.get('conversation')
        conversation = Conversation.objects.get(id=conversation_id)
        
        message = serializer.save(sender=self.request.user, conversation=conversation)
        
        # Update conversation last_message_at
        conversation.last_message_at = timezone.now()
        conversation.save()
        
        # TODO: Broadcast via WebSocket
        
        return message
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add a reaction to a message"""
        message = self.get_object()
        reaction_code = request.data.get('reaction')
        
        if not reaction_code:
            return Response({'error': 'Reaction code required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Toggle reaction
        existing = MessageReaction.objects.filter(message=message, user=request.user, reaction=reaction_code).first()
        if existing:
            existing.delete()
            return Response({'status': 'reaction removed'})
        else:
            MessageReaction.objects.create(message=message, user=request.user, reaction=reaction_code)
            return Response({'status': 'reaction added'})
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - only sender can delete their own message"""
        message = self.get_object()
        if message.sender != request.user:
            return Response({'error': 'Cannot delete other users messages'}, status=status.HTTP_403_FORBIDDEN)
        
        message.is_deleted = True
        message.content = "[Message deleted]"
        message.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
