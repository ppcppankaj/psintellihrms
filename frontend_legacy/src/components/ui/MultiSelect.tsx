import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Option {
    value: string
    label: string
    subtext?: string
}

interface MultiSelectProps {
    options: Option[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    label?: string
    className?: string
    disabled?: boolean
    required?: boolean
}

export default function MultiSelect({
    options,
    value = [], // Default to empty array
    onChange,
    placeholder = 'Select...',
    label,
    className = '',
    disabled = false,
    required = false
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Find selected options objects
    const selectedOptions = useMemo(() =>
        options.filter(opt => value.includes(opt.value)),
        [options, value]
    )

    // Filter options based on search and exclude already selected
    const filteredOptions = useMemo(() => {
        const availableOptions = options.filter(opt => !value.includes(opt.value))

        if (!search) return availableOptions

        const lowerSearch = search.toLowerCase()
        return availableOptions.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch) ||
            (opt.subtext && opt.subtext.toLowerCase().includes(lowerSearch))
        )
    }, [options, value, search])

    const handleSelect = (optionValue: string) => {
        onChange([...value, optionValue])
        setSearch('')
        // Keep open for multiple selection
        inputRef.current?.focus()
    }

    const handleRemove = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation()
        onChange(value.filter(v => v !== optionValue))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !search && value.length > 0) {
            // Remove last selected item if search is empty
            onChange(value.slice(0, -1))
        }
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                className={`
                    relative w-full cursor-pointer bg-white dark:bg-surface-800 
                    border border-surface-300 dark:border-surface-600 rounded-lg 
                    focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-50 dark:bg-surface-900' : ''}
                `}
                onClick={() => !disabled && setIsOpen(true)}
            >
                <div className="flex flex-wrap items-center min-h-[42px] px-2 py-1 gap-1">
                    {/* Selected Tags */}
                    {selectedOptions.map(option => (
                        <span
                            key={option.value}
                            className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                        >
                            {option.label}
                            <XMarkIcon
                                className="w-3 h-3 ml-1 cursor-pointer hover:text-primary-900 dark:hover:text-primary-100"
                                onClick={(e) => handleRemove(e, option.value)}
                            />
                        </span>
                    ))}

                    {/* Search Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none p-1 text-sm focus:ring-0 text-surface-900 dark:text-white placeholder-surface-400 min-w-[80px]"
                        placeholder={selectedOptions.length === 0 ? placeholder : ''}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex items-center ml-auto">
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                    </div>
                </div>

                {/* Dropdown Menu */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full left-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            <ul className="py-1">
                                {filteredOptions.map((option) => (
                                    <li
                                        key={option.value}
                                        className="px-3 py-2 text-sm cursor-pointer select-none hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-900 dark:hover:text-primary-200 text-surface-900 dark:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleSelect(option.value)
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span>{option.label}</span>
                                            {option.subtext && (
                                                <span className="text-xs text-surface-500 mt-0.5">{option.subtext}</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-3 py-4 text-sm text-center text-surface-500">
                                No more options
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
