from django.contrib import admin
from apps.core.admin_mixins import OrganizationAwareAdminMixin
from .models import Conversation, ConversationParticipant, Message, MessageReaction


class ConversationParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0
    autocomplete_fields = ['user']
    readonly_fields = ['joined_at', 'last_read_at']


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['created_at']
    autocomplete_fields = ['sender']


@admin.register(Conversation)
class ConversationAdmin(OrganizationAwareAdminMixin, admin.ModelAdmin):
    list_display = (
        'id',
        'type',
        'name',
        'scope_id',
        'last_message_at',
        'created_at',
    )
    list_filter = ('type', 'created_at')
    search_fields = ('name', 'description', 'scope_id')
    readonly_fields = ('last_message_at', 'created_at', 'updated_at')
    inlines = [ConversationParticipantInline]
    ordering = ('-last_message_at',)


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(OrganizationAwareAdminMixin, admin.ModelAdmin):
    list_display = (
        'id',
        'conversation',
        'user',
        'role',
        'is_muted',
        'is_archived',
        'joined_at',
    )
    list_filter = ('role', 'is_muted', 'is_archived')
    search_fields = ('conversation__name', 'user__username', 'user__email')
    autocomplete_fields = ['conversation', 'user']
    readonly_fields = ('joined_at', 'last_read_at')


@admin.register(Message)
class MessageAdmin(OrganizationAwareAdminMixin, admin.ModelAdmin):
    list_display = (
        'id',
        'conversation',
        'sender',
        'short_content',
        'is_system_message',
        'created_at',
    )
    list_filter = ('is_system_message', 'created_at')
    search_fields = ('content', 'sender__username', 'conversation__name')
    autocomplete_fields = ['conversation', 'sender', 'reply_to']
    readonly_fields = ('created_at', 'updated_at')
    inlines = []  # You can add reactions inline if you want

    def short_content(self, obj):
        return obj.content[:50] + "..." if obj.content and len(obj.content) > 50 else obj.content

    short_content.short_description = "Content"


@admin.register(MessageReaction)
class MessageReactionAdmin(OrganizationAwareAdminMixin, admin.ModelAdmin):
    list_display = ('id', 'message', 'user', 'reaction', 'created_at')
    list_filter = ('reaction', 'created_at')
    search_fields = ('message__content', 'user__username', 'reaction')
    autocomplete_fields = ['message', 'user']
