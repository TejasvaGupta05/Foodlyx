import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Utensils, Heart, BarChart3, Radio, Shield, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const stats = [
  { label: 'Meals Saved', value: '48,200+', icon: Utensils },
  { label: 'Orgs Connected', value: '320+', icon: Heart },
  { label: 'Kg Diverted', value: '12,600+', icon: BarChart3 },
];

const roles = [
  {
    title: 'Food Donors',
    desc: 'Restaurants, hotels & events that post surplus food donations instantly.',
    icon: Utensils,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    link: '/signup',
  },
  {
    title: 'NGOs & Shelters',
    desc: 'Verified organizations that accept food for communities & animals.',
    icon: Heart,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    link: '/signup',
  },
  {
    title: 'Administrators',
    desc: 'Platform admins managing verifications, analytics & operations.',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    link: '/login',
  },
];

function Counter({ target }) {
  const [count, setCount] = useState(0);
  const numericTarget = parseInt(target.replace(/\D/g, ''), 10);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    let start = 0;
    const duration = 1800;
    const step = numericTarget / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numericTarget) { setCount(numericTarget); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [numericTarget]);

  return <>{count.toLocaleString()}{target.includes('+') ? '+' : ''}</>;
}

export default function Landing() {
  return (
    <div className="hero-bg min-h-screen pt-24 pb-16">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 text-center py-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/20 text-green-400 text-xs font-medium mb-8">
          <Radio className="w-3 h-3 animate-pulse" /> Live food redistribution network
        </div>
        <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6">
          <span className="gradient-text">Zero Waste,</span>
          <br />
          <span className="text-white">Maximum Impact</span>
        </h1>
        <p className="text-lg text-green-300/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          FOODLYX connects food donors with NGOs, animal shelters, and compost units — using smart AI classification to route every meal to where it matters most.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="group flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-all glow pulse-green"
          >
            Start Donating <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/feed"
            className="flex items-center gap-2 px-8 py-3.5 glass hover:border-green-500/40 text-green-300 rounded-xl font-medium transition-all"
          >
            <Radio className="w-4 h-4" /> Live Feed
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass text-center p-6 hover:border-green-500/30 transition-all">
              <Icon className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                <Counter target={value} />
              </div>
              <div className="text-xs text-green-400/60">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-4">How FOODLYX Works</h2>
        <p className="text-center text-green-400/60 mb-12">Smart routing in three simple steps</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Donor Posts Food', desc: 'Restaurant lists surplus food with type, quantity, and shelf life.', icon: Utensils },
            { step: '02', title: 'AI Classifies', desc: 'System auto-classifies as edible / semi-edible / non-edible and notifies the right orgs.', icon: Zap },
            { step: '03', title: 'NGO Accepts & Collects', desc: 'Verified organization accepts request and collects within the shelf life window.', icon: Heart },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="glass p-6 relative overflow-hidden group hover:border-green-500/30 transition-all">
              <div className="absolute top-3 right-4 text-5xl font-black text-green-500/5 group-hover:text-green-500/10 transition-colors select-none">{step}</div>
              <Icon className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-green-400/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role cards */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center text-white mb-10">Join as</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {roles.map(({ title, desc, icon: Icon, color, bg, link }) => (
            <Link
              key={title}
              to={link}
              className={`glass p-6 border ${bg} hover:scale-[1.02] transition-all group`}
            >
              <Icon className={`w-8 h-8 ${color} mb-4`} />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-green-400/60">{desc}</p>
              <div className={`mt-4 flex items-center gap-1 text-sm ${color} font-medium`}>
                Get Started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
