from django.db import models
from django.conf import settings
from apps.core.models import OrganizationEntity
from django.utils.translation import gettext_lazy as _

class Conversation(OrganizationEntity):
    """
    Represents a chat conversation.
    Can be a direct message (1:1), a group chat, a department chat, etc.
    """
    class Type(models.TextChoices):
        DIRECT = 'direct', _('Direct Message')
        GROUP = 'group', _('Group Chat')
        DEPARTMENT = 'department', _('Department Chat')
        ANNOUNCEMENT = 'announcement', _('Announcement Channel')
        # PROJECT = 'project', _('Project Chat') # Future scope

    type = models.CharField(max_length=20, choices=Type.choices, default=Type.DIRECT)
    name = models.CharField(max_length=255, blank=True, null=True, help_text="Required for Group/Department chats")
    description = models.TextField(blank=True, null=True)
    
    # Optional linking to other entities
    # For Department chats, scope_id could be the Department ID
    scope_id = models.CharField(max_length=255, blank=True, null=True) 
    
    last_message_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name or f"{self.get_type_display()} ({self.id})"

class ConversationParticipant(OrganizationEntity):
    """
    Links users to conversations with specific roles and state.
    """
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        MEMBER = 'member', _('Member')
        
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    # State
    last_read_at = models.DateTimeField(auto_now_add=True)
    is_muted = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('conversation', 'user')
        
    def __str__(self):
        return f"{self.user} in {self.conversation}"

class Message(OrganizationEntity):
    """
    A single message in a conversation.
    """
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='sent_messages')
    
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    
    is_system_message = models.BooleanField(default=False, help_text="If true, sender is ignored/system")
    
    # Reply support
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        return f"Message {self.id} from {self.sender}"

class MessageReaction(OrganizationEntity):
    """
    Reactions to messages (e.g., thumbs up, heart).
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction = models.CharField(max_length=50) # store emoji char or code
    
    class Meta:
        unique_together = ('message', 'user', 'reaction')
