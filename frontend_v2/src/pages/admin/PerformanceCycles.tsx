import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { performanceService } from '../../api/performanceService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const PerformanceCycles: React.FC = () => {
    const [cycles, setCycles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCycles = async () => {
        setIsLoading(true);
        try {
            const response = await performanceService.getCycles();
            setCycles(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch performance cycles', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCycles();
    }, []);

    const columns: Column<any>[] = [
        { header: 'Title', accessor: 'title' },
        { header: 'Type', accessor: 'cycle_type' },
        { header: 'Starts', accessor: 'start_date' },
        { header: 'Ends', accessor: 'end_date' },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                    {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Performance Cycles</h1>
                    <p className="text-slate-500">Manage review periods and evaluation timelines</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Plus size={20} />
                    <span>Create Cycle</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={cycles}
                isLoading={isLoading}
            />
        </div>
    );
};

export default PerformanceCycles;
