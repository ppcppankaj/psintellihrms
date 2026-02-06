/**
 * Avatar Component - User avatars with initials fallback
 */

interface AvatarProps {
    src?: string | null
    name: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
    const colors = [
        'bg-primary-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
        'bg-orange-500',
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
}

export default function Avatar({
    src,
    name,
    size = 'md',
    className = '',
}: AvatarProps) {
    const initials = getInitials(name)
    const bgColor = getAvatarColor(name)

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`
          ${sizeStyles[size]}
          rounded-full object-cover ring-2 ring-white dark:ring-surface-800
          ${className}
        `}
            />
        )
    }

    return (
        <div
            className={`
        ${sizeStyles[size]}
        ${bgColor}
        rounded-full flex items-center justify-center
        text-white font-medium
        ring-2 ring-white dark:ring-surface-800
        ${className}
      `}
            title={name}
        >
            {initials}
        </div>
    )
}

// Avatar group for showing multiple users
export function AvatarGroup({
    users,
    max = 4,
    size = 'sm',
}: {
    users: { name: string; avatar?: string }[]
    max?: number
    size?: 'xs' | 'sm' | 'md'
}) {
    const visible = users.slice(0, max)
    const remaining = users.length - max

    return (
        <div className="flex -space-x-2">
            {visible.map((user, i) => (
                <Avatar key={i} name={user.name} src={user.avatar} size={size} />
            ))}
            {remaining > 0 && (
                <div
                    className={`
            ${sizeStyles[size]}
            bg-surface-200 dark:bg-surface-700
            rounded-full flex items-center justify-center
            text-surface-600 dark:text-surface-300 font-medium
            ring-2 ring-white dark:ring-surface-800
          `}
                >
                    +{remaining}
                </div>
            )}
        </div>
    )
}
