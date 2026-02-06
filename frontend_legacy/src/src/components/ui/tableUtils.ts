/**
 * Table utilities and hooks for EnterpriseTable
 */

import { useState, useCallback, useMemo } from 'react'
import { TableState, PaginatedData } from './EnterpriseTable'
import { api } from '@/services/api'

/**
 * useTableState - Hook for managing table state
 */
export function useTableState(initialState?: Partial<TableState>) {
    const [state, setState] = useState<TableState>({
        page: 1,
        pageSize: 20,
        filters: {},
        ...initialState,
    })

    const setPage = useCallback((page: number) => {
        setState(prev => ({ ...prev, page }))
    }, [])

    const setPageSize = useCallback((pageSize: number) => {
        setState(prev => ({ ...prev, page: 1, pageSize }))
    }, [])

    const setSort = useCallback((sortBy: string) => {
        setState(prev => ({
            ...prev,
            page: 1,
            sortBy,
            sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        }))
    }, [])

    const setFilters = useCallback((filters: Record<string, any>) => {
        setState(prev => ({ ...prev, page: 1, filters }))
    }, [])

    const setSearch = useCallback((search: string) => {
        setState(prev => ({ ...prev, page: 1, search }))
    }, [])

    const reset = useCallback(() => {
        setState({
            page: 1,
            pageSize: 20,
            filters: {},
            ...initialState,
        })
    }, [initialState])

    return {
        state,
        setPage,
        setPageSize,
        setSort,
        setFilters,
        setSearch,
        reset,
    }
}

/**
 * createTableFetcher - Factory to create table data fetchers
 */
export function createTableFetcher<T>(
    endpoint: string,
    mapParams?: (state: TableState) => Record<string, any>
) {
    return async (state: TableState): Promise<PaginatedData<T>> => {
        const params: Record<string, any> = {
            page: state.page,
            page_size: state.pageSize,
        }

        if (state.sortBy) {
            params.ordering = state.sortOrder === 'desc' ? `-${state.sortBy}` : state.sortBy
        }

        if (state.search) {
            params.search = state.search
        }

        // Apply filters
        Object.entries(state.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params[key] = value
            }
        })

        // Apply custom param mapping
        if (mapParams) {
            Object.assign(params, mapParams(state))
        }

        const response = await api.get<PaginatedData<T>>(endpoint, { params })
        return response.data
    }
}

/**
 * useColumnVisibility - Hook for managing column visibility
 */
export function useColumnVisibility(
    columns: { key: string; header: string }[],
    storageKey?: string
) {
    const defaultVisible = useMemo(
        () => new Set(columns.map(c => c.key)),
        [columns]
    )

    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
        if (storageKey) {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                const parsed = JSON.parse(stored)
                return new Set(parsed)
            }
        }
        return defaultVisible
    })

    const toggleColumn = useCallback((key: string) => {
        setVisibleColumns(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify([...next]))
            }
            return next
        })
    }, [storageKey])

    const resetColumns = useCallback(() => {
        setVisibleColumns(defaultVisible)
        if (storageKey) {
            localStorage.removeItem(storageKey)
        }
    }, [defaultVisible, storageKey])

    const filteredColumns = useMemo(
        () => columns.filter(c => visibleColumns.has(c.key)),
        [columns, visibleColumns]
    )

    return {
        visibleColumns,
        toggleColumn,
        resetColumns,
        filteredColumns,
    }
}

/**
 * Export utilities
 */
export async function exportTableData(
    endpoint: string,
    format: 'xlsx' | 'csv',
    filters?: Record<string, any>
): Promise<void> {
    const response = await api.get(`${endpoint}/export/`, {
        params: { format, ...filters },
        responseType: 'blob',
    })

    const url = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `export.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}
