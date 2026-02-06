/**
 * Document Service - API for company documents, policies, employee documents
 */
import api from './index';
import type { PaginatedResponse } from './types';

export interface DocumentCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    is_system?: boolean;
}

export interface Document {
    id: string;
    title: string;
    category: DocumentCategory | string;
    category_name?: string;
    file_url: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    description?: string;
    is_public: boolean;
    requires_acknowledgment: boolean;
    version: number;
    uploaded_by?: string;
    uploaded_by_name?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeDocument {
    id: string;
    employee: string;
    employee_name?: string;
    document_type: string;
    file_url: string;
    file_name?: string;
    expiry_date?: string;
    verified: boolean;
    verified_by?: string;
    notes?: string;
    created_at: string;
}

export interface DocumentAcknowledgment {
    id: string;
    document: string;
    document_title?: string;
    employee: string;
    employee_name?: string;
    acknowledged_at: string;
    ip_address?: string;
}

export const documentService = {
    // Company Documents
    getDocuments: async (params?: Record<string, unknown>) => {
        const response = await api.get<PaginatedResponse<Document>>('/documents/', { params });
        return response.data;
    },
    getDocument: async (id: string) => {
        const response = await api.get<Document>(`/documents/${id}/`);
        return response.data;
    },
    createDocument: async (data: FormData) => {
        const response = await api.post<Document>('/documents/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateDocument: async (id: string, data: Partial<Document> | FormData) => {
        const response = await api.put<Document>(`/documents/${id}/`, data);
        return response.data;
    },
    deleteDocument: async (id: string) => {
        await api.delete(`/documents/${id}/`);
    },

    // Categories
    getCategories: async () => {
        const response = await api.get<PaginatedResponse<DocumentCategory>>('/documents/categories/');
        return response.data;
    },
    createCategory: async (data: Partial<DocumentCategory>) => {
        const response = await api.post<DocumentCategory>('/documents/categories/', data);
        return response.data;
    },
    updateCategory: async (id: string, data: Partial<DocumentCategory>) => {
        const response = await api.put<DocumentCategory>(`/documents/categories/${id}/`, data);
        return response.data;
    },
    deleteCategory: async (id: string) => {
        await api.delete(`/documents/categories/${id}/`);
    },

    // Employee Documents
    getEmployeeDocuments: async (employeeId?: string) => {
        const params = employeeId ? { employee: employeeId } : {};
        const response = await api.get<PaginatedResponse<EmployeeDocument>>('/documents/employee/', { params });
        return response.data;
    },
    uploadEmployeeDocument: async (data: FormData) => {
        const response = await api.post<EmployeeDocument>('/documents/employee/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    verifyEmployeeDocument: async (id: string) => {
        const response = await api.post<EmployeeDocument>(`/documents/employee/${id}/verify/`);
        return response.data;
    },

    // Acknowledgments
    getAcknowledgments: async (documentId?: string) => {
        const params = documentId ? { document: documentId } : {};
        const response = await api.get<PaginatedResponse<DocumentAcknowledgment>>('/documents/acknowledgments/', { params });
        return response.data;
    },
    acknowledgeDocument: async (documentId: string) => {
        const response = await api.post<DocumentAcknowledgment>('/documents/acknowledge/', { document: documentId });
        return response.data;
    }
};
