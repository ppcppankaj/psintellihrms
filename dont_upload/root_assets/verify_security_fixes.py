#!/usr/bin/env python
"""
🔒 SECURITY VERIFICATION SCRIPT
Validates all 7 security fixes are properly implemented
"""

import sys
import os
import re

def check_file_contains(filepath, pattern, description):
    """Check if file contains pattern"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description}")
                return False
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False

def main():
    print("🔒 SECURITY HARDENING VERIFICATION\n")
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    checks = [
        # Fix 1: Organization field locked
        {
            'file': os.path.join(base_path, 'backend/apps/authentication/models.py'),
            'pattern': r'editable\s*=\s*False.*help_text.*organization',
            'desc': 'Fix 1: Organization field has editable=False'
        },
        # Fix 2: Self-edit prevention
        {
            'file': os.path.join(base_path, 'backend/apps/authentication/admin.py'),
            'pattern': r'def has_change_permission.*obj\.pk == request\.user\.pk.*return False',
            'desc': 'Fix 2: has_change_permission blocks self-edit'
        },
        # Fix 3: Readonly fields
        {
            'file': os.path.join(base_path, 'backend/apps/authentication/admin.py'),
            'pattern': r'def get_readonly_fields.*organization.*is_org_admin.*is_staff',
            'desc': 'Fix 3: get_readonly_fields locks critical fields'
        },
        # Fix 4: Hide organization field
        {
            'file': os.path.join(base_path, 'backend/apps/authentication/admin.py'),
            'pattern': r'def get_fields.*organization.*remove',
            'desc': 'Fix 4: get_fields hides organization field'
        },
        # Fix 5: Secure serializer
        {
            'file': os.path.join(base_path, 'backend/apps/authentication/serializers.py'),
            'pattern': r'class UserOrgAdminCreateSerializer.*validated_data\[.is_org_admin.\] = False',
            'desc': 'Fix 5: UserOrgAdminCreateSerializer forces is_org_admin=False'
        },
        # Fix 6: API ViewSet protection
        {
            'file': os.path.join(base_path, 'backend/apps/authentication/views.py'),
            'pattern': r'class UserManagementViewSet.*def update.*PermissionDenied.*organization',
            'desc': 'Fix 6: UserManagementViewSet blocks organization changes'
        },
        # Fix 7: Queryset isolation (already present)
        {
            'file': os.path.join(base_path, 'backend/apps/core/org_permissions.py'),
            'pattern': r'def get_queryset.*organization.*filter\(organization',
            'desc': 'Fix 7: OrgAdminMixin filters queryset by organization'
        },
    ]
    
    passed = 0
    failed = 0
    
    for check in checks:
        if check_file_contains(check['file'], check['pattern'], check['desc']):
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"SECURITY VERIFICATION RESULTS")
    print(f"{'='*60}")
    print(f"✅ Passed: {passed}/7")
    print(f"❌ Failed: {failed}/7")
    
    if failed == 0:
        print(f"\n🟢 ALL SECURITY FIXES VERIFIED ✅")
        return 0
    else:
        print(f"\n🔴 SOME FIXES MISSING - REVIEW REQUIRED")
        return 1

if __name__ == '__main__':
    sys.exit(main())
