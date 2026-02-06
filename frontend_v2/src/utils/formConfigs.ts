import type { FormFieldConfig } from '../components/DynamicForm';

export const organizationFormConfig: FormFieldConfig[] = [
    { name: 'name', label: 'Organization Name', type: 'text', required: true, placeholder: 'Acme Corp' },
    { name: 'email', label: 'Contact Email', type: 'email', required: true, placeholder: 'contact@acme.com' },
    { name: 'timezone', label: 'Timezone', type: 'text', placeholder: 'Asia/Kolkata' },
    { name: 'currency', label: 'Currency', type: 'text', placeholder: 'INR' },
    {
        name: 'subscription_status', label: 'Subscription Status', type: 'select', options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Trial', value: 'trial' },
        ]
    },
];

export const employeeFormConfig: FormFieldConfig[] = [
    { name: 'employee_id', label: 'Employee ID', type: 'text', required: true, placeholder: 'EMP001' },
    { name: 'date_of_joining', label: 'Joining Date', type: 'date', required: true },
    {
        name: 'status', label: 'Status', type: 'select', options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Terminated', value: 'terminated' },
        ]
    },
];
