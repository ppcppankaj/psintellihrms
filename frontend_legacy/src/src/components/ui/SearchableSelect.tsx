import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Option {
    value: string
    label: string
    subtext?: string
}

interface SearchableSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    className?: string
    disabled?: boolean
    required?: boolean
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    className = '',
    disabled = false,
    required = false
}: SearchableSelectProps) {
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

    // Find selected option
    const selectedOption = useMemo(() =>
        options.find(opt => opt.value === value),
        [options, value])

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!search) return options
        const lowerSearch = search.toLowerCase()
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch) ||
            (opt.subtext && opt.subtext.toLowerCase().includes(lowerSearch))
        )
    }, [options, search])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
        setSearch('')
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        setSearch('')
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
                onClick={() => !disabled && setIsOpen(prev => !prev)}
            >
                <div className="flex items-center min-h-[42px] px-3 py-2">
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-surface-900 dark:text-white placeholder-surface-400"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    ) : (
                        <span className={`block truncate text-sm flex-1 ${!selectedOption ? 'text-surface-400' : 'text-surface-900 dark:text-white'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    )}

                    <div className="flex items-center ml-2 space-x-1">
                        {value && !disabled && !isOpen && (
                            <div
                                onClick={handleClear}
                                className="p-0.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </div>
                        )}
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                    </div>
                </div>

                {/* Dropdown Menu */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            <ul className="py-1">
                                {filteredOptions.map((option) => (
                                    <li
                                        key={option.value}
                                        className={`
                                            px-3 py-2 text-sm cursor-pointer select-none
                                            hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-900 dark:hover:text-primary-200
                                            ${value === option.value ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-200 font-medium' : 'text-surface-900 dark:text-white'}
                                        `}
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
                                No results found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
