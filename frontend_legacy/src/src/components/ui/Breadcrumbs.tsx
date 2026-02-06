/**
 * Breadcrumbs Component - Navigation breadcrumb trail
 */

import { Link, useLocation } from 'react-router-dom'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[]
    separator?: React.ReactNode
    className?: string
}

// Auto-generate breadcrumbs from URL path
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const paths = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }]

    let currentPath = ''
    paths.forEach((path, index) => {
        currentPath += `/${path}`
        const isLast = index === paths.length - 1
        const label = path
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

        items.push({
            label,
            href: isLast ? undefined : currentPath,
        })
    })

    return items
}

export default function Breadcrumbs({
    items,
    separator = <ChevronIcon />,
    className = ''
}: BreadcrumbsProps) {
    const location = useLocation()
    const breadcrumbItems = items || generateBreadcrumbs(location.pathname)

    if (breadcrumbItems.length <= 1) return null

    return (
        <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
                {breadcrumbItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                        {index > 0 && (
                            <span className="text-surface-400">{separator}</span>
                        )}
                        {item.href ? (
                            <Link
                                to={item.href}
                                className="text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-surface-900 dark:text-white font-medium">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}

function ChevronIcon() {
    return (
        <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
}
