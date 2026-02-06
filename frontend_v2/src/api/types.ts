export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    results?: T[]; // Some DRF endpoints return 'results' instead of 'data'
    pagination: {
        count: number;
        total_pages: number;
        current_page: number;
        page_size: number;
        next: string | null;
        previous: string | null;
    };
}

