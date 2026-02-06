/**
 * ABAC Store - Zustand state management for ABAC
 */

import { create } from 'zustand'
import { abacService, AttributeType, Policy, UserPolicy, GroupPolicy } from '@/services/abacService'

// Normalize API list responses into arrays so UI consumers can safely iterate/filter
const normalizeList = (payload: any) => {
    if (!payload) return []
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.results)) return payload.results
    if (Array.isArray(payload.data)) return payload.data
    return []
}

interface AbacStore {
    // Attribute Types
    attributeTypes: AttributeType[]
    isLoadingAttributeTypes: boolean
    attributeTypesError: string | null
    fetchAttributeTypes: () => Promise<void>
    createAttributeType: (data: any) => Promise<void>
    updateAttributeType: (id: string, data: any) => Promise<void>
    deleteAttributeType: (id: string) => Promise<void>

    // Policies
    policies: Policy[]
    isLoadingPolicies: boolean
    policiesError: string | null
    fetchPolicies: () => Promise<void>
    createPolicy: (data: any) => Promise<void>
    updatePolicy: (id: string, data: any) => Promise<void>
    deletePolicy: (id: string) => Promise<void>
    selectedPolicy: Policy | null
    setSelectedPolicy: (policy: Policy | null) => void

    // User Policies
    userPolicies: UserPolicy[]
    isLoadingUserPolicies: boolean
    fetchUserPolicies: () => Promise<void>
    assignPolicyToUser: (userId: string, policyId: string) => Promise<void>
    removePolicyFromUser: (userPolicyId: string) => Promise<void>

    // Group Policies
    groupPolicies: GroupPolicy[]
    isLoadingGroupPolicies: boolean
    fetchGroupPolicies: () => Promise<void>
    assignPolicyToGroup: (groupId: string, policyId: string) => Promise<void>
    removePolicyFromGroup: (groupPolicyId: string) => Promise<void>

    // Access Check
    isCheckingAccess: boolean
    checkUserAccess: (userId: string, action: string, resource: string) => Promise<any>
}

export const useAbacStore = create<AbacStore>((set, get) => ({
    // Attribute Types
    attributeTypes: [],
    isLoadingAttributeTypes: false,
    attributeTypesError: null,
    fetchAttributeTypes: async () => {
        set({ isLoadingAttributeTypes: true, attributeTypesError: null })
        try {
            const data = await abacService.attributeTypes.list()
            set({ attributeTypes: normalizeList(data) })
        } catch (error: any) {
            set({ attributeTypesError: error.message })
        } finally {
            set({ isLoadingAttributeTypes: false })
        }
    },
    createAttributeType: async (data: any) => {
        try {
            await abacService.attributeTypes.create(data)
            await get().fetchAttributeTypes()
        } catch (error: any) {
            set({ attributeTypesError: error.message })
            throw error
        }
    },
    updateAttributeType: async (id: string, data: any) => {
        try {
            await abacService.attributeTypes.update(id, data)
            await get().fetchAttributeTypes()
        } catch (error: any) {
            set({ attributeTypesError: error.message })
            throw error
        }
    },
    deleteAttributeType: async (id: string) => {
        try {
            await abacService.attributeTypes.delete(id)
            await get().fetchAttributeTypes()
        } catch (error: any) {
            set({ attributeTypesError: error.message })
            throw error
        }
    },

    // Policies
    policies: [],
    isLoadingPolicies: false,
    policiesError: null,
    selectedPolicy: null,
    setSelectedPolicy: (policy: Policy | null) => set({ selectedPolicy: policy }),
    fetchPolicies: async () => {
        set({ isLoadingPolicies: true, policiesError: null })
        try {
            const data = await abacService.policies.list()
            set({ policies: normalizeList(data) })
        } catch (error: any) {
            set({ policiesError: error.message })
        } finally {
            set({ isLoadingPolicies: false })
        }
    },
    createPolicy: async (data: any) => {
        try {
            await abacService.policies.create(data)
            await get().fetchPolicies()
        } catch (error: any) {
            set({ policiesError: error.message })
            throw error
        }
    },
    updatePolicy: async (id: string, data: any) => {
        try {
            await abacService.policies.update(id, data)
            await get().fetchPolicies()
        } catch (error: any) {
            set({ policiesError: error.message })
            throw error
        }
    },
    deletePolicy: async (id: string) => {
        try {
            await abacService.policies.delete(id)
            await get().fetchPolicies()
        } catch (error: any) {
            set({ policiesError: error.message })
            throw error
        }
    },

    // User Policies
    userPolicies: [],
    isLoadingUserPolicies: false,
    fetchUserPolicies: async () => {
        set({ isLoadingUserPolicies: true })
        try {
            const data = await abacService.userPolicies.list()
            set({ userPolicies: normalizeList(data) })
        } catch (error: any) {
            console.error('Error fetching user policies:', error)
        } finally {
            set({ isLoadingUserPolicies: false })
        }
    },
    assignPolicyToUser: async (userId: string, policyId: string) => {
        try {
            await abacService.userPolicies.create({ user_id: userId, policy_id: policyId })
            await get().fetchUserPolicies()
        } catch (error) {
            throw error
        }
    },
    removePolicyFromUser: async (userPolicyId: string) => {
        try {
            await abacService.userPolicies.delete(userPolicyId)
            await get().fetchUserPolicies()
        } catch (error) {
            throw error
        }
    },

    // Group Policies
    groupPolicies: [],
    isLoadingGroupPolicies: false,
    fetchGroupPolicies: async () => {
        set({ isLoadingGroupPolicies: true })
        try {
            const data = await abacService.groupPolicies.list()
            set({ groupPolicies: normalizeList(data) })
        } catch (error: any) {
            console.error('Error fetching group policies:', error)
        } finally {
            set({ isLoadingGroupPolicies: false })
        }
    },
    assignPolicyToGroup: async (groupId: string, policyId: string) => {
        try {
            await abacService.groupPolicies.create({ group_id: groupId, policy_id: policyId })
            await get().fetchGroupPolicies()
        } catch (error) {
            throw error
        }
    },
    removePolicyFromGroup: async (groupPolicyId: string) => {
        try {
            await abacService.groupPolicies.delete(groupPolicyId)
            await get().fetchGroupPolicies()
        } catch (error) {
            throw error
        }
    },

    // Access Check
    isCheckingAccess: false,
    checkUserAccess: async (userId: string, action: string, resource: string) => {
        set({ isCheckingAccess: true })
        try {
            const result = await abacService.checkAccess(userId, action, resource)
            return result
        } catch (error) {
            throw error
        } finally {
            set({ isCheckingAccess: false })
        }
    },
}))
