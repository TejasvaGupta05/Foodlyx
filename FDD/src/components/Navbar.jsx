import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Radio, Menu, X, UserCircle, Users } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setOpen(false); };

  const dashboardLink = () => {
    if (!user) return '/login';
    const map = { donor: '/donor', ngo: '/ngo', animal_shelter: '/shelter', compost_unit: '/compost', admin: '/admin' };
    return map[user.role] || '/';
  };

  const ROLE_COLORS = {
    donor:          { bg: '#DCFCE7', text: '#16A34A' },
    ngo:            { bg: '#DBEAFE', text: '#2563EB' },
    animal_shelter: { bg: '#FEF3C7', text: '#D97706' },
    compost_unit:   { bg: '#ECFDF5', text: '#059669' },
    admin:          { bg: '#F3E8FF', text: '#9333EA' },
  };
  const roleColor = ROLE_COLORS[user?.role] || { bg: '#F1F5F9', text: '#64748B' };

  const navLinkCls = "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-green-600";
  const navLinkStyle = { color: '#475569' };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #F1F5F9',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl overflow-hidden transition-all group-hover:scale-105"
            style={{ border: '1.5px solid #DCFCE7', boxShadow: '0 2px 8px rgba(34,197,94,0.15)' }}
          >
            <img src="/logo.jpeg" alt="Foodlyx" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-lg tracking-wide hidden sm:block" style={{ color: '#16A34A' }}>
            FOODLYX
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <Link to="/community" className={navLinkCls} style={navLinkStyle}>
            <Users className="w-4 h-4" /> Community
          </Link>
          <Link to="/feed" className={navLinkCls} style={navLinkStyle}>
            <Radio className="w-4 h-4" /> Live Feed
          </Link>

          {user ? (
            <>
              <Link to={dashboardLink()} className={navLinkCls} style={navLinkStyle}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/profile" className={navLinkCls} style={navLinkStyle}>
                <UserCircle className="w-4 h-4" /> Profile
              </Link>

              {/* User pill */}
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: roleColor.bg, color: roleColor.text }}
              >
                {user.name?.split(' ')[0] || user.email?.split('@')[0]} · {(user.role || '').replace('_', ' ')}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: '#EF4444' }}
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLinkCls} style={navLinkStyle}>Login</Link>
              <Link
                to="/signup"
                className="text-sm px-5 py-2 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: '#475569' }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-5 pb-5 pt-2 flex flex-col gap-4"
          style={{ borderTop: '1px solid #F1F5F9', background: 'rgba(255,255,255,0.98)' }}
        >
          <Link to="/community" className="text-sm font-medium" style={{ color: '#475569' }} onClick={() => setOpen(false)}>🤝 Community</Link>
          <Link to="/feed" className="text-sm font-medium" style={{ color: '#475569' }} onClick={() => setOpen(false)}>📡 Live Feed</Link>

          {user ? (
            <>
              <Link to={dashboardLink()} className="text-sm font-medium" style={{ color: '#475569' }} onClick={() => setOpen(false)}>📊 Dashboard</Link>
              <Link to="/profile" className="text-sm font-medium" style={{ color: '#475569' }} onClick={() => setOpen(false)}>👤 My Profile</Link>
              <div className="h-px" style={{ background: '#F1F5F9' }} />
              <span className="text-xs font-bold px-3 py-1.5 rounded-full w-fit" style={{ background: roleColor.bg, color: roleColor.text }}>
                {user.name?.split(' ')[0] || user.email?.split('@')[0]} · {(user.role || '').replace('_', ' ')}
              </span>
              <button onClick={handleLogout} className="text-sm font-semibold text-left" style={{ color: '#EF4444' }}>🚪 Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium" style={{ color: '#475569' }} onClick={() => setOpen(false)}>Login</Link>
              <Link
                to="/signup"
                className="text-sm font-semibold text-white rounded-xl px-4 py-2.5 text-center"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
                onClick={() => setOpen(false)}
              >
                Join Now 🌱
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
