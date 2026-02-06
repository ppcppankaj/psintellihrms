import React from 'react';

export interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
    required?: boolean;
    placeholder?: string;
    options?: { label: string; value: any }[];
    readOnly?: boolean;
    validation?: (value: any) => string | undefined;
}

interface DynamicFormProps {
    fields: FormFieldConfig[];
    initialValues?: Record<string, any>;
    onSubmit: (values: Record<string, any>) => void;
    isLoading?: boolean;
    submitLabel?: string;
    title?: string;
    onCancel?: () => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    fields,
    initialValues,
    onSubmit,
    isLoading,
    submitLabel = 'Submit',
    title,
    onCancel
}) => {
    const [values, setValues] = React.useState<Record<string, any>>(initialValues || {});
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        setValues(initialValues || {});
    }, [initialValues]);

    const handleChange = (name: string, value: any) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        // Clear error when field changes
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation
        const newErrors: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.required && !values[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
            }
            if (field.validation) {
                const error = field.validation(values[field.name]);
                if (error) newErrors[field.name] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {title && <h3 className="text-xl font-bold text-slate-800 mb-6">{title}</h3>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field) => (
                    <div key={field.name} className={`${field.type === 'checkbox' ? 'flex items-center space-x-3' : 'space-y-2'}`}>
                        {field.type !== 'checkbox' && (
                            <label className="block text-sm font-medium text-slate-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                        )}

                        {field.type === 'select' ? (
                            <select
                                className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-slate-900 ${errors[field.name] ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'
                                    } bg-white`}
                                value={values[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                disabled={field.readOnly || isLoading}
                            >
                                <option value="">Select {field.label}</option>
                                {field.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : field.type === 'checkbox' ? (
                            <>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                    checked={!!values[field.name]}
                                    onChange={(e) => handleChange(field.name, e.target.checked)}
                                    disabled={field.readOnly || isLoading}
                                />
                                <label className="text-sm font-medium text-slate-700">{field.label}</label>
                            </>
                        ) : field.type === 'textarea' ? (
                            <textarea
                                className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-slate-900 ${errors[field.name] ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'
                                    } ${field.readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                                placeholder={field.placeholder}
                                value={values[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                readOnly={field.readOnly}
                                disabled={isLoading}
                                rows={4}
                            />
                        ) : (
                            <input
                                type={field.type}
                                className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-slate-900 ${errors[field.name] ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'
                                    } ${field.readOnly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                                placeholder={field.placeholder}
                                value={values[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                readOnly={field.readOnly}
                                disabled={isLoading}
                            />
                        )}

                        {errors[field.name] && (
                            <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className={`pt-4 flex ${onCancel ? 'justify-between' : 'justify-end'} items-center`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed text-transparent' : ''
                        } relative`}
                >
                    {submitLabel}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </button>
            </div>
        </form>
    );
};
