import { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Utensils, LayoutDashboard, Sparkles, LogOut, Menu, X, BookOpen } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Pantry from './pages/Pantry'
import Assistant from './pages/Assistant'
import Dashboard from './pages/Dashboard'
import Recipes from './pages/Recipes'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/pantry',    icon: Utensils,        label: 'My Pantry'           },
  { to: '/recipes',   icon: BookOpen,        label: 'Recipes'             },
  { to: '/assistant', icon: Sparkles,        label: 'AI Assistant'        },
]

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 p-3 rounded-xl transition-all duration-150 font-medium text-sm
   ${isActive
     ? 'bg-bark text-white shadow-md'
     : 'text-bark hover:bg-olive/40'
   }`

const Sidebar = ({ onClose }) => {
  const { logout, user } = useAuth()

  return (
    <aside className="w-64 h-full bg-white border-r border-sage/20 flex flex-col justify-between p-6 flex-shrink-0">
      {/* Brand */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-sage to-bark rounded-xl flex items-center justify-center">
              <Utensils size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-bark">PantryPal</span>
          </div>
          {/* Close button — only shown on mobile overlay */}
          {onClose && (
            <button onClick={onClose} className="text-sage hover:text-bark md:hidden">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={onClose}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div className="border-t border-sage/20 pt-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-olive to-sage flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-bark truncate">{user?.name}</p>
            <p className="text-xs text-sage truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors font-medium text-sm"
        >
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Mobile Overlay Sidebar ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-[slideIn_0.2s_ease-out]">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-sage/20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-parchment transition-colors text-bark"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-sage to-bark rounded-lg flex items-center justify-center">
              <Utensils size={14} className="text-white" />
            </div>
            <span className="font-bold text-bark">PantryPal</span>
          </div>
        </header>

        <main className="flex-1 bg-parchment overflow-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/pantry"    element={<Pantry />} />
            <Route path="/recipes"   element={<Recipes />} />
            <Route path="/assistant" element={<Assistant />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
