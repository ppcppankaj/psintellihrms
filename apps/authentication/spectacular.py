"""
OpenAPI Extensions for Authentication

Provides drf-spectacular schema extensions for custom authentication classes.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class OrganizationAwareJWTScheme(OpenApiAuthenticationExtension):
    """
    OpenAPI extension for OrganizationAwareJWTAuthentication.
    
    Ensures the custom JWT authentication with tenant binding is correctly
    represented in the OpenAPI schema.
    """
    target_class = 'apps.authentication.authentication.OrganizationAwareJWTAuthentication'
    name = 'OrganizationAwareJWT'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': 'JWT token with organization_id claim for tenant isolation. '
                          'Include in Authorization header as: Bearer <token>',
        }
