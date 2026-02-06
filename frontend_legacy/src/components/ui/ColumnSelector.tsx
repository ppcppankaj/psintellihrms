/**
 * ColumnSelector Component - Dropdown for column visibility
 */

import { useState, useRef, useEffect } from 'react'

interface Column {
    key: string
    header: string
}

interface ColumnSelectorProps {
    columns: Column[]
    visibleColumns: Set<string>
    onToggle: (key: string) => void
    onReset: () => void
}

export default function ColumnSelector({
    columns,
    visibleColumns,
    onToggle,
    onReset,
}: ColumnSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                title="Column visibility"
            >
                <ColumnsIcon />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 z-50">
                    <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            Columns
                        </span>
                        <button
                            onClick={onReset}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-2">
                        {columns.map((column) => (
                            <label
                                key={column.key}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.has(column.key)}
                                    onChange={() => onToggle(column.key)}
                                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-surface-700 dark:text-surface-300">
                                    {column.header}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function ColumnsIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
    )
}
