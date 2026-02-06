# 🔧 Django Admin Tenant Access Guide

## ✅ **Solution Implemented**

I've added a **Tenant Switcher** to the Django admin that allows superusers to switch between tenant schemas and view tenant-specific data.

---

## 🎯 **How to Access Tenant Data in Django Admin**

### **Step 1: Login to Django Admin**
```
URL: http://localhost:8000/admin/
Email: admin@psintellhr.com
Password: admin123
```

### **Step 2: Switch to Tenant Context**
```
URL: http://localhost:8000/admin/switch-tenant/
```

Or click the **"Switch Tenant"** link in the admin sidebar (if you've added it to your admin templates).

### **Step 3: Select Your Tenant**

1. You'll see a dropdown list of all tenants
2. Select **PPCP (ppcp)** from the dropdown
3. Click **"Switch Tenant"**
4. You'll see a success message: "Switched to tenant: PPCP (ppcp)"

### **Step 4: View Tenant Data**

Now when you browse the Django admin, you'll see **tenant-specific data**:

- ✅ **Employees** (in the ppcp schema)
- ✅ **Attendance records** (in the ppcp schema)
- ✅ **Leave requests** (in the ppcp schema)
- ✅ **All other tenant-scoped models**

---

## 🔄 **Switching Back to Public Schema**

To see system-wide data (tenants, superusers, plans):

1. Go to: http://localhost:8000/admin/switch-tenant/
2. Select: **"-- Public Schema (No Tenant) --"**
3. Click **"Switch Tenant"**

---

## 📋 **What You'll See in Each Schema**

### **Public Schema** (No tenant selected)
- ✅ Tenants (list of all organizations)
- ✅ Domains  
- ✅ Subscription Plans
- ✅ System-wide settings
- ❌ No employees, attendance, or tenant-specific data

### **Tenant Schema** (e.g., PPCP selected)
- ✅ Employees
- ✅ Attendance Records
- ✅ Leave Requests
- ✅ Payroll Data
- ✅ Performance Reviews
- ✅ All tenant-scoped data
- ❌ Cannot see other tenants' data
- ❌ Cannot see system-wide tenant list

---

## 🔐 **Security Notes**

- **Only superusers** can switch tenants
- Regular tenant users cannot access the Django admin
- Tenant switching is session-based (persists until logout or manual switch)
- Each tenant's data is completely isolated

---

## 🎨 **Files Created/Modified**

### New Files:
1. **`backend/config/middleware/tenant_admin.py`** - Middleware for tenant switching
2. **`backend/apps/tenants/admin_views.py`** - View for tenant selection
3. **`backend/apps/tenants/admin_urls.py`** - URL routing for tenant switcher
4. **`backend/templates/admin/switch_tenant.html`** - UI for tenant selection

### Modified Files:
1. **`backend/config/urls.py`** - Added switch-tenant route
2. **`backend/config/settings/base.py`** - Added TenantAdminMiddleware

---

## 🚀 **Quick Start**

```bash
# 1. Backend should already be restarted (done automatically)

# 2. Login to Django admin
# URL: http://localhost:8000/admin/
# Email: admin@psintellhr.com
# Password: admin123

# 3. Visit tenant switcher
# URL: http://localhost:8000/admin/switch-tenant/

# 4. Select "PPCP (ppcp)" from dropdown

# 5. Click "Switch Tenant"

# 6. Now browse admin to see PPCP's data!
```

---

## 🔍 **Verify It's Working**

### Check Current Context:
- Visit: http://localhost:8000/admin/switch-tenant/
- Look for the green or yellow box at the top showing current context

### Test Tenant Data:
1. Switch to **PPCP** tenant
2. Go to: http://localhost:8000/admin/authentication/user/
3. You should see the user **pp@pp.com** (exists in PPCP schema)
4. Switch to **Public Schema**
5. Go to: http://localhost:8000/admin/authentication/user/
6. You should see **admin@psintellhr.com** (exists in public schema)

---

## ⚠️ **Important Reminders**

1. **Django Admin vs Frontend:**
   - **Django Admin** (port 8000) = Developer/superuser tool for managing data
   - **Frontend** (port 3000) = Production interface for tenant users
   
2. **Tenant Users:**
   - Tenant users (like pp@pp.com) should use the **frontend at port 3000**
   - They should NOT use Django admin

3. **Schema Isolation:**
   - Each tenant has a completely separate schema
   - Switching tenants switches the active database schema
   - Changes made while in a tenant schema only affect that tenant

---

## 🐛 **Troubleshooting**

### "I don't see any tenant data after switching"
- Make sure you selected the tenant from the dropdown
- Check that the green box shows "Current Tenant: PPCP (ppcp)"
- Verify the tenant has data (create a test employee)

### "Switch Tenant page not found"
- Backend might not have restarted
- Run: `docker compose restart backend`
- Wait 10-15 seconds for startup

### "I see public schema models when I want tenant models"
- Make sure you're viewing the correct admin models
- Some models only exist in public schema (Tenant, Domain)
- Some models only exist in tenant schemas (Employee, Attendance)

---

## 📝 **Next Steps**

Now that you can access tenant data in Django admin:

1. ✅ Switch to PPCP tenant
2. ✅ Create test employees
3. ✅ Add attendance records
4. ✅ Create leave requests
5. ✅ Test the frontend at localhost:3000 with pp@pp.com

---

**Status:** ✅ **IMPLEMENTED AND READY**

You can now access tenant data in Django admin by switching to the tenant schema!
