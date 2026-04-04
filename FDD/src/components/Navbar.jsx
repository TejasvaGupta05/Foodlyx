import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Radio, Menu, X, Moon, Sun, UserCircle } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'donor') return '/donor';
    if (user.role === 'ngo') return '/ngo';
    if (user.role === 'animal_shelter') return '/shelter';
    if (user.role === 'compost_unit') return '/compost';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111916]/70 border-b border-[#E5E7EB] dark:border-green-900/30 shadow-sm backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#16a34a]/10 dark:bg-green-500/20 border border-[#16a34a]/20 dark:border-green-500/30 overflow-hidden group-hover:bg-[#16a34a]/20 transition-colors">
            <img src="/logo.jpeg" alt="Foodlyx logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-[#16a34a] dark:gradient-text hidden sm:block">FOODLYX</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/community" className="flex items-center gap-1.5 text-sm font-medium text-[#4b5563] hover:text-[#16a34a] dark:text-green-300/70 dark:hover:text-green-300 transition-colors">
            <Radio className="w-4 h-4" /> Community
          </Link>
          <Link to="/feed" className="flex items-center gap-1.5 text-sm font-medium text-[#4b5563] hover:text-[#16a34a] dark:text-green-300/70 dark:hover:text-green-300 transition-colors">
            <Radio className="w-4 h-4" /> Live Feed
          </Link>
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#e5e7eb] dark:border-green-500/30 bg-[#f9fafb] dark:bg-black/20 text-[#2563eb] hover:bg-[#e5e7eb] dark:text-green-300 dark:hover:bg-green-500/20 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#111827]" /> : <Sun className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              <Link
                to={dashboardLink()}
                className="flex items-center gap-1.5 text-sm font-medium text-[#4b5563] hover:text-[#16a34a] dark:text-green-300/70 dark:hover:text-green-300 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-[#4b5563] hover:text-[#16a34a] dark:text-green-300/70 dark:hover:text-green-300 transition-colors"
              >
                <UserCircle className="w-4 h-4" /> Profile
              </Link>
              <div className="text-xs font-semibold text-[#16a34a] dark:text-green-400/60 px-2 py-1 bg-[#16a34a]/10 dark:bg-green-500/10 rounded-full border border-[#16a34a]/20 dark:border-green-500/20">
                {user.name || user.email?.split('@')[0]} · {user.role?.replace('_', ' ')}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400/70 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[#4b5563] hover:text-[#16a34a] dark:text-green-300/70 dark:hover:text-green-300 transition-colors">Login</Link>
              <Link
                to="/signup"
                className="text-sm px-4 py-2 bg-[#16a34a] dark:bg-green-600 hover:bg-[#15803d] dark:hover:bg-green-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 font-medium"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-[#111827] dark:text-green-400" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {
        open && (
          <div className="md:hidden px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-[#e5e7eb] dark:border-green-900/30 bg-[#FFFFFF] dark:bg-transparent">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Link to="/community" className="text-sm font-medium text-[#4b5563] dark:text-green-300/70" onClick={() => setOpen(false)}>Community</Link>
                <Link to="/feed" className="text-sm font-medium text-[#4b5563] dark:text-green-300/70" onClick={() => setOpen(false)}>Live Feed</Link>
              </div>
              <button
                onClick={onToggleTheme}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-green-500/30 bg-[#f9fafb] dark:bg-black/20 text-[#2563eb] hover:bg-[#e5e7eb] dark:text-green-300 dark:hover:bg-green-500/20 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4 text-[#111827]" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
            {user ? (
              <>
                <Link to={dashboardLink()} className="text-sm font-medium text-[#4b5563] dark:text-green-300/70" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/profile" className="text-sm font-medium text-[#4b5563] dark:text-green-300/70" onClick={() => setOpen(false)}>My Profile</Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-600 dark:text-red-400/70 text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[#4b5563] dark:text-green-300/70" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/signup" className="text-sm font-medium text-white bg-[#16a34a] dark:bg-green-600 rounded-lg px-4 py-2 text-center shadow-md" onClick={() => setOpen(false)}>Join Now</Link>
              </>
            )}
          </div>
        )
      }
    </nav >
  );
}
