import React, { useState, useEffect } from 'react';
import { Brain, Cpu, Activity, Settings, Play, Pause, RefreshCw, AlertTriangle } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import api from '../../api';

interface AIModel {
    id: string;
    name: string;
    code: string;
    model_type: 'resume_parser' | 'sentiment' | 'face_recognition' | 'fraud_detection' | 'recommendation' | 'chatbot';
    provider: string;
    version: string;
    status: 'active' | 'inactive' | 'training' | 'error';
    accuracy?: number;
    last_trained?: string;
    api_endpoint?: string;
    config?: Record<string, unknown>;
}

interface ModelMetrics {
    id: string;
    model: string;
    model_name?: string;
    total_requests: number;
    success_rate: number;
    avg_latency_ms: number;
    date: string;
}

const AIModels: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'models' | 'metrics'>('models');
    const [models, setModels] = useState<AIModel[]>([]);
    const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);

    useEffect(() => {
        fetchModels();
        fetchMetrics();
    }, []);

    const fetchModels = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/ai/models/');
            setModels(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch AI models', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            const response = await api.get('/ai/metrics/');
            setMetrics(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch metrics', error);
        }
    };

    const handleToggleModel = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.patch(`/ai/models/${id}/`, { status: newStatus });
            fetchModels();
        } catch (error) {
            console.error('Failed to toggle model', error);
        }
    };

    const handleRetrain = async (id: string) => {
        try {
            await api.post(`/ai/models/${id}/retrain/`);
            fetchModels();
        } catch (error) {
            console.error('Failed to start retraining', error);
            alert('Failed to start retraining');
        }
    };

    const handleModelSubmit = async (data: Record<string, unknown>) => {
        try {
            if (editingModel) {
                await api.put(`/ai/models/${editingModel.id}/`, data);
            } else {
                await api.post('/ai/models/', data);
            }
            setIsModalOpen(false);
            setEditingModel(null);
            fetchModels();
        } catch (error) {
            console.error('Failed to save model', error);
            alert('Failed to save model configuration');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-slate-100 text-slate-600',
            training: 'bg-blue-100 text-blue-700 animate-pulse',
            error: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
                {status}
            </span>
        );
    };

    const getModelTypeIcon = (type: string) => {
        const colors: Record<string, string> = {
            resume_parser: 'bg-blue-100 text-blue-600',
            sentiment: 'bg-purple-100 text-purple-600',
            face_recognition: 'bg-amber-100 text-amber-600',
            fraud_detection: 'bg-red-100 text-red-600',
            recommendation: 'bg-green-100 text-green-600',
            chatbot: 'bg-pink-100 text-pink-600',
        };
        return colors[type] || 'bg-slate-100 text-slate-600';
    };

    const modelColumns: Column<AIModel>[] = [
        {
            header: 'Model', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getModelTypeIcon(item.model_type)}`}>
                        <Brain size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.provider} • v{item.version}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Type', accessor: (item) => (
                <span className="capitalize">{item.model_type.replace('_', ' ')}</span>
            )
        },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
        {
            header: 'Accuracy', accessor: (item) => (
                item.accuracy !== undefined ? (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${item.accuracy >= 90 ? 'bg-green-500' : item.accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${item.accuracy}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium">{item.accuracy}%</span>
                    </div>
                ) : <span className="text-slate-400">N/A</span>
            )
        },
        { header: 'Last Trained', accessor: (item) => item.last_trained ? new Date(item.last_trained).toLocaleDateString() : '-' },
    ];

    const metricColumns: Column<ModelMetrics>[] = [
        { header: 'Model', accessor: (item) => item.model_name || item.model },
        { header: 'Date', accessor: (item) => new Date(item.date).toLocaleDateString() },
        { header: 'Requests', accessor: (item) => item.total_requests.toLocaleString() },
        {
            header: 'Success Rate', accessor: (item) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.success_rate >= 99 ? 'bg-green-500' : item.success_rate >= 95 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span>{item.success_rate.toFixed(1)}%</span>
                </div>
            )
        },
        {
            header: 'Avg Latency', accessor: (item) => (
                <span className={item.avg_latency_ms > 1000 ? 'text-red-600' : item.avg_latency_ms > 500 ? 'text-yellow-600' : 'text-green-600'}>
                    {item.avg_latency_ms}ms
                </span>
            )
        },
    ];

    const modelFormFields: FormFieldConfig[] = [
        { name: 'name', label: 'Model Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true },
        {
            name: 'model_type', label: 'Type', type: 'select', required: true, options: [
                { value: 'resume_parser', label: 'Resume Parser' },
                { value: 'sentiment', label: 'Sentiment Analysis' },
                { value: 'face_recognition', label: 'Face Recognition' },
                { value: 'fraud_detection', label: 'Fraud Detection' },
                { value: 'recommendation', label: 'Recommendation' },
                { value: 'chatbot', label: 'Chatbot' },
            ]
        },
        {
            name: 'provider', label: 'Provider', type: 'select', required: true, options: [
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'google', label: 'Google AI' },
                { value: 'huggingface', label: 'Hugging Face' },
                { value: 'custom', label: 'Custom' },
            ]
        },
        { name: 'version', label: 'Version', type: 'text', required: true },
        { name: 'api_endpoint', label: 'API Endpoint', type: 'text' },
    ];

    const stats = {
        total: models.length,
        active: models.filter(m => m.status === 'active').length,
        training: models.filter(m => m.status === 'training').length,
        errors: models.filter(m => m.status === 'error').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">AI Models</h1>
                    <p className="text-slate-500">Manage and monitor AI/ML models</p>
                </div>
                <button
                    onClick={() => { setEditingModel(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Cpu size={18} />
                    Configure Model
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Brain className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-sm text-slate-500">Total Models</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Activity className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
                            <p className="text-sm text-slate-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <RefreshCw className="text-blue-600 animate-spin" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.training}</p>
                            <p className="text-sm text-slate-500">Training</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.errors}</p>
                            <p className="text-sm text-slate-500">Errors</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['models', 'metrics'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors capitalize ${activeTab === tab
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'models' ? 'AI Models' : 'Performance Metrics'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'models' && (
                <DataTable
                    columns={modelColumns}
                    data={models}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleToggleModel(item.id, item.status)}
                                className={`p-1 ${item.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                                title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                                {item.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button onClick={() => handleRetrain(item.id)} className="p-1 text-blue-500 hover:text-blue-700" title="Retrain">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => { setEditingModel(item); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-primary-600" title="Configure">
                                <Settings size={16} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'metrics' && (
                <DataTable columns={metricColumns} data={metrics} isLoading={isLoading} />
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingModel(null); }}
                title={editingModel ? 'Configure Model' : 'Add Model'}
            >
                <DynamicForm
                    fields={modelFormFields}
                    initialValues={editingModel || { model_type: 'resume_parser', provider: 'openai', version: '1.0' }}
                    onSubmit={handleModelSubmit}
                    onCancel={() => { setIsModalOpen(false); setEditingModel(null); }}
                />
            </Modal>
        </div>
    );
};

export default AIModels;
