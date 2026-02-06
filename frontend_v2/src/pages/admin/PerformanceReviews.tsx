import React, { useState, useEffect } from 'react';
import { Star, Target, TrendingUp, Award, MessageSquare, Edit2 } from 'lucide-react';
import { performanceService } from '../../api/performanceService';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';

interface Review {
    id: string;
    employee: string;
    employee_name?: string;
    reviewer_name?: string;
    cycle: string;
    cycle_title?: string;
    status: string;
    final_rating: number | null;
    self_rating?: number | null;
    manager_rating?: number | null;
}

interface OKR {
    id: string;
    title: string;
    description?: string;
    employee?: string;
    employee_name?: string;
    progress: number;
    status: string;
    due_date?: string;
}

// Feedback feature placeholder - interface would be added when API is ready

const PerformanceReviews: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'reviews' | 'okrs' | 'kras' | 'feedback'>('reviews');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [okrs, setOkrs] = useState<OKR[]>([]);
    const [kras, setKras] = useState<OKR[]>([]);
    // const [feedback, setFeedback] = useState<Feedback[]>([]); // Feedback API not yet implemented
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'review' | 'feedback'>('review');
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    useEffect(() => {
        fetchReviews();
        fetchOKRs();
        fetchKRAs();
    }, []);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const response = await performanceService.getReviews();
            setReviews(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOKRs = async () => {
        try {
            const response = await performanceService.getOKRs();
            setOkrs(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch OKRs', error);
        }
    };

    const fetchKRAs = async () => {
        try {
            const response = await performanceService.getKRAs();
            setKras(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch KRAs', error);
        }
    };

    const handleManagerReview = async (values: Record<string, unknown>) => {
        if (!selectedReview) return;
        try {
            await performanceService.submitManagerReview(selectedReview.id, values);
            setIsModalOpen(false);
            setSelectedReview(null);
            fetchReviews();
        } catch (error) {
            console.error('Failed to submit review', error);
            alert('Failed to submit review');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-slate-100 text-slate-600',
            self_review: 'bg-blue-100 text-blue-700',
            manager_review: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-green-100 text-green-700',
            in_progress: 'bg-blue-100 text-blue-700',
            on_track: 'bg-green-100 text-green-700',
            at_risk: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-slate-100'}`}>
                {status?.replace('_', ' ')}
            </span>
        );
    };

    const getRatingStars = (rating: number | null) => {
        if (rating === null) return <span className="text-slate-400">N/A</span>;
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                ))}
                <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
        );
    };

    const reviewColumns: Column<Review>[] = [
        {
            header: 'Employee', accessor: (item) => (
                <div>
                    <p className="font-medium text-slate-800">{item.employee_name || item.employee}</p>
                    <p className="text-sm text-slate-500">{item.cycle_title || item.cycle}</p>
                </div>
            )
        },
        { header: 'Reviewer', accessor: (item) => item.reviewer_name || '-' },
        { header: 'Self Rating', accessor: (item) => getRatingStars(item.self_rating || null) },
        { header: 'Manager Rating', accessor: (item) => getRatingStars(item.manager_rating || null) },
        { header: 'Final Rating', accessor: (item) => getRatingStars(item.final_rating) },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const okrColumns: Column<OKR>[] = [
        {
            header: 'Objective', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Target className="text-purple-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.employee_name || '-'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Progress', accessor: (item) => (
                <div className="w-32">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{item.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${(item.progress || 0) >= 80 ? 'bg-green-500' :
                                (item.progress || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${item.progress || 0}%` }}
                        />
                    </div>
                </div>
            )
        },
        { header: 'Due Date', accessor: (item) => item.due_date ? new Date(item.due_date).toLocaleDateString() : '-' },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const kraColumns: Column<OKR>[] = [
        {
            header: 'KRA', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Award className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.description?.slice(0, 50) || '-'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Weight/Progress', accessor: (item) => (
                <span className="font-medium">{item.progress || 0}%</span>
            )
        },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const reviewFormFields: FormFieldConfig[] = [
        { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
        { name: 'strengths', label: 'Strengths', type: 'textarea' },
        { name: 'improvements', label: 'Areas for Improvement', type: 'textarea' },
        { name: 'comments', label: 'Comments', type: 'textarea' },
    ];

    const stats = {
        pending: reviews.filter(r => r.status === 'pending' || r.status === 'self_review').length,
        inProgress: reviews.filter(r => r.status === 'manager_review').length,
        completed: reviews.filter(r => r.status === 'completed').length,
        avgRating: reviews.filter(r => r.final_rating).reduce((sum, r) => sum + (r.final_rating || 0), 0) /
            (reviews.filter(r => r.final_rating).length || 1),
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Performance Management</h1>
                    <p className="text-slate-500">Reviews, OKRs, KRAs, and feedback</p>
                </div>
                <button
                    onClick={() => {
                        setModalType('feedback');
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <MessageSquare size={18} />
                    Give Feedback
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Star className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                            <p className="text-sm text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
                            <p className="text-sm text-slate-500">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Award className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
                            <p className="text-sm text-slate-500">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Star className="text-purple-600 fill-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.avgRating.toFixed(1)}</p>
                            <p className="text-sm text-slate-500">Avg Rating</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['reviews', 'okrs', 'kras', 'feedback'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors uppercase text-sm ${activeTab === tab
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
            {activeTab === 'reviews' && (
                <DataTable
                    columns={reviewColumns}
                    data={reviews}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-2">
                            {item.status === 'manager_review' && (
                                <button
                                    onClick={() => { setSelectedReview(item); setModalType('review'); setIsModalOpen(true); }}
                                    className="flex items-center gap-1 text-primary-600 text-sm"
                                >
                                    <Edit2 size={14} /> Review
                                </button>
                            )}
                        </div>
                    )}
                />
            )}

            {activeTab === 'okrs' && (
                <DataTable columns={okrColumns} data={okrs} isLoading={isLoading} />
            )}

            {activeTab === 'kras' && (
                <DataTable columns={kraColumns} data={kras} isLoading={isLoading} />
            )}

            {activeTab === 'feedback' && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                    <MessageSquare className="mx-auto mb-4 text-slate-300" size={48} />
                    <p>Feedback feature coming soon. Click "Give Feedback" to provide peer feedback.</p>
                </div>
            )}

            {/* Modal for Manager Review */}
            <Modal
                isOpen={isModalOpen && modalType === 'review'}
                onClose={() => { setIsModalOpen(false); setSelectedReview(null); }}
                title={`Review for ${selectedReview?.employee_name || 'Employee'}`}
            >
                <DynamicForm
                    fields={reviewFormFields}
                    initialValues={{}}
                    onSubmit={handleManagerReview}
                    onCancel={() => { setIsModalOpen(false); setSelectedReview(null); }}
                />
            </Modal>

            {/* Modal for Feedback */}
            <Modal
                isOpen={isModalOpen && modalType === 'feedback'}
                onClose={() => setIsModalOpen(false)}
                title="Give Feedback"
            >
                <DynamicForm
                    fields={[
                        { name: 'to_employee', label: 'To Employee (ID)', type: 'text', required: true },
                        {
                            name: 'feedback_type', label: 'Type', type: 'select', required: true, options: [
                                { value: 'praise', label: 'Praise' },
                                { value: 'suggestion', label: 'Suggestion' },
                                { value: 'constructive', label: 'Constructive' },
                            ]
                        },
                        { name: 'content', label: 'Feedback', type: 'textarea', required: true },
                    ]}
                    initialValues={{ feedback_type: 'praise' }}
                    onSubmit={() => { setIsModalOpen(false); }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default PerformanceReviews;
