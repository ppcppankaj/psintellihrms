import { useState } from 'react'
import EnterpriseTable, { Column, PaginatedData, TableState } from '@/components/ui/EnterpriseTable'
import { performanceService, OKRObjective } from '@/services/performanceService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { api } from '@/services/api' // For fetching employees/cycles

export default function AdminOKRsPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingOKR, setEditingOKR] = useState<OKRObjective | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        employee: '',
        cycle: '',
        status: 'active',
        progress: 0
    })

    // Fetch Cycles for Dropdown
    const { data: cycles } = useQuery({
        queryKey: ['performance-cycles'],
        queryFn: performanceService.getPerformanceCycles
    })

    // Fetch Employees for Dropdown
    const { data: employees } = useQuery({
        queryKey: ['employees-list'],
        queryFn: async () => {
            const res = await api.get('/employees/')
            const data = res.data
            const results = Array.isArray(data) ? data : (data.results || data.data || [])
            return results.map((e: any) => ({
                label: e.full_name || `${e.first_name} ${e.last_name}` || e.username,
                value: e.id
            }))
        }
    })

    const fetchData = async (state: TableState): Promise<PaginatedData<OKRObjective>> => {
        const filters: any = {}
        if (state.search) filters.search = state.search // Assuming backend supports search
        const response = await performanceService.getOKRObjectives(filters)

        if (Array.isArray(response)) {
            return {
                results: response,
                count: response.length,
                next: null,
                previous: null
            }
        }
        return response as any
    }

    const mutation = useMutation({
        mutationFn: (data: any) =>
            editingOKR
                ? performanceService.updateOKRObjective(editingOKR.id, data)
                : performanceService.createOKRObjective(data),
        onSuccess: () => {
            // We can't invalidate EnterpriseTable directly as it handles its own state
            // But we can trigger a refetch if we passed a ref or key. 
            // EnterpriseTable has a refresh button, but ideally we force it.
            // Usually EnterpriseTable uses a key or external trigger.
            // For now, simple toast.
            toast.success(editingOKR ? 'OKR updated' : 'OKR created')
            handleClose()
            // Optional: Reload page or trigger global refetch if implemented
        },
        onError: () => toast.error('Failed to save OKR')
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => performanceService.deleteOKRObjective(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-okrs'] })
            toast.success('OKR deleted')
            setIsDeleteDialogOpen(false)
            setEditingOKR(null)
        }
    })

    const handleEdit = (okr: OKRObjective) => {
        setEditingOKR(okr)
        setFormData({
            title: okr.title,
            description: okr.description,
            employee: okr.employee, // ID
            cycle: okr.cycle, // ID
            status: okr.status,
            progress: okr.progress
        })
        setIsModalOpen(true)
    }

    const handleDelete = () => {
        if (editingOKR) {
            deleteMutation.mutate(editingOKR.id)
        }
    }

    const handleClose = () => {
        setIsModalOpen(false)
        setEditingOKR(null)
        setFormData({
            title: '',
            description: '',
            employee: '',
            cycle: '',
            status: 'active',
            progress: 0
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    const columns: Column<OKRObjective>[] = [
        {
            key: 'title',
            header: 'Objective',
            render: (_, row) => (
                <div>
                    <div className="font-medium text-surface-900 dark:text-white">{row.title}</div>
                    <div className="text-xs text-surface-500 truncate max-w-xs">{row.description}</div>
                </div>
            )
        },
        {
            key: 'employee',
            header: 'Employee',
            render: (_, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.employee_name || row.employee}</span>
                </div>
            )
        },
        {
            key: 'cycle',
            header: 'Cycle',
            render: (_, row) => (row.cycle_name || row.cycle)
        },
        {
            key: 'progress',
            header: 'Progress',
            render: (val) => (
                <div className="w-full max-w-[100px]">
                    <div className="flex justify-between text-xs mb-1">
                        <span>{Number(val)}%</span>
                    </div>
                    <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-600 transition-all duration-500"
                            style={{ width: `${val}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (val) => (
                <span className={`badge ${val === 'completed' ? 'badge-success' :
                    val === 'active' ? 'badge-primary' :
                        'badge-secondary'
                    }`}>
                    {String(val).toUpperCase()}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '100px',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        className="p-1.5 text-surface-500 hover:text-primary-600 rounded-lg"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingOKR(row);
                            setIsDeleteDialogOpen(true);
                        }}
                        className="p-1.5 text-surface-500 hover:text-red-600 rounded-lg"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">All OKRs</h1>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    New OKR
                </button>
            </div>

            <EnterpriseTable
                columns={columns}
                fetchData={fetchData}
                rowKey="id"
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={editingOKR ? 'Edit OKR' : 'Create OKR'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="form-label">Objective Title</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <SearchableSelect
                                label="Employee"
                                options={employees || []}
                                value={formData.employee}
                                onChange={(val) => setFormData({ ...formData, employee: val })}
                                placeholder="Select Employee"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Cycle</label>
                            <select
                                className="form-select"
                                value={formData.cycle}
                                onChange={e => setFormData({ ...formData, cycle: e.target.value })}
                                required
                            >
                                <option value="">Select Cycle</option>
                                {Array.isArray(cycles) && cycles.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Progress (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="form-input"
                                value={formData.progress}
                                onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Save OKR'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Delete OKR"
                message="Are you sure you want to delete this OKR? This cannot be undone."
                variant="danger"
            />
        </div>
    )
}
