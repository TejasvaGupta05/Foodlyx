import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Utensils, Heart, BarChart3, Radio, Shield, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import plate1 from '../assets/graphics/Food_Plate_Graphic.png';
import plate2 from '../assets/graphics/Food_Plate_Graphic2.png';
import plate3 from '../assets/graphics/Food_Plate_Graphic3.png';
import plate4 from '../assets/graphics/Food_Plate_Graphic4.png';
import plate5 from '../assets/graphics/Food_Plate_Graphic5.png';

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

const carouselImageFiles = [
  'WhatsApp Image 2026-04-03 at 10.56.08 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.10 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.11 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.12 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.21 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.22 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.23 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.24 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.58.13 PM.jpeg',
];

const carouselImages = carouselImageFiles.map((file) => new URL(`../assets/image/${file}`, import.meta.url).href);

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
  const [selectedDonation, setSelectedDonation] = useState(100);
  const [customDonation, setCustomDonation] = useState('');

  return (
    <div className="hero-bg min-h-screen pt-20 pb-16">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left Content */}
        <div className="w-full md:w-[55%] text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/20 text-green-400 text-s font-medium mb-8">
            <Radio className="w-5 h-5 animate-pulse" /> Live food redistribution network
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-6xl font-black leading-tight mb-6">
            <span className="gradient-text">Zero Waste,</span>
            <br />
            <span className="text-white">Maximum Impact</span>
          </h1>
          <p className="text-lg text-green-300/60 max-w-xl mb-10 leading-relaxed">
            FOODLYX connects food donors with NGOs, animal shelters, and compost units — using smart AI classification to route every meal to where it matters most.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              to="/signup"
              className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-all glow pulse-green w-full sm:w-auto"
            >
              Start Donating <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/feed"
              className="flex items-center justify-center gap-2 px-8 py-3.5 glass hover:border-green-500/40 text-green-300 rounded-xl font-medium transition-all w-full sm:w-auto"
            >
              <Radio className="w-4 h-4" /> Live Feed
            </Link>
          </div>
        </div>

        {/* Right Graphics (Pentagon Layout) */}
        <div className="w-full md:w-[45%] relative h-[450px] md:h-[600px] flex items-center justify-center">
          {/* Top Peak */}
          <div className="absolute top-[5%] md:top-[10%] left-[35%] md:left-[40%] w-20 h-20 md:w-28 md:h-28 animate-float-1 z-10">
            <img src={plate1} alt="Food Plate" className="w-full h-full object-contain filter drop-shadow-[0_15px_15px_rgba(22,163,74,0.2)]" />
          </div>
          {/* Top Right */}
          <div className="absolute top-[29%] right-[10%] md:right-[20%] w-28 h-28 md:w-36 md:h-36 animate-float-3 z-10">
            <img src={plate4} alt="Food Plate" className="w-full h-full object-contain filter drop-shadow-[0_20px_20px_rgba(22,163,74,0.3)]" />
          </div>
          {/* Bottom Right */}
          <div className="absolute bottom-[20%] right-[10%] md:right-[15%] w-28 h-28 md:w-36 md:h-36 animate-float-2 z-10">
            <img src={plate3} alt="Food Plate" className="w-full h-full object-contain filter drop-shadow-[0_15px_15px_rgba(22,163,74,0.2)]" />
          </div>
          {/* Bottom Left (Big) */}
          <div className="absolute bottom-[10%] left-[5%] md:left-[10%] w-44 h-44 md:w-64 md:h-64 animate-float-1 z-20">
            <img src={plate2} alt="Food Plate" className="w-full h-full object-contain filter drop-shadow-[0_25px_30px_rgba(22,163,74,0.4)]" />
          </div>
          {/* Top Left */}
          <div className="absolute top-[20%] left-[5%] md:left-[10%] w-24 h-24 md:w-32 md:h-32 animate-float-3 z-10">
            <img src={plate5} alt="Food Plate" className="w-full h-full object-contain filter drop-shadow-[0_15px_15px_rgba(22,163,74,0.3)]" />
          </div>
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

      {/* Visual carousel below How it works */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold text-center text-white mb-2">Discover Our Impact</h3>
        <p className="text-center text-green-400/60 mb-6">Real moments from the Foodlyx network — scrolling for visibility and engagement.</p>

        <div className="carousel-container glass overflow-hidden border border-green-500/20 p-4">
          <div className="carousel-track flex gap-4 py-2">
            {[...carouselImages, ...carouselImages].map((src, idx) => (
              <div key={`${src}-${idx}`} className="min-w-[360px] max-w-[380px] flex-shrink-0 rounded-xl overflow-hidden border border-green-500/20 bg-black/30">
                <img
                  src={src}
                  alt={`Foodlyx photo ${idx + 1}`}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Beyond Surplus - Charity Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="glass grid lg:grid-cols-[0.95fr_1.05fr] gap-8 p-8 border border-green-500/20 bg-[#07110d]/80 shadow-[0_25px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col justify-center gap-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-green-200 shadow-[0_0_0_rgba(0,0,0,0)] transition-all duration-300 hover:bg-white/15 hover:shadow-[0_0_30px_rgba(74,222,128,0.16)] hover:brightness-105 backdrop-blur-md">
                <Leaf className="w-4 h-4 text-green-300" />
                SUPPORT BEYOND SURPLUS
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl sm:text-[4.5rem] font-black tracking-tight leading-tight text-white">
                  Support Beyond <span className="text-green-400">Surplus</span>
                </h2>
                <p className="text-green-300/70 text-lg leading-relaxed">
                  Not everyone has surplus food to donate — but everyone can still make a difference.
                </p>
                <p className="text-green-300/70 text-lg leading-relaxed">
                  If you wish to contribute out of goodwill, you can support Foodlyx through voluntary donations. Your contribution helps us manage food collection, transportation, storage, and distribution to those in need.
                </p>
              </div>

              <p className="text-green-400/70 mb-3">👉 Choose an amount or enter your own — donate as you wish.</p>
              <Link
                to="/charity"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 px-8 py-4 text-base font-semibold text-black shadow-[0_15px_40px_rgba(74,222,128,0.18)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(74,222,128,0.28)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Heart className="w-4 h-4 text-white" /> Donate Now
                </span>
              </Link>
              <p className="text-xs text-green-400/60 mt-6 inline-flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-500/10 text-green-300">✓</span>
                100% of your contribution goes towards helping deliver food to those who need it most.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-green-500/20 bg-black/25 p-6 shadow-[0_25px_65px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(52,211,153,0.12),transparent_18%)] pointer-events-none" />
            <div className="relative glass h-full rounded-[28px] border border-green-500/20 p-6">
              <div className="flex flex-col gap-4 border-b border-green-500/10 pb-5 mb-5">
                <div className="inline-flex items-center gap-3 rounded-3xl bg-green-500/10 px-4 py-2 text-sm text-green-200">
                  <Heart className="w-5 h-5 text-green-300" />
                  Helping hands
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Choose Your Contribution</h3>
                  <p className="text-green-400/60 text-sm mt-1">Every contribution fuels a better tomorrow.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: '₹100', value: 100 },
                  { label: '₹1000', value: 1000 },
                  { label: 'Custom', value: 'custom' },
                ].map((option) => {
                  const active = selectedDonation === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        setSelectedDonation(option.value);
                        if (option.value !== 'custom') setCustomDonation('');
                      }}
                      className={`donation-card rounded-3xl border-2 p-5 text-left transition-all duration-300 ${active ? 'border-green-400 bg-green-500/15 text-white shadow-donation selected' : 'border-green-500/20 bg-black/20 text-green-200 hover:border-green-400/60 hover:shadow-donationHover'}`}
                    >
                      <span className="block text-lg font-bold mb-2">{option.label}</span>
                      <span className="text-xs text-green-300/60">{option.value === 'custom' ? 'Enter any amount' : 'Instant support'}</span>
                    </button>
                  );
                })}
              </div>

<div className="rounded-[28px] border border-green-500/20 bg-black/10 p-5 mb-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-green-300/60">Selected Donation</p>
                      <p className="text-4xl font-black text-white">{selectedDonation === 'custom' ? (customDonation ? `₹${customDonation}` : '₹0') : `₹${selectedDonation}`}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-black/30 px-4 py-2 text-sm text-green-200">
                      Secure
                    </div>
                  </div>
                  <div className="rounded-full bg-white/5 h-3 overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-lime-400" style={{ width: '68%' }} />
                  </div>
                  <p className="text-xs text-green-400/60">₹68,000 raised this month towards feeding & supporting communities.</p>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-green-500/20 bg-black/15 p-4 mb-6">
                <div className={`transition-all duration-500 ${selectedDonation === 'custom' ? 'max-h-[140px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  <div className="flex flex-col gap-3">
                    <label className="text-xs uppercase tracking-[0.25em] text-green-400/60">Custom amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={customDonation}
                        onChange={(e) => {
                          setCustomDonation(e.target.value);
                          if (selectedDonation !== 'custom') setSelectedDonation('custom');
                        }}
                        placeholder="₹250"
                        className="w-full rounded-3xl border border-green-500/20 bg-black/20 px-4 py-4 text-2xl font-black text-white outline-none focus:border-green-400/70 focus:ring-2 focus:ring-green-500/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-300/60">INR</span>
                    </div>
                  </div>
                </div>
                {selectedDonation !== 'custom' && (
                  <div className="absolute inset-0 flex items-center justify-center text-green-400/50 text-sm pointer-events-none">
                    Select Custom to enter a donation amount.
                  </div>
                )}
              </div>

              <Link
                to="/charity"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 px-6 py-4 text-base font-bold text-black shadow-[0_18px_40px_rgba(74,222,128,0.22)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(74,222,128,0.34)]"
              >
                Contribute Securely
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
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
