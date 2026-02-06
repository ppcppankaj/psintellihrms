import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { attendanceService } from '../../api/attendanceService';
import type { GeoFence } from '../../api/attendanceService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const GeoFences: React.FC = () => {
    const [geoFences, setGeoFences] = useState<GeoFence[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGeoFence, setEditingGeoFence] = useState<GeoFence | null>(null);

    const fetchGeoFences = async () => {
        setIsLoading(true);
        try {
            const response = await attendanceService.getGeoFences();
            setGeoFences(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch geo-fences', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGeoFences();
    }, []);

    const columns: Column<GeoFence>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Latitude', accessor: 'latitude' },
        { header: 'Longitude', accessor: 'longitude' },
        { header: 'Radius', accessor: (item) => `${item.radius_meters}m` },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'GeoFence Name', type: 'text', required: true, placeholder: 'e.g. Office Perimeter' },
        { name: 'latitude', label: 'Latitude', type: 'number', required: true, placeholder: '12.9716' },
        { name: 'longitude', label: 'Longitude', type: 'number', required: true, placeholder: '77.5946' },
        { name: 'radius_meters', label: 'Radius (Meters)', type: 'number', required: true, placeholder: '200' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingGeoFence) {
                await attendanceService.updateGeoFence(editingGeoFence.id, values as Partial<GeoFence>);
            } else {
                await attendanceService.createGeoFence(values as Partial<GeoFence>);
            }
            setIsFormOpen(false);
            setEditingGeoFence(null);
            fetchGeoFences();
        } catch (error) {
            console.error('Failed to save geo-fence', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (gf: GeoFence) => {
        setEditingGeoFence(gf);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this geo-fence?')) {
            try {
                await attendanceService.deleteGeoFence(id);
                fetchGeoFences();
            } catch (error) {
                console.error('Failed to delete geo-fence', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Geo-Fencing</h1>
                    <p className="text-slate-500">Manage location-based attendance boundaries</p>
                </div>
                <button
                    onClick={() => { setEditingGeoFence(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add GeoFence</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingGeoFence ? 'Edit GeoFence' : 'New GeoFence'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingGeoFence(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingGeoFence || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingGeoFence ? 'Update' : 'Create'}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={geoFences}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            )}
        </div>
    );
};

export default GeoFences;
