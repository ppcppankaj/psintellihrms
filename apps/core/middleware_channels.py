"""
Organization Channels Middleware - Multi-Tenancy for WebSockets
Resolves organization context for ASGI/Channels connections.
"""

import logging
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from apps.core.context import set_current_organization, set_current_user, clear_context

logger = logging.getLogger(__name__)

class OrganizationChannelsMiddleware(BaseMiddleware):
    """
    Middleware to resolve organization context for WebSocket connections.
    Should be wrapped around AuthMiddlewareStack.
    """

    async def __call__(self, scope, receive, send):
        # Start clean
        clear_context()
        
        user = scope.get('user')
        if not user or not user.is_authenticated:
            return await super().__call__(scope, receive, send)

        # Set user context (async-safe via contextvars)
        set_current_user(user)
        
        # Resolve organization
        organization = await self.get_organization(user)
        if organization:
            scope['organization'] = organization
            set_current_organization(organization)
            logger.debug(f"WebSocket context set for Org: {organization.name}")
        
        try:
            return await super().__call__(scope, receive, send)
        finally:
            # Cleanup
            clear_context()

    @database_sync_to_async
    def get_organization(self, user):
        """
        Database lookup for user's organization.
        """
        try:
            if hasattr(user, 'organization') and user.organization:
                return user.organization
            
            # Fallback for superusers if needed, though they usually 
            # don't have a default org.
            return None
        except Exception as e:
            logger.error(f"Error resolving organization for WebSocket: {e}")
            return None
