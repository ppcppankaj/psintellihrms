import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    CalendarIcon,
    CurrencyDollarIcon,
    ClockIcon,
    DocumentTextIcon,
    UserCircleIcon,
    ChartBarIcon,
    AcademicCapIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { payrollService } from '@/services/payrollService'
import { performanceService } from '@/services/performanceService'
import { attendanceService } from '@/services/attendanceService'
import { useAuthStore } from '@/store/authStore'

export default function ESSPortal() {
    const { user } = useAuthStore()
    const hasEmployeeProfile = !!user?.employee_id

    // 1. Fetch Leave Balance
    const { data: balances } = useQuery({
        queryKey: ['my-leave-balances'],
        queryFn: () => leaveService.getMyBalance(),
        enabled: hasEmployeeProfile
    })

    // 2. Fetch Recent Payslips
    const { data: payslips } = useQuery({
        queryKey: ['my-recent-payslips'],
        queryFn: () => payrollService.getPayslips(),
        enabled: hasEmployeeProfile
    })

    // 3. Fetch Training Recommendations
    const { data: recommendations } = useQuery({
        queryKey: ['my-recommendations'],
        queryFn: () => performanceService.getMyRecommendations(),
        enabled: hasEmployeeProfile
    })

    // 4. Fetch Attendance Summary
    const { data: attendanceSummary } = useQuery({
        queryKey: ['my-attendance-summary'],
        queryFn: () => attendanceService.getMySummary(),
        enabled: hasEmployeeProfile
    })

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <QuickAction
                    title="Apply Leave"
                    icon={CalendarIcon}
                    to="/leave/apply"
                    color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                />
                <QuickAction
                    title="My Payslips"
                    icon={CurrencyDollarIcon}
                    to="/payroll/payslips"
                    color="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                />
                <QuickAction
                    title="Attendance"
                    icon={ClockIcon}
                    to="/attendance"
                    color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                />
                <QuickAction
                    title="Expenses"
                    icon={DocumentTextIcon}
                    to="/expenses"
                    color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                />
                <QuickAction
                    title="Profile"
                    icon={UserCircleIcon}
                    to="/profile"
                    color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                />
                <QuickAction
                    title="Appraisals"
                    icon={ChartBarIcon}
                    to="/performance"
                    color="bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Leave & Attendance */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Leave Balances */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Leave Balances</h2>
                            <Link to="/leave" className="text-sm text-primary-600 hover:underline">View History</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {balances?.slice(0, 3).map((bal: any) => (
                                <div key={bal.id} className="p-4 rounded-xl border border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                                    <p className="text-sm text-surface-500 dark:text-surface-400 truncate">{bal.leave_type_name}</p>
                                    <div className="mt-2 flex items-end justify-between">
                                        <p className="text-2xl font-bold text-surface-900 dark:text-white">{parseFloat(bal.available_balance.toString())}</p>
                                        <p className="text-xs text-surface-400 mb-1">Days</p>
                                    </div>
                                    <div className="mt-3 w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary-500 h-full"
                                            style={{ width: `${Math.min((parseFloat(bal.taken.toString()) / (parseFloat(bal.available_balance.toString()) + parseFloat(bal.taken.toString()))) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performance & Training Recommendations */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Professional Development</h2>
                            <Link to="/performance" className="text-sm text-primary-600 hover:underline">Learn More</Link>
                        </div>
                        {recommendations && recommendations.length > 0 ? (
                            <div className="space-y-4">
                                {recommendations.slice(0, 3).map((rec) => (
                                    <div key={rec.id} className="flex items-start p-4 rounded-xl border border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                        <div className={`p-2 rounded-lg mr-4 ${rec.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <AcademicCapIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{rec.suggested_training}</h3>
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Based on competency: {rec.competency_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {rec.priority}
                                            </span>
                                            <p className="text-[10px] text-surface-400 mt-2">{rec.is_completed ? 'Completed' : 'Pending'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-surface-500">No training recommendations yet. Complete your appraisals to get started!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Payslips & Attendance Status */}
                <div className="space-y-8">
                    {/* Latest Payslip Summary */}
                    <div className="card p-6 bg-gradient-to-br from-surface-900 to-surface-800 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">Latest Payslip</h2>
                            <CurrencyDollarIcon className="w-6 h-6 text-white/40" />
                        </div>
                        {payslips && payslips.length > 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-white/60">Salary for {new Date(0, payslips[0].month - 1).toLocaleString('default', { month: 'long' })} {payslips[0].year}</p>
                                    <p className="text-3xl font-bold mt-1">₹{parseFloat(payslips[0].net_pay.toString()).toLocaleString()}</p>
                                </div>
                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <span className="text-xs text-white/60">Status: {payslips[0].status}</span>
                                    <Link to={`/payroll/payslips/${payslips[0].id}`} className="text-xs font-bold flex items-center hover:underline">
                                        Download PDF <ArrowRightIcon className="w-3 h-3 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-white/60">No payslips available yet.</p>
                        )}
                    </div>

                    {/* Attendance Stats Card */}
                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-6">Attendance Summary</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-2 h-10 bg-green-500 rounded-full mr-4" />
                                    <div>
                                        <p className="text-xs text-surface-500">Present Days</p>
                                        <p className="text-xl font-bold text-surface-900 dark:text-white">{attendanceSummary?.present_days || 0}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-surface-500">Avg. Hours</p>
                                    <p className="text-xl font-bold text-surface-900 dark:text-white">{(attendanceSummary?.total_hours || 0) / (attendanceSummary?.present_days || 1)}h</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-10 bg-red-400 rounded-full mr-4" />
                                <div>
                                    <p className="text-xs text-surface-500">Absent / LOP</p>
                                    <p className="text-xl font-bold text-surface-900 dark:text-white">{attendanceSummary?.absent_days || 0}</p>
                                </div>
                            </div>
                        </div>
                        <Link to="/attendance" className="block w-full text-center mt-6 p-3 rounded-xl bg-surface-100 dark:bg-surface-700 text-sm font-semibold hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors">
                            Full Attendance Report
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function QuickAction({ title, icon: Icon, to, color }: { title: string; icon: any; to: string; color: string }) {
    return (
        <Link to={to} className="group">
            <div className="card p-4 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                <div className={`p-3 rounded-2xl mb-3 ${color} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{title}</span>
            </div>
        </Link>
    )
}
