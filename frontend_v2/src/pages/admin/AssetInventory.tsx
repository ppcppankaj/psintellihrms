import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Folder, UserCheck, Wrench, ArrowUpDown } from 'lucide-react';
import { assetService } from '../../api/assetService';
import type { Asset, AssetCategory, AssetAssignment } from '../../api/assetService';
import { DataTable, type Column } from '../../components/DataTable';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';

const AssetInventory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'assets' | 'categories' | 'assignments'>('assets');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'asset' | 'category' | 'assign'>('asset');
    const [editingItem, setEditingItem] = useState<Asset | AssetCategory | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAssets();
        fetchCategories();
        fetchAssignments();
    }, []);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const response = await assetService.getAssets();
            setAssets(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch assets', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await assetService.getCategories();
            setCategories(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const response = await assetService.getAssignments();
            setAssignments(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch assignments', error);
        }
    };

    const handleAssetSubmit = async (values: Record<string, unknown>) => {
        setIsLoading(true);
        try {
            if (editingItem) {
                await assetService.updateAsset((editingItem as Asset).id, values);
            } else {
                await assetService.createAsset(values as Partial<Asset>);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            fetchAssets();
        } catch (error) {
            console.error('Failed to save asset', error);
            alert('Failed to save asset');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategorySubmit = async (values: Record<string, unknown>) => {
        try {
            if (editingItem) {
                await assetService.updateCategory((editingItem as AssetCategory).id, values);
            } else {
                await assetService.createCategory(values);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            fetchCategories();
        } catch (error) {
            console.error('Failed to save category', error);
            alert('Failed to save category');
        }
    };

    const handleAssignSubmit = async (values: Record<string, unknown>) => {
        if (!selectedAsset) return;
        try {
            await assetService.assignAsset(selectedAsset.id, values.employee_id as string, values.notes as string);
            setIsModalOpen(false);
            setSelectedAsset(null);
            fetchAssets();
            fetchAssignments();
        } catch (error) {
            console.error('Failed to assign asset', error);
            alert('Failed to assign asset');
        }
    };

    const handleDeleteAsset = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await assetService.deleteAsset(id);
                fetchAssets();
            } catch (error) {
                console.error('Failed to delete asset', error);
            }
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await assetService.deleteCategory(id);
                fetchCategories();
            } catch (error) {
                console.error('Failed to delete category', error);
            }
        }
    };

    const handleReturnAsset = async (id: string) => {
        const condition = prompt('Enter condition at return (new, good, fair, poor):');
        if (condition) {
            try {
                await assetService.returnAsset(id, condition);
                fetchAssets();
                fetchAssignments();
            } catch (error) {
                console.error('Failed to return asset', error);
            }
        }
    };

    const handleMaintenanceAsset = async (id: string) => {
        const notes = prompt('Enter maintenance notes:');
        if (notes) {
            try {
                await assetService.sendToMaintenance(id, notes);
                fetchAssets();
            } catch (error) {
                console.error('Failed to send to maintenance', error);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            available: 'bg-green-100 text-green-700',
            assigned: 'bg-blue-100 text-blue-700',
            maintenance: 'bg-amber-100 text-amber-700',
            retired: 'bg-slate-100 text-slate-600',
            disposed: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
                {status}
            </span>
        );
    };

    const assetColumns: Column<Asset>[] = [
        {
            header: 'Asset', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="text-slate-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{item.asset_tag}</p>
                    </div>
                </div>
            )
        },
        { header: 'Category', accessor: (item) => item.category?.name || 'N/A' },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
        {
            header: 'Condition', accessor: (item) => (
                <span className="capitalize">{item.condition || '-'}</span>
            )
        },
        { header: 'Assigned To', accessor: (item) => item.current_assignee_name || item.current_assignee || '-' },
        { header: 'Location', accessor: (item) => item.location || '-' },
    ];

    const categoryColumns: Column<AssetCategory>[] = [
        {
            header: 'Category', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Folder className="text-primary-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{item.code}</p>
                    </div>
                </div>
            )
        },
        { header: 'Description', accessor: (item) => item.description || '-' },
        { header: 'Depreciation', accessor: (item) => item.depreciation_rate ? `${item.depreciation_rate}%` : '-' },
        {
            header: 'Status', accessor: (item) => (
                item.is_active !== false ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Active</span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs">Inactive</span>
                )
            )
        },
    ];

    const assignmentColumns: Column<AssetAssignment>[] = [
        { header: 'Asset', accessor: (item) => item.asset_name || item.asset },
        { header: 'Employee', accessor: (item) => item.employee_name || item.employee },
        { header: 'Assigned', accessor: (item) => new Date(item.assigned_date).toLocaleDateString() },
        { header: 'Returned', accessor: (item) => item.returned_date ? new Date(item.returned_date).toLocaleDateString() : '-' },
        {
            header: 'Condition', accessor: (item) => (
                <div>
                    <span className="text-xs">In: {item.condition_at_assignment}</span>
                    {item.condition_at_return && (
                        <span className="text-xs block">Out: {item.condition_at_return}</span>
                    )}
                </div>
            )
        },
    ];

    const assetFields: FormFieldConfig[] = [
        { name: 'name', label: 'Asset Name', type: 'text', required: true },
        { name: 'asset_tag', label: 'Asset Tag', type: 'text', required: true },
        { name: 'serial_number', label: 'Serial Number', type: 'text' },
        { name: 'category_id', label: 'Category ID', type: 'text', required: true },
        {
            name: 'status', label: 'Status', type: 'select', required: true, options: [
                { label: 'Available', value: 'available' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Retired', value: 'retired' },
            ]
        },
        {
            name: 'condition', label: 'Condition', type: 'select', required: true, options: [
                { label: 'New', value: 'new' },
                { label: 'Good', value: 'good' },
                { label: 'Fair', value: 'fair' },
                { label: 'Poor', value: 'poor' },
            ]
        },
        { name: 'purchase_date', label: 'Purchase Date', type: 'date' },
        { name: 'purchase_price', label: 'Purchase Price', type: 'number' },
        { name: 'warranty_expiry', label: 'Warranty Expiry', type: 'date' },
        { name: 'location', label: 'Location', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
    ];

    const categoryFields: FormFieldConfig[] = [
        { name: 'name', label: 'Category Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'depreciation_rate', label: 'Depreciation Rate (%)', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const assignFields: FormFieldConfig[] = [
        { name: 'employee_id', label: 'Employee ID', type: 'text', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea' },
    ];

    const openModal = (type: 'asset' | 'category' | 'assign', item?: Asset | AssetCategory | null) => {
        setModalType(type);
        if (type === 'assign' && item) {
            setSelectedAsset(item as Asset);
        } else {
            setEditingItem(item || null);
        }
        setIsModalOpen(true);
    };

    const filteredAssets = searchQuery
        ? assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : assets;

    const stats = {
        total: assets.length,
        available: assets.filter(a => a.status === 'available').length,
        assigned: assets.filter(a => a.status === 'assigned').length,
        maintenance: assets.filter(a => a.status === 'maintenance').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Asset Inventory</h1>
                    <p className="text-slate-500">Track and manage company assets</p>
                </div>
                <button
                    onClick={() => openModal(activeTab === 'categories' ? 'category' : 'asset')}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add {activeTab === 'categories' ? 'Category' : 'Asset'}</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="text-slate-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-sm text-slate-500">Total Assets</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Package className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.available}</p>
                            <p className="text-sm text-slate-500">Available</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <UserCheck className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.assigned}</p>
                            <p className="text-sm text-slate-500">Assigned</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Wrench className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.maintenance}</p>
                            <p className="text-sm text-slate-500">In Maintenance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['assets', 'categories', 'assignments'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors capitalize ${activeTab === tab
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search (for assets tab) */}
            {activeTab === 'assets' && (
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>
            )}

            {/* Content */}
            {activeTab === 'assets' && (
                <DataTable
                    columns={assetColumns}
                    data={filteredAssets}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex space-x-2">
                            {item.status === 'available' && (
                                <button onClick={() => openModal('assign', item)} className="p-1 text-green-500 hover:text-green-700" title="Assign">
                                    <UserCheck size={18} />
                                </button>
                            )}
                            {item.status === 'assigned' && (
                                <button onClick={() => handleReturnAsset(item.id)} className="p-1 text-blue-500 hover:text-blue-700" title="Return">
                                    <ArrowUpDown size={18} />
                                </button>
                            )}
                            {item.status !== 'maintenance' && (
                                <button onClick={() => handleMaintenanceAsset(item.id)} className="p-1 text-amber-500 hover:text-amber-700" title="Maintenance">
                                    <Wrench size={18} />
                                </button>
                            )}
                            <button onClick={() => openModal('asset', item)} className="p-1 text-slate-400 hover:text-primary-600">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteAsset(item.id)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'categories' && (
                <DataTable
                    columns={categoryColumns}
                    data={categories}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex space-x-2">
                            <button onClick={() => openModal('category', item)} className="p-1 text-slate-400 hover:text-primary-600">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteCategory(item.id)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'assignments' && (
                <DataTable
                    columns={assignmentColumns}
                    data={assignments}
                    isLoading={isLoading}
                />
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); setSelectedAsset(null); }}
                title={modalType === 'assign' ? `Assign ${selectedAsset?.name}` : editingItem ? `Edit ${modalType}` : `New ${modalType}`}
            >
                <DynamicForm
                    fields={modalType === 'asset' ? assetFields : modalType === 'category' ? categoryFields : assignFields}
                    initialValues={editingItem || (modalType === 'category' ? { is_active: true } : modalType === 'asset' ? { status: 'available', condition: 'new' } : {})}
                    onSubmit={modalType === 'asset' ? handleAssetSubmit : modalType === 'category' ? handleCategorySubmit : handleAssignSubmit}
                    onCancel={() => { setIsModalOpen(false); setEditingItem(null); setSelectedAsset(null); }}
                    isLoading={isLoading}
                />
            </Modal>
        </div>
    );
};

export default AssetInventory;
