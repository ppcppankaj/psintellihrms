import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Grid, List } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    mobileHidden?: boolean; // Hide this column on mobile card view
    isPrimary?: boolean; // Show as primary/title in card view
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
    onSearch?: (query: string) => void;
    actions?: (item: T) => React.ReactNode;
    enableCardView?: boolean; // Enable card view toggle on mobile
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    isLoading,
    pagination,
    onSearch,
    actions,
    enableCardView = true,
}: DataTableProps<T>) {
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const renderCellValue = (item: T, column: Column<T>): React.ReactNode => {
        if (typeof column.accessor === 'function') {
            return column.accessor(item);
        }
        return item[column.accessor] as React.ReactNode;
    };

    // Card View for Mobile
    const renderCardView = () => (
        <div className="p-4 space-y-4">
            {isLoading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            )}

            {data.length === 0 && !isLoading ? (
                <div className="text-center text-slate-400 py-12">No records found.</div>
            ) : (
                data.map((item) => {
                    const primaryColumn = columns.find(c => c.isPrimary) || columns[0];
                    const secondaryColumns = columns.filter(c => !c.isPrimary && !c.mobileHidden);

                    return (
                        <div
                            key={item.id}
                            className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-primary-200 transition-colors"
                        >
                            {/* Primary/Title Row */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 font-medium text-slate-800">
                                    {renderCellValue(item, primaryColumn)}
                                </div>
                                {actions && (
                                    <div className="ml-4 flex-shrink-0">{actions(item)}</div>
                                )}
                            </div>

                            {/* Secondary Fields */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {secondaryColumns.slice(0, 4).map((column, idx) => (
                                    <div key={idx} className="overflow-hidden">
                                        <span className="text-slate-400 text-xs block">{column.header}</span>
                                        <span className="text-slate-600 truncate block">
                                            {renderCellValue(item, column)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    // Table View
    const renderTableView = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                        {columns.map((column, idx) => (
                            <th key={idx} className={`px-6 py-4 ${column.className || ''} ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}>
                                {column.header}
                            </th>
                        ))}
                        {actions && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 relative">
                    {isLoading && (
                        <tr className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 h-32">
                            <td colSpan={columns.length + (actions ? 1 : 0)}>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            </td>
                        </tr>
                    )}

                    {data.length === 0 && !isLoading ? (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400">
                                No records found.
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr key={item.id} className="text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                {columns.map((column, idx) => (
                                    <td key={idx} className={`px-6 py-4 ${column.className || ''} ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}>
                                        {renderCellValue(item, column)}
                                    </td>
                                ))}
                                {actions && <td className="px-6 py-4 text-right">{actions(item)}</td>}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Search and View Toggle */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-4">
                {onSearch && (
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                )}

                {/* View Toggle - only show on mobile if enabled */}
                {enableCardView && isMobile && (
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}
                            title="Card View"
                        >
                            <Grid size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {isMobile && viewMode === 'card' ? renderCardView() : renderTableView()}

            {/* Pagination */}
            {pagination && (
                <div className="px-4 md:px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-sm text-slate-500">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <div className="flex space-x-2">
                        <button
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className="p-2 border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={pagination.currentPage === pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            className="p-2 border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
