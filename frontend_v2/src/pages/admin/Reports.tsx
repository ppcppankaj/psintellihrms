import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar, Play, RefreshCw, Filter, ChevronRight } from 'lucide-react';
import { reportService } from '../../api/reportService';
import type { ReportDefinition, ReportExecution } from '../../api/reportService';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';

const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'available' | 'executions'>('available');
    const [reports, setReports] = useState<ReportDefinition[]>([]);
    const [executions, setExecutions] = useState<ReportExecution[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);

    useEffect(() => {
        fetchReports();
        fetchExecutions();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await reportService.getReports();
            setReports(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExecutions = async () => {
        try {
            const response = await reportService.getExecutions();
            setExecutions(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch executions', error);
        }
    };

    const handleRunReport = async (values: Record<string, unknown>) => {
        if (!selectedReport) return;
        try {
            await reportService.executeReport(selectedReport.id, values, values.format as string || 'pdf');
            setIsModalOpen(false);
            setSelectedReport(null);
            fetchExecutions();
            setActiveTab('executions');
        } catch (error) {
            console.error('Failed to run report', error);
            alert('Failed to run report');
        }
    };

    const handleDownload = async (execution: ReportExecution) => {
        if (execution.status !== 'completed' || !execution.file_url) return;
        try {
            window.open(execution.file_url, '_blank');
        } catch (error) {
            console.error('Failed to download report', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            running: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
                {status}
            </span>
        );
    };

    const getCategoryIcon = (category: string) => {
        const colors: Record<string, string> = {
            hr: 'bg-blue-100 text-blue-600',
            payroll: 'bg-green-100 text-green-600',
            attendance: 'bg-purple-100 text-purple-600',
            performance: 'bg-amber-100 text-amber-600',
            recruitment: 'bg-pink-100 text-pink-600',
            finance: 'bg-emerald-100 text-emerald-600',
        };
        return colors[category] || 'bg-slate-100 text-slate-600';
    };

    const categories = ['all', 'hr', 'payroll', 'attendance', 'performance', 'recruitment', 'finance'];

    const filteredReports = selectedCategory === 'all'
        ? reports
        : reports.filter(r => r.category === selectedCategory);

    const reportColumns: Column<ReportDefinition>[] = [
        {
            header: 'Report', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryIcon(item.category)}`}>
                        <FileBarChart size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.description || item.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Category', accessor: (item) => (
                <span className="capitalize px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                    {item.category}
                </span>
            )
        },
        {
            header: 'Type', accessor: (item) => (
                item.is_system ? (
                    <span className="text-blue-600 text-sm">System</span>
                ) : (
                    <span className="text-slate-500 text-sm">Custom</span>
                )
            )
        },
    ];

    const executionColumns: Column<ReportExecution>[] = [
        { header: 'Report', accessor: (item) => item.report_name || item.report },
        {
            header: 'Format', accessor: (item) => (
                <span className="uppercase text-xs font-mono bg-slate-100 px-2 py-1 rounded">{item.format}</span>
            )
        },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
        { header: 'Created', accessor: (item) => new Date(item.created_at).toLocaleString() },
        { header: 'Completed', accessor: (item) => item.completed_at ? new Date(item.completed_at).toLocaleString() : '-' },
    ];

    const getReportFormFields = (report: ReportDefinition): FormFieldConfig[] => {
        const fields: FormFieldConfig[] = [];

        if (report.parameters) {
            report.parameters.forEach(param => {
                fields.push({
                    name: param.name,
                    label: param.label,
                    type: param.type === 'daterange' ? 'date' : param.type as 'text' | 'date' | 'select',
                    required: param.required,
                    options: param.options,
                });
            });
        }

        fields.push({
            name: 'format',
            label: 'Output Format',
            type: 'select',
            required: true,
            options: [
                { value: 'pdf', label: 'PDF' },
                { value: 'csv', label: 'CSV' },
                { value: 'xlsx', label: 'Excel' },
            ],
        });

        return fields;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p className="text-slate-500">Generate and download HR reports</p>
                </div>
                <button
                    onClick={fetchExecutions}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileBarChart className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{reports.length}</p>
                            <p className="text-sm text-slate-500">Available Reports</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Download className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{executions.filter(e => e.status === 'completed').length}</p>
                            <p className="text-sm text-slate-500">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Play className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{executions.filter(e => e.status === 'running').length}</p>
                            <p className="text-sm text-slate-500">Running</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Calendar className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{executions.length}</p>
                            <p className="text-sm text-slate-500">Total Runs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['available', 'executions'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors capitalize ${activeTab === tab
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'available' ? 'Available Reports' : 'Execution History'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Filter (for available reports) */}
            {activeTab === 'available' && (
                <div className="flex gap-2 items-center">
                    <Filter size={18} className="text-slate-400" />
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${selectedCategory === cat
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {activeTab === 'available' && (
                <DataTable
                    columns={reportColumns}
                    data={filteredReports}
                    isLoading={isLoading}
                    actions={(item) => (
                        <button
                            onClick={() => { setSelectedReport(item); setIsModalOpen(true); }}
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            Run <ChevronRight size={16} />
                        </button>
                    )}
                />
            )}

            {activeTab === 'executions' && (
                <DataTable
                    columns={executionColumns}
                    data={executions}
                    isLoading={isLoading}
                    actions={(item) => (
                        item.status === 'completed' && item.file_url ? (
                            <button
                                onClick={() => handleDownload(item)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-700"
                            >
                                <Download size={16} /> Download
                            </button>
                        ) : item.status === 'failed' ? (
                            <span className="text-red-500 text-xs">{item.error_message || 'Failed'}</span>
                        ) : null
                    )}
                />
            )}

            {/* Run Report Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedReport(null); }}
                title={`Run Report: ${selectedReport?.name || ''}`}
            >
                {selectedReport && (
                    <DynamicForm
                        fields={getReportFormFields(selectedReport)}
                        initialValues={{ format: 'pdf' }}
                        onSubmit={handleRunReport}
                        onCancel={() => { setIsModalOpen(false); setSelectedReport(null); }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Reports;
