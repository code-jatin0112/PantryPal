import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Utensils, LayoutDashboard, Sparkles, LogOut } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'

// Placeholder Pages
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-sage mb-4">Smart Dashboard</h1>
    <p>Welcome to PantryPal. Here is an overview of your kitchen.</p>
  </div>
)

const Pantry = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-sage mb-4">Pantry Inventory</h1>
    <p>Manage your ingredients and track expiration dates.</p>
  </div>
)

const Assistant = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-sage mb-4">AI Kitchen Assistant</h1>
    <p>Ask me what to cook based on what you already have!</p>
  </div>
)

const AppLayout = () => {
  const { logout, user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-olive/20 p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-sage/20 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Utensils className="text-bark" size={28} />
            <h2 className="text-2xl font-bold text-bark">PantryPal</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-olive/40 transition-colors text-bark font-medium">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link to="/pantry" className="flex items-center gap-3 p-3 rounded-xl hover:bg-olive/40 transition-colors text-bark font-medium">
              <Utensils size={20} /> My Pantry
            </Link>
            <Link to="/assistant" className="flex items-center gap-3 p-3 rounded-xl hover:bg-olive/40 transition-colors text-bark font-medium">
              <Sparkles size={20} /> AI Assistant
            </Link>
          </div>
        </div>

        <div className="border-t border-sage/30 pt-4 mt-auto">
          <p className="text-sm text-sage mb-3 px-2 font-medium">Logged in as {user?.name}</p>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors font-medium text-left"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 bg-parchment">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/assistant" element={<Assistant />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
