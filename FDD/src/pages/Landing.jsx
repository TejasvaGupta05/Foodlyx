import { Link } from 'react-router-dom';
import {
  ArrowRight, Utensils, Heart, Users, Shield,
  Leaf, CheckCircle, Zap, Radio, MapPin, Star
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Graphics ─────────────────────────────────────────────────────────────────
import plate1 from '../assets/graphics/Food_Plate_Graphic.png';
import plate2 from '../assets/graphics/Food_Plate_Graphic2.png';
import plate3 from '../assets/graphics/Food_Plate_Graphic3.png';
import plate4 from '../assets/graphics/Food_Plate_Graphic4.png';
import plate5 from '../assets/graphics/Food_Plate_Graphic5.png';

// ── Hero image ────────────────────────────────────────────────────────────────
import heroImg from '../assets/image/Hero-Section.jpg';

// ── Story images (largest = most detail) ─────────────────────────────────────
const storyImgs = [
  new URL('../assets/image/WhatsApp Image 2026-04-03 at 10.56.08 PM.jpeg', import.meta.url).href,
  new URL('../assets/image/WhatsApp Image 2026-04-03 at 10.56.24 PM.jpeg', import.meta.url).href,
  new URL('../assets/image/WhatsApp Image 2026-04-03 at 11.00.42 PM.jpeg', import.meta.url).href,
];

// ── Carousel images ───────────────────────────────────────────────────────────
const carouselFiles = [
  'WhatsApp Image 2026-04-03 at 10.56.08 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.10 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.11 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.12 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.21 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.22 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.23 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.56.24 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.58.13 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 10.59.42 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 11.00.42 PM.jpeg',
  'WhatsApp Image 2026-04-03 at 11.08.38 PM.jpeg',
];
const carouselImages = carouselFiles.map(
  (f) => new URL(`../assets/image/${f}`, import.meta.url).href
);

// ── Data ──────────────────────────────────────────────────────────────────────
const impactStats = [
  { value: '48200', suffix: '+', label: 'Meals Donated',    emoji: '🍽️'  },
  { value: '12600', suffix: '+', label: 'Kg Food Rescued',  emoji: '♻️'  },
  { value: '5800',  suffix: '+', label: 'Animals Fed',      emoji: '🐾'  },
  { value: '320',   suffix: '+', label: 'NGOs Active',      emoji: '🤝'  },
];

const steps = [
  {
    num: '01', icon: Utensils, color: '#22C55E', bg: '#DCFCE7',
    title: 'Donor Posts Food',
    desc: 'Restaurants, households and event organisers post surplus food with type, quantity, and preferred pickup time.',
  },
  {
    num: '02', icon: Zap, color: '#F59E0B', bg: '#FEF3C7',
    title: 'Smart Classification',
    desc: 'Foodlyx automatically classifies food as edible, semi-edible, animal-grade, or compost and notifies nearby organisations.',
  },
  {
    num: '03', icon: Heart, color: '#EF4444', bg: '#FEE2E2',
    title: 'NGO Picks Up & Delivers',
    desc: 'A verified organisation accepts, collects within the shelf-life window, and delivers to those who need it most.',
  },
];

const stories = [
  {
    tag: '👨‍👩‍👧 Community Impact',
    title: 'Feeding families, one meal at a time',
    desc: 'Surplus food from local restaurants now reaches 200 underprivileged families every single week — hot, fresh, and full of care.',
  },
  {
    tag: '🐾 Animal Welfare',
    title: 'Shelter animals never go hungry',
    desc: 'Food that once went to landfill now feeds 400+ animals across 12 shelters monthly. Semi-edible becomes life-saving.',
  },
  {
    tag: '🌱 Sustainability',
    title: 'Zero waste from campus kitchens',
    desc: 'A university now composts and donates 100% of kitchen surplus through Foodlyx — inspiring a campus-wide food movement.',
  },
];

const roles = [
  {
    title: 'Food Donors',
    desc:  'Restaurants, households and event managers posting surplus food in under 60 seconds.',
    icon:  Utensils, plate: plate1,
    iconColor: '#16A34A', iconBg: '#DCFCE7',
    borderTop: '#22C55E', link: '/signup',
  },
  {
    title: 'NGOs & Charities',
    desc:  'Verified organisations feeding communities and managing last-mile food distribution.',
    icon:  Heart, plate: plate2,
    iconColor: '#EF4444', iconBg: '#FEE2E2',
    borderTop: '#EF4444', link: '/signup',
  },
  {
    title: 'Animal Shelters',
    desc:  'Shelters receiving animal-grade food batches to keep their rescues healthy and fed.',
    icon:  Users, plate: plate3,
    iconColor: '#F59E0B', iconBg: '#FEF3C7',
    borderTop: '#F59E0B', link: '/signup',
  },
  {
    title: 'Compost Units',
    desc:  'Eco-processing partners turning non-edible food waste into compost and bio-fertiliser.',
    icon:  Leaf, plate: plate4,
    iconColor: '#16A34A', iconBg: '#DCFCE7',
    borderTop: '#22C55E', link: '/signup',
  },
];

const testimonials = [
  {
    name: 'Priya Sharma', role: 'NGO Coordinator, Delhi',
    quote: '"Foodlyx reduced our food sourcing effort by 70%. We now focus entirely on distribution instead of procurement."',
    rating: 5,
  },
  {
    name: 'Ravi Gupta', role: 'Restaurant Owner, Mumbai',
    quote: '"I used to feel guilty throwing away leftover biryani. Now it feeds 50 people every Sunday. Foodlyx made this effortless."',
    rating: 5,
  },
  {
    name: 'Sneha Pillai', role: 'Shelter Manager, Bangalore',
    quote: '"Our animals are better fed now than ever before. The platform is simple, fast, and the NGO team is remarkably responsive."',
    rating: 5,
  },
];

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const numericTarget = parseInt(target, 10);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    let start = 0;
    const duration = 2000;
    const step = numericTarget / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numericTarget) { setCount(numericTarget); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [numericTarget]);

  return <>{count.toLocaleString()}{suffix}</>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="warm-page min-h-screen" style={{ paddingTop: '64px' }}>

      {/* ════════════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════════════ */}
      <section
        style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #F0FDF4 60%, #ECFDF5 100%)' }}
        className="min-h-screen flex items-center overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 py-16 w-full grid md:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="space-y-8 slide-up">
            {/* Live pill */}
            <div className="warm-badge" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live food redistribution network
            </div>

            {/* Headline */}
            <div>
              <h1
                className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-5"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1C2B22' }}
              >
                Turn Surplus
                <br />
                <span style={{ color: '#22C55E' }}>Food</span> Into{' '}
                <span
                  style={{
                    fontStyle: 'italic',
                    background: 'linear-gradient(90deg,#F59E0B,#EF4444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Hope
                </span>
              </h1>
              <p className="text-lg leading-relaxed max-w-lg" style={{ color: '#64748B' }}>
                Help donate extra food to people, animals, and communities in need — before
                it goes to waste. Together, we build a hunger-free tomorrow.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="warm-btn-primary text-base">
                🍱 Donate Food <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/signup" className="warm-btn-secondary text-base">
                🙏 Request Help
              </Link>
              <Link
                to="/feed"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                style={{ color: '#16A34A', border: '1.5px solid #BBF7D0', background: 'transparent' }}
              >
                <Radio className="w-4 h-4" /> Live Feed
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-5">
              {['100% Verified NGOs', 'Real-time Tracking', 'Zero Platform Fees'].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22C55E' }} />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero image + floating plates */}
          <div className="relative flex items-center justify-center slide-up slide-up-2">
            {/* Main image */}
            <div
              className="relative rounded-3xl overflow-hidden w-full"
              style={{
                aspectRatio: '4/3',
                boxShadow: '0 32px 80px rgba(34,197,94,0.18), 0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <img src={heroImg} alt="Volunteers distributing food" className="w-full h-full object-cover" />
              {/* Bottom overlay info badge */}
              <div
                className="absolute bottom-0 left-0 right-0 p-5"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/20">
                    <img src={plate5} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">15+ nearby NGOs ready to collect</p>
                    <p className="text-xs" style={{ color: '#86EFAC' }}>Post your surplus → Pickup in under 2 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decorative plates */}
            <div className="absolute -top-8 -right-8 w-24 h-24 animate-float-1 z-10 drop-shadow-2xl hidden md:block">
              <img src={plate1} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-10 -left-8 w-28 h-28 animate-float-2 z-10 drop-shadow-2xl hidden md:block">
              <img src={plate3} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute top-1/3 -right-6 w-16 h-16 animate-float-3 z-10 drop-shadow-xl hidden lg:block">
              <img src={plate2} alt="" className="w-full h-full object-contain" />
            </div>

            {/* Impact badge top-left */}
            <div
              className="absolute -top-4 -left-4 px-4 py-3 rounded-2xl shadow-lg hidden md:flex items-center gap-2"
              style={{ background: '#FFFFFF', border: '1px solid #F1F5F9' }}
            >
              <span className="text-2xl font-black" style={{ color: '#22C55E' }}>48K+</span>
              <span className="text-xs leading-tight" style={{ color: '#64748B' }}>Meals<br/>donated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. IMPACT STATS
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF' }} className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="warm-badge mb-4" style={{ background: '#FEF3C7', color: '#D97706' }}>
              Our Impact So Far
            </span>
            <h2
              className="text-4xl font-bold mt-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}
            >
              Making a Measurable Difference
            </h2>
            <p className="mt-3 text-base max-w-md mx-auto" style={{ color: '#64748B' }}>
              Every number here is a life touched, a waste prevented, an act of kindness delivered.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map(({ value, suffix, label, emoji }, i) => (
              <div key={label} className={`stat-card slide-up slide-up-${i + 1}`}>
                <div className="text-5xl mb-4">{emoji}</div>
                <div className="text-3xl font-black mb-2" style={{ color: '#1C2B22' }}>
                  <Counter target={value} suffix={suffix} />
                </div>
                <div className="text-sm font-medium" style={{ color: '#64748B' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. HOW IT WORKS
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFF7ED' }} className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="warm-badge mb-4" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              Simple Process
            </span>
            <h2
              className="text-4xl font-bold mt-4 mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}
            >
              How Foodlyx Works
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748B' }}>
              From surplus plate to someone's plate — in three powerful steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="step-connector hidden md:block" />

            {steps.map(({ num, title, desc, icon: Icon, color, bg }, i) => (
              <div
                key={num}
                className={`warm-card p-8 relative group hover:-translate-y-2 transition-all duration-300 slide-up slide-up-${i + 1}`}
                style={{ overflow: 'hidden' }}
              >
                {/* Step number ghost */}
                <span
                  className="absolute top-4 right-5 text-6xl font-black select-none pointer-events-none"
                  style={{ color: '#F1F5F9', lineHeight: 1 }}
                >
                  {num}
                </span>

                {/* Icon circle */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto relative z-10"
                  style={{ background: bg }}
                >
                  <Icon className="w-8 h-8" style={{ color }} />
                </div>

                <h3 className="text-lg font-bold text-center mb-3" style={{ color: '#1C2B22' }}>{title}</h3>
                <p className="text-sm text-center leading-relaxed" style={{ color: '#64748B' }}>{desc}</p>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-[20px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. IMPACT STORIES
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF' }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="warm-badge mb-4" style={{ background: '#FEE2E2', color: '#EF4444' }}>
              ❤️ Real Stories
            </span>
            <h2
              className="text-4xl font-bold mt-4 mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}
            >
              Lives Changed, Every Day
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748B' }}>
              Behind every food donation is a story of compassion, trust, and real-world impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {stories.map(({ tag, title, desc }, i) => (
              <div
                key={tag}
                className={`warm-card overflow-hidden group hover:-translate-y-2 transition-all duration-300 slide-up slide-up-${i + 1}`}
              >
                {/* Image */}
                <div className="h-60 overflow-hidden relative">
                  <img
                    src={storyImgs[i]}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Tag pill over image */}
                  <div
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.95)', color: '#334155' }}
                  >
                    {tag}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-3" style={{ color: '#1C2B22' }}>{title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748B' }}>{desc}</p>
                  <div
                    className="flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: '#22C55E' }}
                  >
                    Read Story <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. WHO WE SERVE
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFF7ED' }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="warm-badge mb-4" style={{ background: '#FEF3C7', color: '#D97706' }}>
              🤝 Join Our Network
            </span>
            <h2
              className="text-4xl font-bold mt-4 mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}
            >
              Who Can Join Foodlyx?
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748B' }}>
              Whether you have surplus food to give, or communities in urgent need — Foodlyx connects you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.map(({ title, desc, icon: Icon, plate, iconColor, iconBg, borderTop, link }, i) => (
              <Link
                key={title}
                to={link}
                className={`warm-card role-card p-7 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 block slide-up slide-up-${i + 1}`}
                style={{ borderTop: `3px solid ${borderTop}`, textDecoration: 'none' }}
              >
                {/* Decorative plate background */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:opacity-25 transition-opacity duration-300">
                  <img src={plate} alt="" className="w-full h-full object-contain" />
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: iconBg }}
                >
                  <Icon className="w-7 h-7" style={{ color: iconColor }} />
                </div>

                <h3 className="font-bold text-base mb-2" style={{ color: '#1C2B22' }}>{title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748B' }}>{desc}</p>

                <div
                  className="flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: iconColor }}
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. TESTIMONIALS
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF' }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="warm-badge mb-4" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              ⭐ Testimonials
            </span>
            <h2
              className="text-4xl font-bold mt-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}
            >
              Trusted by Communities Across India
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(({ name, role, quote, rating }, i) => (
              <div
                key={name}
                className={`warm-card p-8 relative group hover:-translate-y-2 transition-all duration-300 slide-up slide-up-${i + 1}`}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: rating }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: '#334155' }}>{quote}</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
                  >
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1C2B22' }}>{name}</p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{role}</p>
                  </div>
                </div>

                {/* Quotation mark decoration */}
                <span
                  className="absolute top-4 right-6 text-6xl font-black select-none leading-none"
                  style={{ color: '#F0FDF4' }}
                >
                  "
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. PHOTO CAROUSEL
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFF7ED' }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center mb-10">
          <span className="warm-badge mb-4" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            📸 Our Network in Action
          </span>
          <h2
            className="text-3xl font-bold mt-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}
          >
            Real Moments from the Field
          </h2>
        </div>

        <div className="carousel-container overflow-hidden">
          <div className="carousel-track flex gap-5">
            {[...carouselImages, ...carouselImages].map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="min-w-[280px] h-60 flex-shrink-0 rounded-2xl overflow-hidden"
                style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
              >
                <img
                  src={src}
                  alt={`Foodlyx moment ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          8. CTA BANNER
      ════════════════════════════════════════════════════════════ */}
      <section
        className="py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #14532D 0%, #15803D 40%, #22C55E 100%)' }}
      >
        {/* Decorative plates */}
        <img src={plate2} alt="" className="absolute left-0 bottom-0 w-48 h-48 object-contain opacity-10 animate-float-2 pointer-events-none" />
        <img src={plate4} alt="" className="absolute right-8 top-8 w-36 h-36 object-contain opacity-10 animate-float-1 pointer-events-none" />
        <img src={plate1} alt="" className="absolute left-1/2 -translate-x-1/2 -top-10 w-20 h-20 object-contain opacity-10 animate-float-3 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="warm-badge mb-8 mx-auto inline-flex" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>
            🌟 Start Your Impact Today
          </div>
          <h2
            className="text-5xl font-black text-white mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Every Meal Counts.
            <br />Every Act of Kindness Matters.
          </h2>
          <p className="text-lg mb-10" style={{ color: '#BBF7D0' }}>
            Join 320+ NGOs and thousands of food donors already on Foodlyx. Together
            we are turning India's food surplus into community hope.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: '#FFFFFF', color: '#16A34A', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
              🍱 Join as Donor <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                border: '2px solid rgba(255,255,255,0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              🤝 Register as NGO
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          9. FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#1C2B22', color: '#86EFAC' }}>
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(134,239,172,0.2)' }}>
                  <img src="/logo.jpeg" alt="Foodlyx" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-xl text-white tracking-wide">FOODLYX</span>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#6EE7B7' }}>
                A social impact platform turning food surplus into community support — one meal at a time.
              </p>
              <div className="flex flex-wrap gap-2">
                {['FoodRescue', 'ZeroWaste', 'HungerFree'].map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.25)' }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* For Donors */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">For Donors</h4>
              <ul className="space-y-3">
                {['How to Donate', 'Food Categories', 'Schedule Pickup', 'Impact Reports'].map((l) => (
                  <li key={l}><Link to="/signup" className="footer-link">{l}</Link></li>
                ))}
              </ul>
            </div>

            {/* For NGOs */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">For NGOs & Shelters</h4>
              <ul className="space-y-3">
                {['Register Organisation', 'Accept Donations', 'Delivery Tracking', 'Community Hub'].map((l) => (
                  <li key={l}><Link to="/signup" className="footer-link">{l}</Link></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Contact & Support</h4>
              <ul className="space-y-3 text-sm" style={{ color: '#6EE7B7' }}>
                <li>📧 support@foodlyx.in</li>
                <li>📞 +91 98765 43210</li>
                <li>🌐 www.foodlyx.in</li>
                <li className="pt-2">
                  <Link to="/feed" className="footer-link flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> Live Donation Feed
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="footer-link flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Community Hub
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
            style={{ borderColor: 'rgba(134,239,172,0.12)', color: '#4B7A5C' }}
          >
            <p>© 2025 Foodlyx. Built with 💚 for a hunger-free India.</p>
            <div className="flex gap-6">
              {[['Login', '/login'], ['Sign Up', '/signup'], ['Live Feed', '/feed'], ['Community', '/community'], ['Profile', '/profile']].map(([label, path]) => (
                <Link key={label} to={path} className="footer-link">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
