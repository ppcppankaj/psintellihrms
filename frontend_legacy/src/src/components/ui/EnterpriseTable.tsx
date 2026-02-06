/**
 * EnterpriseTable Component - Advanced data table with server-side features
 */

import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import BulkUploadModal from '@/components/ui/BulkUploadModal'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

// Types
export interface Column<T> {
    key: keyof T | string
    header: string
    sortable?: boolean
    width?: string
    render?: (value: unknown, row: T) => React.ReactNode
    className?: string
}

export interface TableState {
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters: Record<string, unknown>
    search?: string
}

export interface PaginatedData<T> {
    results: T[]
    count: number
    next: string | null
    previous: string | null
}

interface EnterpriseTableProps<T> {
    columns: Column<T>[]
    fetchData: (state: TableState) => Promise<PaginatedData<T>>
    initialState?: Partial<TableState>
    onRowClick?: (row: T) => void
    selectable?: boolean
    onSelectionChange?: (selectedRows: T[]) => void
    rowKey: keyof T
    emptyMessage?: string
    searchPlaceholder?: string
    showSearch?: boolean
    showFilters?: boolean
    filterComponents?: React.ReactNode
    actions?: React.ReactNode
    stickyHeader?: boolean

    // Import/Export support
    enableImport?: boolean
    enableExport?: boolean
    onImport?: (file: File) => Promise<any>
    onExport?: (format: 'csv' | 'xlsx') => void
    onDownloadTemplate?: () => void
}

const PAGE_SIZES = [10, 20, 50, 100]

export default function EnterpriseTable<T extends Record<string, unknown>>({
    columns,
    fetchData,
    initialState,
    onRowClick,
    selectable = false,
    onSelectionChange,
    rowKey,
    emptyMessage = 'No data available',
    searchPlaceholder = 'Search...',
    showSearch = true,
    filterComponents,
    actions,
    stickyHeader = true,
    enableImport = false,
    enableExport = false,
    onImport,
    onExport,
    onDownloadTemplate,
}: EnterpriseTableProps<T>) {
    const [data, setData] = useState<T[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedRows, setSelectedRows] = useState<Set<unknown>>(new Set())
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)

    const [tableState, setTableState] = useState<TableState>({
        page: 1,
        pageSize: 20,
        filters: {},
        ...initialState,
    })

    const [searchValue, setSearchValue] = useState(tableState.search || '')
    const [debouncedSearch, setDebouncedSearch] = useState(searchValue)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchValue), 300)
        return () => clearTimeout(timer)
    }, [searchValue])

    // Fetch data when state changes
    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await fetchData({ ...tableState, search: debouncedSearch })
            setData(result.results)
            setTotalCount(result.count)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            setData([])
            setTotalCount(0)
        } finally {
            setIsLoading(false)
        }
    }, [fetchData, tableState, debouncedSearch])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Handle sort
    const handleSort = (key: string) => {
        setTableState(prev => ({
            ...prev,
            page: 1,
            sortBy: key,
            sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        }))
    }

    // Handle page change
    const handlePageChange = (page: number) => {
        setTableState(prev => ({ ...prev, page }))
    }

    // Handle page size change
    const handlePageSizeChange = (pageSize: number) => {
        setTableState(prev => ({ ...prev, page: 1, pageSize }))
    }

    // Handle selection
    const toggleSelectAll = () => {
        if (selectedRows.size === data.length) {
            setSelectedRows(new Set())
        } else {
            setSelectedRows(new Set(data.map(row => row[rowKey])))
        }
    }

    const toggleSelectRow = (row: T) => {
        const newSelected = new Set(selectedRows)
        const key = row[rowKey]
        if (newSelected.has(key)) {
            newSelected.delete(key)
        } else {
            newSelected.add(key)
        }
        setSelectedRows(newSelected)
    }

    // Notify parent of selection changes
    useEffect(() => {
        if (onSelectionChange) {
            const selected = data.filter(row => selectedRows.has(row[rowKey]))
            onSelectionChange(selected)
        }
    }, [selectedRows, data, onSelectionChange, rowKey])

    // Get cell value
    const getCellValue = (row: T, column: Column<T>): unknown => {
        const key = column.key as string
        if (key.includes('.')) {
            return key.split('.').reduce((obj: any, k) => obj?.[k], row)
        }
        return row[key]
    }

    const totalPages = Math.max(1, Math.ceil((totalCount || 0) / tableState.pageSize))

    return (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {showSearch && (
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="pl-9 pr-3 py-2 w-64 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                    )}
                    {filterComponents}
                </div>
                <div className="flex items-center gap-2">
                    {enableExport && onExport && (
                        <button
                            onClick={() => onExport('csv')}
                            className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                            title="Export CSV"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5" />
                        </button>
                    )}
                    {enableImport && onImport && (
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                            title="Import"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                    )}
                    {actions}
                    <button
                        onClick={loadData}
                        className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        title="Refresh"
                    >
                        <RefreshIcon />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={`bg-surface-50 dark:bg-surface-900/50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        <tr>
                            {selectable && (
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={data.length > 0 && selectedRows.size === data.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={`px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider ${column.className || ''}`}
                                    style={{ width: column.width }}
                                >
                                    {column.sortable ? (
                                        <button
                                            onClick={() => handleSort(String(column.key))}
                                            className="flex items-center gap-1 hover:text-surface-700 dark:hover:text-surface-300"
                                        >
                                            {column.header}
                                            <SortIcon
                                                active={tableState.sortBy === String(column.key)}
                                                direction={tableState.sortBy === String(column.key) ? tableState.sortOrder : undefined}
                                            />
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                                    <LoadingSpinner size="lg" />
                                </td>
                            </tr>
                        ) : (!data || data.length === 0) ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-surface-500">
                                    <EmptyIcon className="mx-auto h-10 w-10 text-surface-400 mb-2" />
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={String(row[rowKey])}
                                    onClick={() => onRowClick?.(row)}
                                    className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50' : ''}
                    ${selectedRows.has(row[rowKey]) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}
                  `}
                                >
                                    {selectable && (
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(row[rowKey])}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    toggleSelectRow(row)
                                                }}
                                                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td
                                            key={String(column.key)}
                                            className={`px-4 py-3 text-sm text-surface-900 dark:text-surface-100 ${column.className || ''}`}
                                        >
                                            {column.render
                                                ? column.render(getCellValue(row, column), row)
                                                : getCellValue(row, column) as React.ReactNode}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-surface-500">
                    <span>
                        Showing {Math.min((tableState.page - 1) * tableState.pageSize + 1, totalCount || 0)} to {Math.min(tableState.page * tableState.pageSize, totalCount || 0)} of {totalCount || 0}
                    </span>
                    <select
                        value={tableState.pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-2 py-1 rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm"
                    >
                        {PAGE_SIZES.map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={tableState.page === 1}
                        className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronDoubleLeftIcon />
                    </button>
                    <button
                        onClick={() => handlePageChange(tableState.page - 1)}
                        disabled={tableState.page === 1}
                        className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeftIcon />
                    </button>
                    <span className="px-3 py-1 text-sm text-surface-700 dark:text-surface-300">
                        Page {tableState.page} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(tableState.page + 1)}
                        disabled={tableState.page >= totalPages}
                        className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRightIcon />
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={tableState.page >= totalPages}
                        className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronDoubleRightIcon />
                    </button>
                </div>
            </div>

            {/* Modal */}
            {enableImport && onImport && onDownloadTemplate && (
                <BulkUploadModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onUpload={onImport}
                    onDownloadTemplate={onDownloadTemplate}
                />
            )}
        </div>
    )
}

// Icons
function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    )
}

function RefreshIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    )
}

function SortIcon({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
    return (
        <svg className={`w-3 h-3 ${active ? 'text-primary-600' : 'text-surface-400'}`} fill="currentColor" viewBox="0 0 20 20">
            {direction === 'asc' ? (
                <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" />
            ) : direction === 'desc' ? (
                <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" />
            ) : (
                <>
                    <path d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414l-3.293 3.293a1 1 0 01-1.414 0z" />
                    <path d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z" />
                </>
            )}
        </svg>
    )
}

function EmptyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    )
}

function ChevronLeftIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    )
}

function ChevronRightIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
}

function ChevronDoubleLeftIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
    )
}

function ChevronDoubleRightIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
    )
}
