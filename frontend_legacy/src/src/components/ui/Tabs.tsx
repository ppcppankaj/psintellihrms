/**
 * Tabs Component - Reusable tabbed interface
 */

import { useState, ReactNode } from 'react'

interface Tab {
    id: string
    label: string
    icon?: ReactNode
    disabled?: boolean
}

interface TabsProps {
    tabs: Tab[]
    defaultTab?: string
    onChange?: (tabId: string) => void
    children: ReactNode
}

interface TabPanelProps {
    id: string
    children: ReactNode
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId)
        onChange?.(tabId)
    }

    return (
        <div className="w-full">
            {/* Tab Headers */}
            <div className="border-b border-surface-200 dark:border-surface-700">
                <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && handleTabClick(tab.id)}
                            disabled={tab.disabled}
                            className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px
                transition-colors whitespace-nowrap
                ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:hover:text-surface-300'
                                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Panels */}
            <div className="mt-4">
                {children}
            </div>
        </div>
    )
}

export function TabPanel({ id, children }: TabPanelProps & { activeTab?: string }) {
    return <div id={`tabpanel-${id}`}>{children}</div>
}

// Hook to use with Tabs
export function useTabPanel(activeTab: string, panelId: string) {
    return activeTab === panelId
}
