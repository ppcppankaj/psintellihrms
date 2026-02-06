/**
 * BranchSelector - Header component for switching between branches
 * 
 * Displays current branch and allows users with multi-branch access
 * to switch between branches. Automatically invalidates React Query
 * cache on branch switch.
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    BuildingOfficeIcon, 
    ChevronDownIcon, 
    CheckIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline'
import { useBranchStore, useBranchCacheInvalidation, Branch } from '@/store/branchStore'
import { useAuthStore } from '@/store/authStore'
import { branchService } from '@/services/branchService'
import { setApiBranch } from '@/services/api'
import toast from 'react-hot-toast'

export default function BranchSelector() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()
    
    const { user } = useAuthStore()
    const { 
        branches, 
        currentBranch, 
        isMultiBranch,
        organization,
        initializeBranchContext,
        setCurrentBranch,
        setLoading,
    } = useBranchStore()
    
    const { invalidateAllBranchData } = useBranchCacheInvalidation()

    // Fetch user's branches on mount
    const { data: branchData, isLoading, error } = useQuery({
        queryKey: ['my-branches'],
        queryFn: branchService.getMyBranches,
        enabled: !!user && !user.is_superuser, // Superusers don't have branch context
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    })

    // Initialize branch store when data loads
    useEffect(() => {
        if (branchData) {
            initializeBranchContext(branchData)
            // Set initial branch in API layer
            if (branchData.current_branch) {
                setApiBranch(branchData.current_branch.id)
            }
        }
    }, [branchData, initializeBranchContext])

    // Switch branch mutation
    const switchBranchMutation = useMutation({
        mutationFn: (branchId: string) => branchService.switchBranch(branchId),
        onMutate: () => {
            setLoading(true)
        },
        onSuccess: (data, branchId) => {
            // Update local state
            const newBranch = branches.find(b => b.id === branchId)
            if (newBranch) {
                setCurrentBranch(newBranch)
                setApiBranch(newBranch.id)
            }
            
            // Invalidate all branch-dependent queries
            invalidateAllBranchData()
            
            toast.success(`Switched to ${data.branch.name}`)
            setIsOpen(false)
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Failed to switch branch')
        },
        onSettled: () => {
            setLoading(false)
        },
    })

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Don't render for superusers or users without branch access
    if (user?.is_superuser || error || (!isLoading && branches.length === 0)) {
        return null
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-surface-500 dark:text-surface-400">
                <BuildingOfficeIcon className="w-5 h-5 animate-pulse" />
                <span className="animate-pulse">Loading...</span>
            </div>
        )
    }

    // Single branch - display only, no dropdown
    if (!isMultiBranch && currentBranch) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <BuildingOfficeIcon className="w-5 h-5 text-primary-500" />
                <div className="flex flex-col">
                    <span className="font-medium">{currentBranch.name}</span>
                    {currentBranch.location && (
                        <span className="text-xs text-surface-500 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            {currentBranch.location}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    // Multi-branch selector
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={switchBranchMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
            >
                <BuildingOfficeIcon className="w-5 h-5 text-primary-500" />
                <div className="flex flex-col items-start">
                    <span className="font-medium">
                        {currentBranch?.name || 'Select Branch'}
                    </span>
                    {organization && (
                        <span className="text-xs text-surface-500">
                            {organization.name}
                        </span>
                    )}
                </div>
                <ChevronDownIcon 
                    className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 z-50 overflow-hidden"
                    >
                        <div className="p-2 border-b border-surface-200 dark:border-surface-700">
                            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase px-2">
                                Switch Branch
                            </p>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto py-1">
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => {
                                        if (branch.id !== currentBranch?.id) {
                                            switchBranchMutation.mutate(branch.id)
                                        } else {
                                            setIsOpen(false)
                                        }
                                    }}
                                    disabled={switchBranchMutation.isPending}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 ${
                                        branch.id === currentBranch?.id 
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                                            : 'text-surface-700 dark:text-surface-300'
                                    }`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{branch.name}</span>
                                        <span className="text-xs text-surface-500 flex items-center gap-1">
                                            {branch.code && <span>{branch.code}</span>}
                                            {branch.location && (
                                                <>
                                                    {branch.code && <span>•</span>}
                                                    <MapPinIcon className="w-3 h-3" />
                                                    {branch.location}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    {branch.id === currentBranch?.id && (
                                        <CheckIcon className="w-5 h-5 text-primary-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {branches.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-surface-500">
                                No branches available
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
