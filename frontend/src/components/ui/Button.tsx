import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-foreground hover:opacity-90 shadow-soft focus-visible:ring-accent',
  secondary:
    'bg-surface-muted text-ink hover:bg-line/60 border border-line focus-visible:ring-accent',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:ring-accent',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
