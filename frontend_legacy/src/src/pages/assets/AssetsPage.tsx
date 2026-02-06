/**
 * Assets Page - Asset Management with Tabs
 */

import { useEffect, useState } from 'react'
import { assetService, Asset, AssetCategory, AssetStats, AssetAssignment } from '@/services/assetService'
import { employeeService } from '@/services/employeeService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    ComputerDesktopIcon,
    WrenchScrewdriverIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    TagIcon,
    ClipboardDocumentListIcon,
    FolderIcon,
    PencilIcon,
} from '@heroicons/react/24/outline'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    available: { label: 'Available', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
    assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: UserIcon },
    maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700', icon: WrenchScrewdriverIcon },
    retired: { label: 'Retired', color: 'bg-surface-100 text-surface-500', icon: XCircleIcon },
}

const TABS = [
    { id: 'assignments', name: 'Assignments', icon: ClipboardDocumentListIcon },
    { id: 'assets', name: 'Assets', icon: ComputerDesktopIcon },
    { id: 'categories', name: 'Categories', icon: FolderIcon },
]

export default function AssetsPage() {
    const [activeTab, setActiveTab] = useState('assets')
    const [assets, setAssets] = useState<Asset[]>([])
    const [categories, setCategories] = useState<AssetCategory[]>([])
    const [assignments, setAssignments] = useState<AssetAssignment[]>([])
    const [stats, setStats] = useState<AssetStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null)

    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [employees, setEmployees] = useState<any[]>([])

    useEffect(() => {
        loadData()
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            const response = await employeeService.getEmployees({ page_size: 100 })
            setEmployees(response.results)
        } catch (err) {
            console.error('Failed to fetch employees:', err)
        }
    }

    const loadData = async () => {
        setIsLoading(true)

        try {
            const assetsData = await assetService.getAssets()
            setAssets(Array.isArray(assetsData) ? assetsData : [])
        } catch (err: any) {
            console.error('Failed to load assets:', err)
            setAssets([])
        }

        try {
            const categoriesData = await assetService.getCategories()
            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        } catch (err: any) {
            console.error('Failed to load categories:', err)
            setCategories([])
        }

        try {
            const assignmentsData = await assetService.getAssignments()
            setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
        } catch (err: any) {
            console.error('Failed to load assignments:', err)
            setAssignments([])
        }

        try {
            const statsData = await assetService.getStats()
            setStats(statsData)
        } catch (err: any) {
            console.error('Failed to load stats:', err)
        }

        setIsLoading(false)
    }

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = !search ||
            asset.name.toLowerCase().includes(search.toLowerCase()) ||
            asset.asset_tag.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = !statusFilter || asset.status === statusFilter
        const matchesCategory = !categoryFilter || asset.category === categoryFilter
        return matchesSearch && matchesStatus && matchesCategory
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Asset Management
                    </h1>
                    <p className="text-surface-500 mt-1">
                        Track and manage company assets
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'categories' && (
                        <button
                            onClick={() => setShowCategoryModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Category
                        </button>
                    )}
                    {activeTab === 'assets' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Assets" value={stats.total} color="bg-surface-100" />
                    <StatCard label="Available" value={stats.available} color="bg-green-100 text-green-700" />
                    <StatCard label="Assigned" value={stats.assigned} color="bg-blue-100 text-blue-700" />
                    <StatCard label="In Maintenance" value={stats.maintenance} color="bg-yellow-100 text-yellow-700" />
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-surface-200 dark:border-surface-700">
                <nav className="flex gap-4">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'assignments' && (
                <AssignmentsTab assignments={assignments} />
            )}

            {activeTab === 'assets' && (
                <AssetsTab
                    assets={filteredAssets}
                    categories={categories}
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    onAddAsset={() => setShowAddModal(true)}
                    onEdit={(asset) => { setSelectedAsset(asset); setShowEditModal(true) }}
                    onAssign={(asset) => { setSelectedAsset(asset); setShowAssignModal(true) }}
                    onReturn={(asset) => { setSelectedAsset(asset); setShowReturnModal(true) }}
                />
            )}

            {activeTab === 'categories' && (
                <CategoriesTab
                    categories={categories}
                    onAddCategory={() => setShowCategoryModal(true)}
                    onEdit={(cat) => { setSelectedCategory(cat); setShowEditCategoryModal(true) }}
                />
            )}

            {/* Edit Category Modal */}
            {showEditCategoryModal && selectedCategory && (
                <EditCategoryModal
                    category={selectedCategory}
                    onClose={() => { setShowEditCategoryModal(false); setSelectedCategory(null) }}
                    onSuccess={() => { setShowEditCategoryModal(false); setSelectedCategory(null); loadData() }}
                />
            )}

            {/* Add Asset Modal */}
            {showAddModal && (
                <AddAssetModal
                    categories={categories}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); loadData() }}
                />
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <AddCategoryModal
                    onClose={() => setShowCategoryModal(false)}
                    onSuccess={() => { setShowCategoryModal(false); loadData() }}
                />
            )}

            {/* Edit Asset Modal */}
            {showEditModal && selectedAsset && (
                <EditAssetModal
                    asset={selectedAsset}
                    categories={categories}
                    onClose={() => { setShowEditModal(false); setSelectedAsset(null) }}
                    onSuccess={() => { setShowEditModal(false); setSelectedAsset(null); loadData() }}
                />
            )}

            {/* Assign Asset Modal */}
            {showAssignModal && selectedAsset && (
                <AssignAssetModal
                    asset={selectedAsset}
                    employees={employees}
                    onClose={() => { setShowAssignModal(false); setSelectedAsset(null) }}
                    onSuccess={() => { setShowAssignModal(false); setSelectedAsset(null); loadData() }}
                />
            )}

            {/* Return Asset Confirmation Modal */}
            {showReturnModal && selectedAsset && (
                <ReturnAssetModal
                    asset={selectedAsset}
                    onClose={() => { setShowReturnModal(false); setSelectedAsset(null) }}
                    onSuccess={() => { setShowReturnModal(false); setSelectedAsset(null); loadData() }}
                />
            )}
        </div>
    )
}

// Assignments Tab
function AssignmentsTab({ assignments }: { assignments: AssetAssignment[] }) {
    const activeAssignments = assignments.filter(a => a.is_active)
    const pastAssignments = assignments.filter(a => !a.is_active)

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-700">
                    <h3 className="font-semibold text-surface-900 dark:text-white">Active Assignments ({activeAssignments.length})</h3>
                </div>
                {activeAssignments.length === 0 ? (
                    <div className="p-8 text-center text-surface-500">No active assignments</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Asset</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Assign To</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Assigned By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Assigned Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {activeAssignments.map(a => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-surface-900 dark:text-white">{a.asset_name}</p>
                                        <p className="text-sm text-surface-500">{a.asset_tag}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{a.employee_name}</td>
                                    <td className="px-4 py-3 text-sm">{a.assigned_by_name || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{a.assigned_date}</td>
                                    <td className="px-4 py-3 text-sm text-surface-500">{a.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pastAssignments.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="font-semibold text-surface-900 dark:text-white">Assignment History ({pastAssignments.length})</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Asset</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Assigned</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Returned</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {pastAssignments.map(a => (
                                <tr key={a.id} className="text-surface-600">
                                    <td className="px-4 py-3">{a.asset_name}</td>
                                    <td className="px-4 py-3">{a.employee_name}</td>
                                    <td className="px-4 py-3">{a.assigned_date}</td>
                                    <td className="px-4 py-3">{a.returned_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// Assets Tab
function AssetsTab({
    assets, categories, search, setSearch, statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter, onAddAsset, onEdit, onAssign, onReturn
}: {
    assets: Asset[]
    categories: AssetCategory[]
    search: string
    setSearch: (v: string) => void
    statusFilter: string
    setStatusFilter: (v: string) => void
    categoryFilter: string
    setCategoryFilter: (v: string) => void
    onAddAsset: () => void
    onEdit: (asset: Asset) => void
    onAssign: (asset: Asset) => void
    onReturn: (asset: Asset) => void
}) {
    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 min-w-[150px]"
                >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                </select>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 min-w-[150px]"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Assets List */}
            {assets.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                    <ComputerDesktopIcon className="mx-auto h-12 w-12 text-surface-400" />
                    <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No assets found</h3>
                    <p className="mt-1 text-sm text-surface-500">Add your first asset to get started.</p>
                    <button onClick={onAddAsset} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Add Asset
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Asset</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Assigned To</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Location</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {assets.map((asset) => {
                                const statusConfig = STATUS_CONFIG[asset.status] || STATUS_CONFIG.available
                                const StatusIcon = statusConfig.icon
                                return (
                                    <tr key={asset.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-surface-900 dark:text-white">{asset.name}</p>
                                            <p className="text-sm text-surface-500">{asset.asset_tag}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{asset.category_name || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{asset.assignee_name || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{asset.location || '-'}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            {asset.status === 'available' ? (
                                                <button
                                                    onClick={() => onAssign(asset)}
                                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                >
                                                    Assign
                                                </button>
                                            ) : asset.status === 'assigned' ? (
                                                <button
                                                    onClick={() => onReturn(asset)}
                                                    className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                                                >
                                                    Return
                                                </button>
                                            ) : null}
                                            <button
                                                onClick={() => onEdit(asset)}
                                                className="text-surface-600 hover:text-surface-700 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// Categories Tab
function CategoriesTab({ categories, onAddCategory, onEdit }: {
    categories: AssetCategory[]; onAddCategory: () => void; onEdit: (cat: AssetCategory) => void
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-surface-900 dark:text-white">Asset Categories</h3>
                <button
                    onClick={onAddCategory}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                    <FolderIcon className="mx-auto h-12 w-12 text-surface-400" />
                    <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No categories found</h3>
                    <p className="mt-1 text-sm text-surface-500">Create categories to organize your assets.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                                        <FolderIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-surface-900 dark:text-white">{cat.name}</h4>
                                        <p className="text-xs text-surface-500 font-mono uppercase">{cat.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded text-xs font-semibold">
                                        {cat.asset_count || 0} Assets
                                    </span>
                                    <button
                                        onClick={() => onEdit(cat)}
                                        className="p-1 text-surface-400 hover:text-primary-600 rounded"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {cat.description && (
                                <p className="mt-3 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                                    {cat.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`p-4 rounded-xl ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
        </div>
    )
}

function AddAssetModal({ categories, onClose, onSuccess }: {
    categories: AssetCategory[]; onClose: () => void; onSuccess: () => void
}) {
    const [formData, setFormData] = useState<{
        name: string; asset_tag: string; serial_number: string; category: string;
        status: 'available' | 'assigned' | 'maintenance' | 'retired'; location: string;
        purchase_date: string; purchase_price: string; vendor: string; notes: string;
    }>({
        name: '', asset_tag: '', serial_number: '', category: '',
        status: 'available', location: '', purchase_date: '',
        purchase_price: '', vendor: '', notes: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            await assetService.createAsset({
                ...formData,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
            })
            onSuccess()
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create asset'
            setError(message)
            console.error('Failed to create asset:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Add New Asset</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Asset Tag *</label>
                                <input type="text" value={formData.asset_tag} onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                                    placeholder="e.g., LAPTOP-001" className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category *</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required>
                                    <option value="">Select category</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Serial Number</label>
                                <input type="text" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Purchase Date</label>
                                <input
                                    type="date"
                                    value={formData.purchase_date}
                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Purchase Price</label>
                                <input
                                    type="number"
                                    value={formData.purchase_price}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Location</label>
                            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Head Office - Floor 3" className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                        </div>
                        <div>

                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditAssetModal({ asset, categories, onClose, onSuccess }: {
    asset: Asset; categories: AssetCategory[]; onClose: () => void; onSuccess: () => void
}) {
    const [formData, setFormData] = useState({
        name: asset.name,
        asset_tag: asset.asset_tag,
        serial_number: asset.serial_number || '',
        category: asset.category,
        status: asset.status,
        location: asset.location || '',
        purchase_date: asset.purchase_date || '',
        purchase_price: asset.purchase_price?.toString() || '',
        vendor: asset.vendor || '',
        notes: asset.notes || '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await assetService.updateAsset(asset.id, {
                ...formData,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
            })
            onSuccess()
        } catch (error) {
            console.error('Failed to update asset:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 font-semibold text-lg text-surface-900 dark:text-white">
                        Edit Asset
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Asset Tag *</label>
                                <input type="text" value={formData.asset_tag} onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category *</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required>
                                    <option value="">Select category</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Status *</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required>
                                    <option value="available">Available</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="retired">Retired</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Serial Number</label>
                                <input type="text" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Location</label>
                                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Purchase Date</label>
                                <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Purchase Price</label>
                                <input type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Vendor</label>
                            <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Notes</label>
                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function AddCategoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({ name: '', code: '', description: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            await assetService.createCategory(formData)
            onSuccess()
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create category'
            setError(message)
            console.error('Failed to create category:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Add Category</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name *</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Laptops" className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Code *</label>
                            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g., LAPTOP" className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                        </div>
                    </div>
                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function AssignAssetModal({ asset, employees, onClose, onSuccess }: {
    asset: Asset; employees: any[]; onClose: () => void; onSuccess: () => void
}) {
    const [employeeId, setEmployeeId] = useState('')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeId) return
        setIsSubmitting(true)
        try {
            await assetService.assignAsset(asset.id, employeeId, notes)
            onSuccess()
        } catch (error) {
            console.error('Failed to assign asset:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Assign Asset</h3>
                        <p className="text-sm text-surface-500">{asset.name} ({asset.asset_tag})</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select Employee *</label>
                            <select
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                                required
                            >
                                <option value="">Choose an employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name || emp.user?.full_name || 'Unknown'} ({emp.employee_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Assignment Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                                placeholder="e.g., Assigned for Project X"
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !employeeId} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Assigning...' : 'Assign Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function ReturnAssetModal({ asset, onClose, onSuccess }: {
    asset: Asset; onClose: () => void; onSuccess: () => void
}) {
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await assetService.unassignAsset(asset.id, notes)
            onSuccess()
        } catch (error) {
            console.error('Failed to return asset:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Return Asset</h3>
                        <p className="text-sm text-surface-500">Are you sure you want to return {asset.name}?</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                This will mark the asset as <strong>Available</strong> and record the return date.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Return Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                                placeholder="e.g., Returned in good condition"
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Returning...' : 'Confirm Return'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditCategoryModal({ category, onClose, onSuccess }: {
    category: AssetCategory; onClose: () => void; onSuccess: () => void
}) {
    const [formData, setFormData] = useState({
        name: category.name,
        code: category.code,
        description: category.description || '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await assetService.updateCategory(category.id, formData)
            onSuccess()
        } catch (error) {
            console.error('Failed to update category:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 font-semibold text-lg text-surface-900 dark:text-white">
                        Edit Category
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name *</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Code *</label>
                            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3} className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800" />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
