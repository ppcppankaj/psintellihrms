import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { talentService } from '../../api/talentService';
import type { JobPosting } from '../../api/talentService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const JobPostings: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const response = await talentService.getJobs();
            setJobs(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const columns: Column<JobPosting>[] = [
        { header: 'Title', accessor: 'title' },
        { header: 'Code', accessor: 'code' },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'open' ? 'bg-green-100 text-green-700' :
                    item.status === 'closed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                    {item.status.toUpperCase()}
                </span>
            )
        },
        { header: 'Department', accessor: 'department' },
        { header: 'Positions', accessor: 'positions' },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'e.g. Senior Frontend Engineer' },
        { name: 'code', label: 'Job Code', type: 'text', required: true, placeholder: 'e.g. ENG-001' },
        {
            name: 'employment_type', label: 'Type', type: 'select', required: true, options: [
                { label: 'Full Time', value: 'full_time' },
                { label: 'Part Time', value: 'part_time' },
                { label: 'Contract', value: 'contract' },
                { label: 'Intern', value: 'intern' },
            ]
        },
        { name: 'positions', label: 'Open Positions', type: 'number', required: true, placeholder: '1' },
        { name: 'description', label: 'Description', type: 'text', required: true },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            await talentService.createJob(values as Partial<JobPosting>);
            setIsFormOpen(false);
            fetchJobs();
        } catch (error) {
            console.error('Failed to create job', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Job Postings</h1>
                    <p className="text-slate-500">Manage open positions and recruitment needs</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Post New Job</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">New Job Posting</h2>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={jobs}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default JobPostings;
