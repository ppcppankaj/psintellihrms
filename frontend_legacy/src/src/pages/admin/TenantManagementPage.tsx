import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSuperuserOnly } from '@/hooks/useAccessControl';
import { Plus, Search, Edit2, Trash2, Eye, Power } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  industry?: string;
  company_size?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  subscription_status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface CreateTenantData {
  name: string;
  slug?: string;
  email: string;
  phone: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  industry: string;
  company_size: string;
  country: string;
  timezone: string;
  currency: string;
  date_format?: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
  subscription_status?: string;
  domain?: string;
  settings?: Record<string, any>;
}

interface UpdateTenantData {
  name: string;
  email: string;
  phone: string;
  industry: string;
  company_size: string;
  country: string;
  timezone: string;
  currency: string;
  is_active: boolean;
  subscription_status: string;
}

export default function TenantManagementPage() {
  const { isLoading: isSuperuserVerifying } = useSuperuserOnly();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<CreateTenantData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    industry: 'General',
    company_size: '1-10',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    date_format: 'DD/MM/YYYY',
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: '',
    subscription_status: 'trial',
    domain: '',
    settings: {
      fiscal_year_start_month: 4,
      work_week_start: 1,
      default_working_hours: 8.0,
      enable_geo_fencing: true,
      enable_face_recognition: false,
      enable_wifi_attendance: false,
      attendance_buffer_minutes: 15,
      carry_forward_leaves: true,
      max_carry_forward_days: 30,
      enable_sandwich_rule: false,
      enable_pf: true,
      enable_esi: true,
      enable_professional_tax: true,
      pf_contribution_rate: 12.0,
      email_notifications: true,
      sms_notifications: false,
      slack_webhook_url: '',
      teams_webhook_url: '',
      enforce_2fa: false,
      session_timeout_minutes: 60,
      password_expiry_days: 90,
      allowed_ip_ranges: [],
      data_retention_years: 7,
      auto_archive_after_months: 24,
    },
  });


  const [editData, setEditData] = useState<UpdateTenantData>({
    name: '',
    email: '',
    phone: '',
    industry: '',
    company_size: '',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    is_active: true,
    subscription_status: 'active',
  });
  // Fetch tenants
  const { data: tenantsData, isLoading, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await api.get('/tenants/');
      return response.data;
    },
  });

  // Create tenant mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTenantData) => {
      // Tenant creation can take time (schema + bootstrap); extend timeout to 30 minutes
      const response = await api.post('/tenants/', data, { timeout: 1800000 });
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        email: '',
        phone: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        industry: 'General',
        company_size: '1-10',
        country: 'India',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        date_format: 'DD/MM/YYYY',
        admin_email: '',
        admin_password: '',
        admin_first_name: '',
        admin_last_name: '',
        subscription_status: 'trial',
        domain: '',
        settings: {
          fiscal_year_start_month: 4,
          work_week_start: 1,
          default_working_hours: 8.0,
          enable_geo_fencing: true,
          enable_face_recognition: false,
          enable_wifi_attendance: false,
          attendance_buffer_minutes: 15,
          carry_forward_leaves: true,
          max_carry_forward_days: 30,
          enable_sandwich_rule: false,
          enable_pf: true,
          enable_esi: true,
          enable_professional_tax: true,
          pf_contribution_rate: 12.0,
          email_notifications: true,
          sms_notifications: false,
          slack_webhook_url: '',
          teams_webhook_url: '',
          enforce_2fa: false,
          session_timeout_minutes: 60,
          password_expiry_days: 90,
          allowed_ip_ranges: [],
          data_retention_years: 7,
          auto_archive_after_months: 24,
        },
      });
      alert('Tenant created successfully!');
    },
    onError: (error: any) => {
      // Prefer backend validation details if present
      const detail =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === 'object' ? JSON.stringify(error.response.data) : undefined);
      alert(`Error: ${detail || 'Failed to create tenant'}`);
      console.error('Create tenant failed', error?.response?.data || error);
    },
  });

  // Update tenant mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTenantData }) => {
      const response = await api.patch(`/tenants/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setShowEditModal(false);
      setSelectedTenant(null);
      alert('Tenant updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || 'Failed to update tenant'}`);
    },
  });

  // Deactivate tenant (soft delete)
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tenants/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      alert('Tenant deactivated');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || 'Failed to deactivate tenant'}`);
    },
  });

  // Reactivate tenant
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/tenants/${id}/activate/`);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      alert('Tenant activated');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || 'Failed to activate tenant'}`);
    },
  });

  const tenants: Tenant[] = tenantsData?.data || [];
  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    // If any admin field is provided, require all admin fields
    const hasAnyAdminField = formData.admin_email || formData.admin_password || formData.admin_first_name || formData.admin_last_name;
    if (hasAnyAdminField) {
      if (!formData.admin_email || !formData.admin_password || !formData.admin_first_name || !formData.admin_last_name) {
        alert('To create an admin user, provide: Email, Password (min 12 chars), First Name, and Last Name. Or leave all fields blank.');
        return;
      }
      if (formData.admin_password.length < 12) {
        alert('Admin password must be at least 12 characters long');
        return;
      }
    }
    const payload = { ...formData } as any;
    if (!payload.slug) delete payload.slug;
    if (!payload.website) delete payload.website;
    if (!payload.address_line1) delete payload.address_line1;
    if (!payload.address_line2) delete payload.address_line2;
    if (!payload.city) delete payload.city;
    if (!payload.state) delete payload.state;
    if (!payload.postal_code) delete payload.postal_code;
    if (!payload.date_format) delete payload.date_format;
    if (!payload.subscription_status) delete payload.subscription_status;
    if (!payload.domain) delete payload.domain;
    // Remove empty admin fields
    if (!payload.admin_email) delete payload.admin_email;
    if (!payload.admin_password) delete payload.admin_password;
    if (!payload.admin_first_name) delete payload.admin_first_name;
    if (!payload.admin_last_name) delete payload.admin_last_name;
    if (payload.settings) {
      if (!payload.settings.slack_webhook_url) delete payload.settings.slack_webhook_url;
      if (!payload.settings.teams_webhook_url) delete payload.settings.teams_webhook_url;
    }
    createMutation.mutate(payload);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof CreateTenantData
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    type: 'text' | 'number' | 'checkbox' = 'text'
  ) => {
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), [field]: value },
    }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof UpdateTenantData
  ) => {
    const value = field === 'is_active' ? (e.target as HTMLInputElement).checked : e.target.value;
    setEditData((prev) => ({
      ...prev,
      [field]: value as UpdateTenantData[keyof UpdateTenantData],
    }));
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      industry: tenant.industry || '',
      company_size: tenant.company_size || '',
      country: tenant.country || 'India',
      timezone: tenant.timezone || 'Asia/Kolkata',
      currency: tenant.currency || 'INR',
      is_active: tenant.is_active,
      subscription_status: tenant.subscription_status || 'active',
    });
    setShowEditModal(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    updateMutation.mutate({ id: selectedTenant.id, data: editData });
  };

  const handleDeactivate = (tenant: Tenant) => {
    if (window.confirm(`Deactivate ${tenant.name}? This will suspend access.`)) {
      deactivateMutation.mutate(tenant.id);
    }
  };

  const handleActivate = (tenant: Tenant) => {
    activateMutation.mutate(tenant.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {isSuperuserVerifying && (
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-600">Verifying access...</div>
        </div>
      )}
      
      {!isSuperuserVerifying && (
        <>
          {/* Header */}
          <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tenant Management</h1>
              <p className="text-slate-600 mt-2">Manage all tenants and their configurations</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition"
            >
              <Plus size={20} />
              New Tenant
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-600">Loading tenants...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No tenants found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Slug</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Industry</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Subscription</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{tenant.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <code className="bg-slate-100 px-2 py-1 rounded">{tenant.slug}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{tenant.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{tenant.industry || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tenant.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tenant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tenant.subscription_status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : tenant.subscription_status === 'trial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tenant.subscription_status.charAt(0).toUpperCase() +
                            tenant.subscription_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                            title="View / Edit"
                            onClick={() => openEditModal(tenant)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-2 hover:bg-yellow-100 rounded-lg transition text-yellow-600"
                            title="Edit"
                            onClick={() => openEditModal(tenant)}
                          >
                            <Edit2 size={16} />
                          </button>
                          {tenant.is_active ? (
                            <button
                              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                              title="Deactivate"
                              onClick={() => handleDeactivate(tenant)}
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              className="p-2 hover:bg-green-100 rounded-lg transition text-green-600"
                              title="Activate"
                              onClick={() => handleActivate(tenant)}
                            >
                              <Power size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b border-blue-800">
              <h2 className="text-xl font-bold">Create New Tenant</h2>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTenant} className="p-6 space-y-6">

              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span>Company Information</span>
                  <span className="text-xs text-red-600">* Required fields</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Company Name *"
                    value={formData.name}
                    onChange={(e) => handleInputChange(e, 'name')}
                    required
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Slug (optional)"
                    value={formData.slug}
                    onChange={(e) => handleInputChange(e, 'slug')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Company Email *"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e, 'email')}
                    required
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange(e, 'phone')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    placeholder="Website"
                    value={formData.website}
                    onChange={(e) => handleInputChange(e, 'website')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange(e, 'industry')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.company_size}
                    onChange={(e) => handleInputChange(e, 'company_size')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange(e, 'country')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Address line1" value={formData.address_line1} onChange={(e) => handleInputChange(e, 'address_line1')} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Address line2" value={formData.address_line2} onChange={(e) => handleInputChange(e, 'address_line2')} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="City" value={formData.city} onChange={(e) => handleInputChange(e, 'city')} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="State" value={formData.state} onChange={(e) => handleInputChange(e, 'state')} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Postal code" value={formData.postal_code} onChange={(e) => handleInputChange(e, 'postal_code')} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Legal name" value={(formData as any).legal_name || ''} onChange={(e) => handleInputChange(e as any, 'legal_name' as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Registration number" value={(formData as any).registration_number || ''} onChange={(e) => handleInputChange(e as any, 'registration_number' as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="GSTIN" value={(formData as any).gstin || ''} onChange={(e) => handleInputChange(e as any, 'gstin' as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="PAN" value={(formData as any).pan || ''} onChange={(e) => handleInputChange(e as any, 'pan' as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="TAN" value={(formData as any).tan || ''} onChange={(e) => handleInputChange(e as any, 'tan' as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.date_format}
                    onChange={(e) => handleInputChange(e, 'date_format')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2024-12-31)</option>
                  </select>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange(e, 'timezone')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange(e, 'currency')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Subscription & Domain */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.subscription_status}
                    onChange={(e) => handleInputChange(e as any, 'subscription_status' as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <input type="text" placeholder="Add domain (optional)" value={formData.domain} onChange={(e) => handleInputChange(e as any, 'domain' as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Tenant Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Tenant Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="number" placeholder="Fiscal year start month" value={formData.settings?.fiscal_year_start_month ?? ''} onChange={(e) => handleSettingsChange(e, 'fiscal_year_start_month', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="number" placeholder="Work week start" value={formData.settings?.work_week_start ?? ''} onChange={(e) => handleSettingsChange(e, 'work_week_start', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="number" placeholder="Default working hours" value={formData.settings?.default_working_hours ?? ''} onChange={(e) => handleSettingsChange(e, 'default_working_hours', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_geo_fencing} onChange={(e) => handleSettingsChange(e, 'enable_geo_fencing', 'checkbox')} /> Enable geo fencing</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_face_recognition} onChange={(e) => handleSettingsChange(e, 'enable_face_recognition', 'checkbox')} /> Enable face recognition</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_wifi_attendance} onChange={(e) => handleSettingsChange(e, 'enable_wifi_attendance', 'checkbox')} /> Enable wifi attendance</label>
                  <input type="number" placeholder="Attendance buffer minutes" value={formData.settings?.attendance_buffer_minutes ?? ''} onChange={(e) => handleSettingsChange(e, 'attendance_buffer_minutes', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.carry_forward_leaves} onChange={(e) => handleSettingsChange(e, 'carry_forward_leaves', 'checkbox')} /> Carry forward leaves</label>
                  <input type="number" placeholder="Max carry forward days" value={formData.settings?.max_carry_forward_days ?? ''} onChange={(e) => handleSettingsChange(e, 'max_carry_forward_days', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_sandwich_rule} onChange={(e) => handleSettingsChange(e, 'enable_sandwich_rule', 'checkbox')} /> Enable sandwich rule</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_pf} onChange={(e) => handleSettingsChange(e, 'enable_pf', 'checkbox')} /> Enable PF</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_esi} onChange={(e) => handleSettingsChange(e, 'enable_esi', 'checkbox')} /> Enable ESI</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enable_professional_tax} onChange={(e) => handleSettingsChange(e, 'enable_professional_tax', 'checkbox')} /> Enable professional tax</label>
                  <input type="number" placeholder="PF contribution rate" value={formData.settings?.pf_contribution_rate ?? ''} onChange={(e) => handleSettingsChange(e, 'pf_contribution_rate', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.email_notifications} onChange={(e) => handleSettingsChange(e, 'email_notifications', 'checkbox')} /> Email notifications</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.sms_notifications} onChange={(e) => handleSettingsChange(e, 'sms_notifications', 'checkbox')} /> SMS notifications</label>
                  <input type="url" placeholder="Slack webhook url" value={formData.settings?.slack_webhook_url ?? ''} onChange={(e) => handleSettingsChange(e, 'slack_webhook_url', 'text')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="url" placeholder="Teams webhook url" value={formData.settings?.teams_webhook_url ?? ''} onChange={(e) => handleSettingsChange(e, 'teams_webhook_url', 'text')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.settings?.enforce_2fa} onChange={(e) => handleSettingsChange(e, 'enforce_2fa', 'checkbox')} /> Enforce 2FA</label>
                  <input type="number" placeholder="Session timeout minutes" value={formData.settings?.session_timeout_minutes ?? ''} onChange={(e) => handleSettingsChange(e, 'session_timeout_minutes', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="number" placeholder="Password expiry days" value={formData.settings?.password_expiry_days ?? ''} onChange={(e) => handleSettingsChange(e, 'password_expiry_days', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="text" placeholder="Allowed IP ranges (comma separated)" value={(formData.settings?.allowed_ip_ranges || []).join(', ')} onChange={(e) => {
                    const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    setFormData((prev) => ({ ...prev, settings: { ...(prev.settings || {}), allowed_ip_ranges: parts } }))
                  }} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="number" placeholder="Data retention years" value={formData.settings?.data_retention_years ?? ''} onChange={(e) => handleSettingsChange(e, 'data_retention_years', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="number" placeholder="Auto archive after months" value={formData.settings?.auto_archive_after_months ?? ''} onChange={(e) => handleSettingsChange(e, 'auto_archive_after_months', 'number')} className="px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>

              {/* Admin User */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Admin User (Optional)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Create an initial admin user for this tenant. If left blank, you can create users later via Django admin.
                    All fields required if creating admin user.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={formData.admin_email}
                    onChange={(e) => handleInputChange(e, 'admin_email')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Admin Password (min 12 chars)"
                    value={formData.admin_password}
                    onChange={(e) => handleInputChange(e, 'admin_password')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.admin_first_name}
                    onChange={(e) => handleInputChange(e, 'admin_first_name')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.admin_last_name}
                    onChange={(e) => handleInputChange(e, 'admin_last_name')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating tenant (this may take 1-2 minutes)...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 border-b border-amber-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Tenant</h2>
                <button onClick={() => setShowEditModal(false)} className="text-white/80 hover:text-white">
                  Close
                </button>
              </div>
              <p className="text-sm text-white/80 mt-1">Update company profile and subscription state.</p>
            </div>

            <form onSubmit={submitEdit} className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span>Company Information</span>
                  <span className="text-xs text-red-600">* Required fields</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Company Name *"
                    value={editData.name}
                    onChange={(e) => handleEditChange(e, 'name')}
                    required
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="email"
                    placeholder="Company Email *"
                    value={editData.email}
                    onChange={(e) => handleEditChange(e, 'email')}
                    required
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={editData.phone}
                    onChange={(e) => handleEditChange(e, 'phone')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Industry"
                    value={editData.industry}
                    onChange={(e) => handleEditChange(e, 'industry')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <select
                    value={editData.company_size}
                    onChange={(e) => handleEditChange(e, 'company_size')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  <select
                    value={editData.country}
                    onChange={(e) => handleEditChange(e, 'country')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={editData.timezone}
                    onChange={(e) => handleEditChange(e, 'timezone')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                  <select
                    value={editData.currency}
                    onChange={(e) => handleEditChange(e, 'currency')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={editData.subscription_status}
                    onChange={(e) => handleEditChange(e, 'subscription_status')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={editData.is_active}
                      onChange={(e) => handleEditChange(e, 'is_active')}
                      className="h-4 w-4 text-amber-600 border-slate-300 rounded"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

