"""
Chat Serializers
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Count
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import Conversation, ConversationParticipant, Message, MessageReaction

User = get_user_model()


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user info for chat display"""
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'avatar']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender = UserMiniSerializer(read_only=True)
    reactions_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 'attachment',
            'is_system_message', 'reply_to', 'reactions_summary',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']
    
    @extend_schema_field({'type': 'object', 'additionalProperties': {'type': 'integer'}})
    def get_reactions_summary(self, obj):
        """Returns a dict of reaction counts, e.g., {'👍': 3, '❤️': 1}"""
        summary = obj.reactions.values('reaction').annotate(count=Count('id'))
        return {item['reaction']: item['count'] for item in summary}


class ConversationParticipantSerializer(serializers.ModelSerializer):
    """Serializer for conversation participants"""
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = ConversationParticipant
        fields = ['id', 'user', 'role', 'joined_at', 'last_read_at', 'is_muted', 'is_archived']


class ConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing conversations"""
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participants_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'type', 'name', 'description', 'last_message_at',
            'last_message', 'unread_count', 'participants_preview'
        ]
    
    @extend_schema_field({'type': 'object', 'nullable': True, 'properties': {'content': {'type': 'string'}, 'sender_name': {'type': 'string'}, 'created_at': {'type': 'string', 'format': 'date-time'}}})
    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {
                'content': last.content[:100],
                'sender_name': last.sender.full_name if last.sender else 'System',
                'created_at': last.created_at.isoformat()
            }
        return None
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_unread_count(self, obj):
        user = self.context.get('request').user
        participant = obj.participants.filter(user=user).first()
        if participant:
            return obj.messages.filter(created_at__gt=participant.last_read_at).exclude(sender=user).count()
        return 0
    
    @extend_schema_field({'type': 'array', 'items': {'type': 'object'}})
    def get_participants_preview(self, obj):
        # Return first 3 participants (excluding current user for direct chats)
        user = self.context.get('request').user
        participants = obj.participants.exclude(user=user).select_related('user')[:3]
        return UserMiniSerializer([p.user for p in participants], many=True).data


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single conversation"""
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'type', 'name', 'description', 'scope_id',
            'participants', 'last_message_at', 'created_at'
        ]


class CreateDirectConversationSerializer(serializers.Serializer):
    """Create a 1:1 direct message conversation"""
    user_id = serializers.UUIDField()
    initial_message = serializers.CharField(required=False, allow_blank=True)


class CreateGroupConversationSerializer(serializers.Serializer):
    """Create a group chat"""
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    user_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)


class SendMessageSerializer(serializers.Serializer):
    """Send a message to a conversation"""
    content = serializers.CharField(required=False, allow_blank=True)
    attachment = serializers.FileField(required=False, allow_null=True)
    reply_to_id = serializers.UUIDField(required=False, allow_null=True)
    
    def validate(self, attrs):
        if not attrs.get('content') and not attrs.get('attachment'):
            raise serializers.ValidationError("Message must have content or an attachment.")
        return attrs
