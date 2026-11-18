import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ListTodo, Columns3, Moon, Sun, CheckSquare2 } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/Button'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'All Tasks', icon: ListTodo },
  { to: '/board', label: 'Board', icon: Columns3 },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-surface-raised/80 px-4 py-5 backdrop-blur">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-soft">
          <CheckSquare2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-ink">TaskFlow</p>
          <p className="text-xs text-ink-subtle">Productivity workspace</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Hlavní navigace">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Button variant="secondary" className="w-full justify-start" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </Button>
    </aside>
  )
}
