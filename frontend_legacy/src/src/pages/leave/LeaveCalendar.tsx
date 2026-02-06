/**
 * LeaveCalendar.tsx - Visual calendar for employee leaves and holidays
 */

import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useQuery } from '@tanstack/react-query'
import { leaveService, LeaveRequest } from '@/services/leaveService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function LeaveCalendar() {
    const [date, setDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

    const year = date.getFullYear()

    // Get my leave requests for initial view
    const { data: requests } = useQuery({
        queryKey: ['my-leave-requests-calendar'],
        queryFn: () => leaveService.getMyRequests(),
    })

    // Get holidays for the current year
    const { data: holidays } = useQuery({
        queryKey: ['holidays-calendar', year],
        queryFn: () => leaveService.getHolidays(year),
    })

    // Helper functions to check for events on a specific date
    const getLeavesOnDate = (d: Date) => {
        if (!requests) return []
        const dateStr = d.toISOString().split('T')[0]
        return requests.filter(req => {
            const startStr = req.start_date
            const endStr = req.end_date
            return dateStr >= startStr && dateStr <= endStr && req.status === 'approved'
        })
    }

    const getHolidaysOnDate = (d: Date) => {
        if (!holidays) return []
        const dateStr = d.toISOString().split('T')[0]
        return holidays.filter(h => h.date === dateStr)
    }

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view !== 'month') return ''

        const leaves = getLeavesOnDate(date)
        const dayHolidays = getHolidaysOnDate(date)

        if (dayHolidays.length > 0) return 'bg-amber-100 dark:bg-amber-900/30 font-bold border-2 border-amber-300'
        if (leaves.length > 0) return 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 border-2 border-primary-300'

        return ''
    }

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view !== 'month') return null

        const leaves = getLeavesOnDate(date)
        const dayHolidays = getHolidaysOnDate(date)

        return (
            <div className="flex justify-center mt-1">
                {dayHolidays.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />}
                {leaves.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
            </div>
        )
    }

    const selectedEvents = selectedDate ? [...getLeavesOnDate(selectedDate), ...getHolidaysOnDate(selectedDate)] : []

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6 shadow-xl bg-white dark:bg-surface-800 border-0">
                <style>{`
                    .react-calendar {
                        width: 100%;
                        border: none;
                        font-family: inherit;
                        background: transparent;
                    }
                    .react-calendar__navigation button {
                        min-width: 44px;
                        background: none;
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #1e293b;
                    }
                    .dark .react-calendar__navigation button {
                        color: #f8fafc;
                    }
                    .react-calendar__month-view__weekdays {
                        text-transform: uppercase;
                        font-weight: bold;
                        font-size: 0.75rem;
                        color: #64748b;
                    }
                    .react-calendar__tile {
                        padding: 1.5em 0.5em !important;
                        border-radius: 0.75rem !important;
                        position: relative;
                        transition: all 0.2s ease;
                    }
                    .react-calendar__tile:hover {
                        background-color: #f1f5f9;
                    }
                    .dark .react-calendar__tile:hover {
                        background-color: #334155;
                    }
                    .react-calendar__tile--now {
                        background: #f8fafc;
                        border: 2px solid #6366f1 !important;
                    }
                    .dark .react-calendar__tile--now {
                        background: #1e293b;
                    }
                    .react-calendar__tile--active {
                        background: #6366f1 !important;
                        color: white !important;
                    }
                    .react-calendar__tile--active:enabled:hover, .react-calendar__tile--active:enabled:focus {
                        background: #4f46e5 !important;
                    }
                `}</style>

                <Calendar
                    onChange={(val) => setSelectedDate(val as Date)}
                    value={date}
                    onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setDate(activeStartDate)}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    nextLabel={<ChevronRightIcon className="w-5 h-5" />}
                    prevLabel={<ChevronLeftIcon className="w-5 h-5" />}
                    next2Label={null}
                    prev2Label={null}
                />
            </div>

            <div className="space-y-6">
                <div className="card p-6 min-h-[400px]">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center mb-6">
                        <CalendarIcon className="w-6 h-6 mr-2 text-primary-500" />
                        {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>

                    <AnimatePresence mode="wait">
                        {selectedEvents.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {selectedEvents.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-xl border-l-4 ${'date' in event
                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                                            : 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                                            }`}
                                    >
                                        <h4 className="font-bold text-surface-900 dark:text-white">
                                            {'name' in event ? event.name : (event as LeaveRequest).leave_type_name}
                                        </h4>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                            {'is_optional' in event
                                                ? (event.is_optional ? 'Optional Holiday' : 'Public Holiday')
                                                : `Approved Leave (${(event as LeaveRequest).total_days} days)`
                                            }
                                        </p>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center py-20"
                            >
                                <InformationCircleIcon className="w-12 h-12 text-surface-300 mb-4" />
                                <p className="text-surface-500">No events scheduled for this date</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                    <h4 className="font-bold mb-4">Legend</h4>
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-400 mr-2" />
                            <span className="text-sm">Holidays</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-indigo-300 mr-2" />
                            <span className="text-sm">My Leaves</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-white mr-2" />
                            <span className="text-sm">Today</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
