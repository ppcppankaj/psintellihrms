import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, User, Briefcase, Calendar, Star, Send, Check, X, Edit2 } from 'lucide-react';
import { talentService } from '../../api/talentService';
import type { Candidate, JobApplication } from '../../api/talentService';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';

interface Interview {
    id: string;
    application: string;
    candidate_name?: string;
    job_title?: string;
    interview_type: string;
    scheduled_at: string;
    interviewer_name?: string;
    status: string;
}

interface Offer {
    id: string;
    application: string;
    candidate_name?: string;
    job_title?: string;
    salary: number;
    start_date: string;
    status: string;
    extended_at?: string;
}

const Candidates: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'candidates' | 'applications' | 'interviews' | 'offers'>('candidates');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

    useEffect(() => {
        fetchCandidates();
        fetchApplications();
        fetchInterviews();
        fetchOffers();
    }, []);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const response = await talentService.getCandidates();
            setCandidates(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch candidates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const response = await talentService.getApplications();
            setApplications(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch applications', error);
        }
    };

    const fetchInterviews = async () => {
        try {
            const response = await talentService.getInterviews();
            setInterviews(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch interviews', error);
        }
    };

    const fetchOffers = async () => {
        try {
            const response = await talentService.getOffers();
            setOffers(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch offers', error);
        }
    };

    const handleUpdateStage = async (applicationId: string, stage: string) => {
        try {
            await talentService.updateApplicationStage(applicationId, stage);
            fetchApplications();
        } catch (error) {
            console.error('Failed to update stage', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            new: 'bg-blue-100 text-blue-700',
            screening: 'bg-yellow-100 text-yellow-700',
            interview: 'bg-purple-100 text-purple-700',
            offer: 'bg-green-100 text-green-700',
            hired: 'bg-emerald-100 text-emerald-700',
            rejected: 'bg-red-100 text-red-700',
            scheduled: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-slate-100 text-slate-500',
            pending: 'bg-yellow-100 text-yellow-700',
            accepted: 'bg-green-100 text-green-700',
            declined: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-slate-100'}`}>
                {status?.replace('_', ' ')}
            </span>
        );
    };

    const candidateColumns: Column<Candidate>[] = [
        {
            header: 'Candidate', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="text-primary-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.first_name} {item.last_name}</p>
                        <p className="text-sm text-slate-500">{item.email}</p>
                    </div>
                </div>
            )
        },
        { header: 'Phone', accessor: 'phone' },
        {
            header: 'Source', accessor: (item) => (
                <span className="capitalize">{item.source?.replace('_', ' ') || '-'}</span>
            )
        },
    ];

    const applicationColumns: Column<JobApplication>[] = [
        { header: 'Candidate', accessor: (item) => item.candidate },
        { header: 'Job', accessor: (item) => item.job },
        { header: 'Stage', accessor: (item) => getStatusBadge(item.stage) },
        {
            header: 'AI Score', accessor: (item) => (
                item.ai_score !== null ? (
                    <div className="flex items-center gap-1">
                        <Star size={14} className={item.ai_score >= 80 ? 'text-green-500 fill-green-500' : item.ai_score >= 50 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500'} />
                        <span className="font-medium">{item.ai_score}%</span>
                    </div>
                ) : <span className="text-slate-400">N/A</span>
            )
        },
    ];

    const interviewColumns: Column<Interview>[] = [
        { header: 'Candidate', accessor: (item) => item.candidate_name || item.application },
        { header: 'Job', accessor: (item) => item.job_title || '-' },
        {
            header: 'Type', accessor: (item) => (
                <span className="capitalize">{item.interview_type?.replace('_', ' ')}</span>
            )
        },
        { header: 'Scheduled', accessor: (item) => new Date(item.scheduled_at).toLocaleString() },
        { header: 'Interviewer', accessor: (item) => item.interviewer_name || '-' },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const offerColumns: Column<Offer>[] = [
        { header: 'Candidate', accessor: (item) => item.candidate_name || item.application },
        { header: 'Job', accessor: (item) => item.job_title || '-' },
        {
            header: 'Salary', accessor: (item) => (
                <span className="font-medium">${item.salary?.toLocaleString()}</span>
            )
        },
        { header: 'Start Date', accessor: (item) => new Date(item.start_date).toLocaleDateString() },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const candidateFormFields: FormFieldConfig[] = [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'text' },
        {
            name: 'source', label: 'Source', type: 'select', options: [
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'indeed', label: 'Indeed' },
                { value: 'referral', label: 'Referral' },
                { value: 'website', label: 'Company Website' },
                { value: 'other', label: 'Other' },
            ]
        },
    ];

    const stages = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];

    const stats = {
        total: candidates.length,
        inPipeline: applications.filter((a: JobApplication) => !['hired', 'rejected'].includes(a.stage)).length,
        interviews: interviews.filter((i: Interview) => i.status === 'scheduled').length,
        offers: offers.filter((o: Offer) => o.status === 'pending').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Candidate Management</h1>
                    <p className="text-slate-500">Track applicants, interviews, and offers</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCandidate(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Candidate
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <User className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-sm text-slate-500">Total Candidates</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Briefcase className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.inPipeline}</p>
                            <p className="text-sm text-slate-500">In Pipeline</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Calendar className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.interviews}</p>
                            <p className="text-sm text-slate-500">Scheduled Interviews</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Send className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.offers}</p>
                            <p className="text-sm text-slate-500">Pending Offers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['candidates', 'applications', 'interviews', 'offers'] as const).map((tab) => (
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

            {/* Content */}
            {activeTab === 'candidates' && (
                <DataTable
                    columns={candidateColumns}
                    data={candidates}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setEditingCandidate(item); setIsModalOpen(true); }}
                                className="p-1 text-slate-400 hover:text-primary-600"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button className="p-1 text-slate-400 hover:text-primary-600">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'applications' && (
                <DataTable
                    columns={applicationColumns}
                    data={applications}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-1">
                            <select
                                className="text-xs border border-slate-200 rounded px-2 py-1"
                                value={item.stage}
                                onChange={(e) => handleUpdateStage(item.id, e.target.value)}
                            >
                                {stages.map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                    )}
                />
            )}

            {activeTab === 'interviews' && (
                <DataTable columns={interviewColumns} data={interviews} isLoading={isLoading} />
            )}

            {activeTab === 'offers' && (
                <DataTable
                    columns={offerColumns}
                    data={offers}
                    isLoading={isLoading}
                    actions={(item) => (
                        item.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button className="p-1 text-green-500 hover:text-green-700" title="Accept">
                                    <Check size={16} />
                                </button>
                                <button className="p-1 text-red-500 hover:text-red-700" title="Decline">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : null
                    )}
                />
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCandidate(null); }}
                title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}
            >
                <DynamicForm
                    fields={candidateFormFields}
                    initialValues={editingCandidate || { source: 'linkedin' }}
                    onSubmit={() => { setIsModalOpen(false); fetchCandidates(); }}
                    onCancel={() => { setIsModalOpen(false); setEditingCandidate(null); }}
                />
            </Modal>
        </div>
    );
};

export default Candidates;
