import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { employeeService } from '../../api/employeeService';
import type { Location } from '../../api/employeeService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const Locations: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const fetchLocations = async () => {
        setIsLoading(true);
        try {
            const response = await employeeService.getLocations();
            setLocations(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch locations', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const columns: Column<Location>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Code', accessor: 'code' },
        { header: 'City', accessor: 'city' },
        { header: 'State', accessor: 'state' },
        { header: 'Timezone', accessor: 'timezone' },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Location Name', type: 'text', required: true, placeholder: 'e.g. Bangalore Office' },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. BLR-01' },
        { name: 'is_headquarters', label: 'Is Headquarters?', type: 'checkbox' },
        // Address
        { name: 'address_line1', label: 'Address Line 1', type: 'text', required: true, placeholder: 'Flat, House No, Building' },
        { name: 'address_line2', label: 'Address Line 2', type: 'text', placeholder: 'Area, Colony, Street' },
        { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g. Bangalore' },
        { name: 'state', label: 'State', type: 'text', required: true, placeholder: 'e.g. Karnataka' },
        { name: 'country', label: 'Country', type: 'text', required: true, placeholder: 'e.g. India' },
        { name: 'postal_code', label: 'Postal Code', type: 'text', required: true, placeholder: '560001' },
        // Contact
        { name: 'phone', label: 'Contact Phone', type: 'text', placeholder: 'Office phone number' },
        { name: 'email', label: 'Contact Email', type: 'email', placeholder: 'office@company.com' },
        // Other
        { name: 'timezone', label: 'Timezone', type: 'text', required: true, placeholder: 'e.g. Asia/Kolkata' },
        { name: 'latitude', label: 'Latitude', type: 'number', placeholder: '12.9716' },
        { name: 'longitude', label: 'Longitude', type: 'number', placeholder: '77.5946' },
        { name: 'geo_fence_radius', label: 'Geo Fence Radius (m)', type: 'number', placeholder: '200' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingLocation) {
                await employeeService.updateLocation(editingLocation.id, values as Partial<Location>);
            } else {
                await employeeService.createLocation(values as Partial<Location>);
            }
            setIsFormOpen(false);
            setEditingLocation(null);
            fetchLocations();
        } catch (error) {
            console.error('Failed to save location', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (location: Location) => {
        setEditingLocation(location);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            try {
                await employeeService.deleteLocation(id);
                fetchLocations();
            } catch (error) {
                console.error('Failed to delete location', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
                    <p className="text-slate-500">Manage physical work sites and offices</p>
                </div>
                <button
                    onClick={() => { setEditingLocation(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Location</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingLocation ? 'Edit Location' : 'New Location'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingLocation(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingLocation || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingLocation ? 'Update' : 'Create'}
                        onCancel={() => { setIsFormOpen(false); setEditingLocation(null); }}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={locations}
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

export default Locations;
