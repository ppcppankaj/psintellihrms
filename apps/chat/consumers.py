"""
Chat Consumers - WebSocket handlers for real-time chat
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat messages.
    Handles:
    - Joining conversation rooms
    - Sending/receiving messages
    - Typing indicators
    - Read receipts
    """
    
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Get conversation ID from URL route
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        self.room_group_name = f"chat_{self.conversation_id}"
        
        # Verify user is a participant
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify others that user is online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_online',
                'user_id': str(self.user.id),
                'username': self.user.full_name,
            }
        )
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Notify others that user went offline
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_offline',
                    'user_id': str(self.user.id),
                }
            )
            
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)
        elif message_type == 'read_receipt':
            await self.handle_read_receipt(data)
    
    async def handle_chat_message(self, data):
        """Process and broadcast a new chat message"""
        content = data.get('content', '')
        
        if not content.strip():
            return
        
        # Save message to database
        message = await self.save_message(content)
        
        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': str(message.id),
                'content': message.content,
                'sender_id': str(self.user.id),
                'sender_name': self.user.full_name,
                'created_at': message.created_at.isoformat(),
            }
        )
    
    async def handle_typing(self, data):
        """Broadcast typing indicator"""
        is_typing = data.get('is_typing', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': str(self.user.id),
                'username': self.user.full_name,
                'is_typing': is_typing,
            }
        )
    
    async def handle_read_receipt(self, data):
        """Update read status and broadcast"""
        await self.update_last_read()
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'read_receipt',
                'user_id': str(self.user.id),
                'read_at': timezone.now().isoformat(),
            }
        )
    
    # ----- Event handlers (receive broadcasts from group) -----
    
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'content': event['content'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'created_at': event['created_at'],
        }))
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        # Don't send to the user who is typing
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))
    
    async def read_receipt(self, event):
        """Send read receipt to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event['user_id'],
            'read_at': event['read_at'],
        }))
    
    async def user_online(self, event):
        """Notify that a user came online"""
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'user_online',
                'user_id': event['user_id'],
                'username': event['username'],
            }))
    
    async def user_offline(self, event):
        """Notify that a user went offline"""
        await self.send(text_data=json.dumps({
            'type': 'user_offline',
            'user_id': event['user_id'],
        }))
    
    # ----- Database helpers -----
    
    @database_sync_to_async
    def check_participant(self):
        from .models import ConversationParticipant
        return ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user
        ).exists()
    
    @database_sync_to_async
    def save_message(self, content):
        from .models import Message, Conversation
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        return message
    
    @database_sync_to_async
    def update_last_read(self):
        from .models import ConversationParticipant
        ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user
        ).update(last_read_at=timezone.now())
