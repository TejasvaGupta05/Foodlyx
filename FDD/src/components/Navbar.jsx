import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogOut, LayoutDashboard, Radio, Menu, X, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'donor') return '/donor';
    if (user.role === 'ngo' || user.role === 'animal_shelter' || user.role === 'compost_unit') return '/ngo';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-green-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">FOODLYX</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/feed" className="flex items-center gap-1.5 text-sm text-green-300/70 hover:text-green-300 transition-colors">
            <Radio className="w-4 h-4" /> Live Feed
          </Link>
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-green-500/30 bg-black/20 text-green-300 hover:bg-green-500/20 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              <Link
                to={dashboardLink()}
                className="flex items-center gap-1.5 text-sm text-green-300/70 hover:text-green-300 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <div className="text-xs text-green-400/60 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                {user.name} · {user.role}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-red-400/70 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-green-300/70 hover:text-green-300 transition-colors">Login</Link>
              <Link
                to="/signup"
                className="text-sm px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all font-medium"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-green-400" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-green-900/30">
          <div className="flex items-center justify-between">
            <Link to="/feed" className="text-sm text-green-300/70" onClick={() => setOpen(false)}>Live Feed</Link>
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-green-500/30 bg-black/20 text-green-300 hover:bg-green-500/20 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          {user ? (
            <>
              <Link to={dashboardLink()} className="text-sm text-green-300/70" onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="text-sm text-red-400/70 text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-green-300/70" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/signup" className="text-sm text-white bg-green-600 rounded-lg px-4 py-2 text-center" onClick={() => setOpen(false)}>Join Now</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
