'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts';
import {
  Trash2, TrendingUp, Cpu, Database, Award, Zap, Activity,
  Info, BarChart2, Layers, Target, Clock,
  ArrowLeft, Eye, ChevronDown, Sparkles, ChevronRight,
  Shield, Gauge, Hexagon, GitBranch, Binary, Orbit,
  Radar, BrainCircuit, Atom, TriangleAlert, Workflow,
} from 'lucide-react';
import { cn } from '../lib/utils';

const API = (import.meta.env.VITE_API_BASE_URL || '') + '/api';

const C = {
  neon: { h: '#818cf8', r: '129,140,248' },   // brighter indigo
  cyan: { h: '#22d3ee', r: '34,211,238' },     // brighter cyan
  emerald: { h: '#34d399', r: '52,211,153' },     // brighter green
  amber: { h: '#fbbf24', r: '251,191,36' },     // brighter amber
  rose: { h: '#fb7185', r: '251,113,133' },     // brighter rose
  violet: { h: '#a78bfa', r: '167,139,250' },     // brighter violet
};

/* ================================================================
   ANIMATED COUNTER
   ================================================================ */
function useAnimatedNumber(target, dur = 1400) {
  const [v, setV] = useState(0);
  const n = typeof target === 'string' ? parseFloat(target) : target;
  const ok = !isNaN(n);
  useEffect(() => {
    if (!ok) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 5);
      setV(e * n);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [n, ok, dur]);
  if (!ok) return target;
  return n > 100 ? Math.round(v) : v.toFixed(1);
}

/* ================================================================
   NEURAL PARTICLES - brighter, more visible
   ================================================================ */
function NeuralField() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const particles = useRef([]);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const colors = [C.neon, C.cyan, C.emerald, C.violet];
    particles.current = Array.from({ length: 70 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2.5 + 0.8,
      baseO: Math.random() * 0.35 + 0.1,
      o: 0, color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of particles.current) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const dm = Math.hypot(p.x - mx, p.y - my);
        if (dm < 200) {
          const force = (1 - dm / 200) * 0.5;
          p.vx += (p.x - mx) / dm * force;
          p.vy += (p.y - my) / dm * force;
        }
        p.vx *= 0.995; p.vy *= 0.995;
        p.o = p.baseO + Math.sin(time * 0.001 + p.phase) * 0.1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${Math.max(0, p.o)})`;
        ctx.fill();

        if (p.r > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r}, ${p.o * 0.2})`;
          ctx.fill();
        }
      }

      const pts = particles.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 150) {
            const alpha = 0.06 * (1 - d / 150);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${C.neon.r}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    const onMouse = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouse); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" />;
}

/* ================================================================
   PROGRESS RING - brighter glow
   ================================================================ */
function ProgressRing({ value, size = 64, stroke = 4, color }) {
  const c = C[color] || C.neon;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const animated = useAnimatedNumber(value, 1800);
  const numVal = typeof animated === 'string' ? parseFloat(animated) : animated;
  const offset = circumference - (numVal / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`ring-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.h} />
            <stop offset="100%" stopColor={C.cyan.h} />
          </linearGradient>
          <filter id={`ring-glow-${color}`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`rgba(${c.r}, 0.1)`} strokeWidth={stroke} />
        <circle
          className="progress-ring"
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#ring-${color})`} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#ring-glow-${color})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="stat-num text-sm font-bold" style={{ color: c.h, textShadow: `0 0 12px rgba(${c.r}, 0.5)` }}>
          {typeof animated === 'number' ? animated.toFixed(0) : animated}
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   TILT CARD
   ================================================================ */
function TiltCard({ children, className, style, ...props }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');

  const handleMouse = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`);
  }, []);

  const handleLeave = useCallback(() => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)');
  }, []);

  return (
    <div
      ref={ref}
      className={cn("glass-card", className)}
      style={{ ...style, transform, transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      {...props}
    >
      {children}
    </div>
  );
}

/* ================================================================
   MAIN DASHBOARD
   ================================================================ */
export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelMethods, setModelMethods] = useState([]);
  const [modelSessions, setModelSessions] = useState([]);
  const [modelSizeSummary, setModelSizeSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionSizeSummary, setSessionSizeSummary] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      const [sumRes, modRes] = await Promise.all([
        fetch(`${API}/summary`, { headers }).then(r => r.json()),
        fetch(`${API}/models`, { headers }).then(r => r.json()),
      ]);
      setSummary(sumRes);
      setModels(modRes.models);
      if (modRes.models.length > 0 && !selectedModel) setSelectedModel(modRes.models[0]);
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoading(false); }
  }, [selectedModel]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!selectedModel) return;
    const { provider, model } = selectedModel;
    const enc = encodeURIComponent(model);
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    Promise.all([
      fetch(`${API}/model/${provider}/${enc}/methods`, { headers }).then(r => r.json()),
      fetch(`${API}/model/${provider}/${enc}/sessions`, { headers }).then(r => r.json()),
    ]).then(([m, s]) => {
      setModelMethods(m.methods);
      setModelSessions(s.sessions);
      setModelSizeSummary(s.size_summary || []);
    });
  }, [selectedModel]);

  useEffect(() => {
    if (selectedSession) {
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      fetch(`${API}/sessions/${selectedSession.id}/summary`, { headers }).then(r => r.json()).then(d => setSessionSizeSummary(d.size_summary || []));
    } else { setSessionSizeSummary([]); }
  }, [selectedSession]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    try {
      await fetch(`${API}/sessions/${id}`, { method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' } });
      fetchData();
      if (selectedModel) {
        const { provider, model } = selectedModel;
        const headers = { 'ngrok-skip-browser-warning': 'true' };
        fetch(`${API}/model/${provider}/${encodeURIComponent(model)}/sessions`, { headers }).then(r => r.json()).then(d => setModelSessions(d.sessions));
      }
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (err) { console.error("Delete failed", err); }
  };

  const getComplexityData = (data) => {
    if (!data) return [];
    return [3, 5, 7].map(size => {
      const entry = { size: `${size}V` };
      ['det', 'linear'].forEach(m => {
        const d = data.find(x => x.size === size && x.method === m);
        entry[`${m}_success`] = d ? d.success_rate : 0;
        entry[`${m}_tokens`] = d ? d.avg_tokens : 0;
        entry[`${m}_score`] = d ? d.avg_score : 0;
        entry[`${m}_time`] = d ? d.avg_time : 0;
      });
      return entry;
    });
  };

  const modelComplexity = useMemo(() => getComplexityData(modelSizeSummary), [modelSizeSummary]);
  const sessionComplexity = useMemo(() => getComplexityData(sessionSizeSummary), [sessionSizeSummary]);
  const modelAgg = useMemo(() => {
    if (!selectedModel || !models.length) return null;
    return models.find(m => m.model === selectedModel.model && m.provider === selectedModel.provider);
  }, [selectedModel, models]);

  /* ---- LOADING ---- */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen relative">
      <div className="cosmic-bg" />
      <NeuralField />
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="absolute -inset-10 rounded-full blur-3xl animate-breathe" style={{ background: 'rgba(129,140,248,0.2)' }} />
          <div className="absolute -inset-5 rounded-full blur-2xl animate-breathe" style={{ animationDelay: '1s', background: 'rgba(34,211,238,0.15)' }} />
          <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center animate-float" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
            <BrainCircuit size={40} className="text-neon" />
          </div>
        </div>
        <p className="mt-12 text-base font-display font-bold text-fg tracking-[0.4em] uppercase">Initializing Neural Core</p>
        <div className="mt-5 w-64 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(129,140,248,0.08)' }}>
          <div className="h-full shimmer-load rounded-full" />
        </div>
      </div>
    </div>
  );

  const avgScore = summary?.method_summary
    ? (summary.method_summary.reduce((a, b) => a + b.avg_score, 0) / Math.max(summary.method_summary.length, 1))
    : 0;
  const avgSuccess = summary?.method_summary
    ? (summary.method_summary.reduce((a, b) => a + b.success_rate, 0) / Math.max(summary.method_summary.length, 1))
    : 0;

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen text-fg relative" style={{ background: '#030306' }}>
      <div className="cosmic-bg" />
      <div className="precision-grid" />
      <NeuralField />

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(3,3,6,0.7)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderBottom: '1px solid rgba(129,140,248,0.08)' }}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 flex items-center justify-between h-[76px]">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-3 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'rgba(129,140,248,0.15)' }} />
              <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12), transparent, rgba(34,211,238,0.08))' }} />
                <BrainCircuit size={20} style={{ color: C.neon.h }} className="relative z-10" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-display font-extrabold tracking-tight" style={{ color: '#f0f0ff' }}>ThoughtEngine</h1>
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase mt-0.5" style={{ color: '#9191b0' }}>Cognitive Analytics Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-2xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div className="relative flex items-center justify-center w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: C.emerald.h }} />
                <span className="relative block w-2.5 h-2.5 rounded-full" style={{ background: C.emerald.h, boxShadow: `0 0 14px rgba(${C.emerald.r}, 0.8)` }} />
              </div>
              <span className="text-[11px] font-bold tracking-wider" style={{ color: C.emerald.h }}>LIVE</span>
            </div>
            <div className="h-6 w-px hidden md:block" style={{ background: 'rgba(129,140,248,0.1)' }} />
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: 'rgba(6,6,18,0.5)', border: '1px solid rgba(129,140,248,0.08)' }}>
              <Atom size={14} style={{ color: 'rgba(129,140,248,0.6)' }} />
              <span className="text-sm font-display font-bold" style={{ color: '#e0e0f0' }}>{summary?.sessions?.length || 0}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#9191b0' }}>experiments</span>
            </div>
          </div>
        </div>
        <div className="rainbow-line" />
      </header>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-10 py-12">
        {!selectedSession ? (
          <div className="flex flex-col gap-14">

            {/* ═══ EXECUTIVE INSIGHT ═══ */}
            {summary?.stats_in_words && (
              <section className="glass-card scan-line animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="relative z-10 p-10 md:p-12 flex items-start gap-8">
                  <div className="shrink-0 relative hidden sm:block">
                    <div className="absolute -inset-4 rounded-3xl blur-2xl animate-breathe" style={{ background: 'rgba(129,140,248,0.12)' }} />
                    <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}>
                      <Sparkles size={34} style={{ color: C.neon.h }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-display" style={{ color: C.neon.h }}>Executive Intelligence</span>
                      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, rgba(${C.neon.r}, 0.25), rgba(${C.cyan.r}, 0.12), transparent)` }} />
                    </div>
                    <p className="text-base md:text-lg leading-[1.8] font-light max-w-3xl" style={{ color: '#d0d0e8' }}>{summary.stats_in_words}</p>
                  </div>
                </div>
              </section>
            )}

            {/* ═══ HERO STAT CARDS ═══ */}
            {summary?.method_summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <HeroStat label="Neural Models" val={models.length} icon={<BrainCircuit size={24} />} color="neon" i={0} />
                <HeroStat label="Experiments" val={summary?.sessions?.length || 0} icon={<Layers size={24} />} color="cyan" i={1} />
                <HeroStat label="Cognition Score" val={`${avgScore.toFixed(1)}%`} icon={<Target size={24} />} color="emerald" i={2} ring />
                <HeroStat label="Success Rate" val={`${avgSuccess.toFixed(1)}%`} icon={<Shield size={24} />} color="amber" i={3} ring />
              </div>
            )}

            {/* ═══ CHARTS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <GlowChart title="Method Efficiency" sub="Comparative scoring analysis" icon={<BarChart2 size={18} />} color="neon">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summary?.method_summary} barGap={20}>
                    <defs>
                      <linearGradient id="bNeon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.neon.h} stopOpacity={1} />
                        <stop offset="100%" stopColor={C.neon.h} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="bCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.cyan.h} stopOpacity={1} />
                        <stop offset="100%" stopColor={C.cyan.h} stopOpacity={0.4} />
                      </linearGradient>
                      <filter id="barGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(129,140,248,0.07)" vertical={false} />
                    <XAxis dataKey="method" tick={{ fill: '#b0b0d0', fontSize: 12, fontWeight: 700, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8080a0', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(129,140,248,0.04)' }} />
                    <Bar dataKey="avg_score" name="Avg Score" radius={[10, 10, 3, 3]} barSize={65} filter="url(#barGlow)">
                      {summary?.method_summary?.map((_, i) => <Cell key={i} fill={i === 0 ? 'url(#bNeon)' : 'url(#bCyan)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlowChart>

              <GlowChart title="Success Rate" sub="Correct reasoning probability" icon={<TrendingUp size={18} />} color="cyan">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summary?.method_summary} barGap={20}>
                    <defs>
                      <linearGradient id="bEm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.emerald.h} stopOpacity={1} />
                        <stop offset="100%" stopColor={C.emerald.h} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="bAm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.amber.h} stopOpacity={1} />
                        <stop offset="100%" stopColor={C.amber.h} stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.07)" vertical={false} />
                    <XAxis dataKey="method" tick={{ fill: '#b0b0d0', fontSize: 12, fontWeight: 700, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8080a0', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(34,211,238,0.04)' }} />
                    <Bar dataKey="success_rate" name="Success Rate" radius={[10, 10, 3, 3]} barSize={65} filter="url(#barGlow)">
                      {summary?.method_summary?.map((_, i) => <Cell key={i} fill={i === 0 ? 'url(#bEm)' : 'url(#bAm)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlowChart>
            </div>

            {/* ═══ MODEL PORTFOLIO ═══ */}
            <section className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="glass-card">
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 lg:px-10 py-7" style={{ borderBottom: '1px solid rgba(129,140,248,0.08)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}>
                        <Workflow size={18} style={{ color: C.neon.h }} />
                      </div>
                      <div>
                        <h2 className="text-base font-display font-extrabold" style={{ color: '#f0f0ff' }}>Model Portfolio</h2>
                        <p className="text-[11px] mt-0.5 font-semibold tracking-wide" style={{ color: '#9191b0' }}>Deep configuration analysis</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        className="appearance-none text-sm font-display font-bold pl-4 pr-11 py-3.5 rounded-2xl focus:outline-none focus:ring-2 transition-all cursor-pointer"
                        style={{ background: 'rgba(6,6,18,0.7)', color: '#e0e0f0', border: '1px solid rgba(129,140,248,0.1)', focusRingColor: 'rgba(129,140,248,0.3)' }}
                        value={selectedModel ? `${selectedModel.provider}|||${selectedModel.model}` : ""}
                        onChange={(e) => { const [p, m] = e.target.value.split("|||"); setSelectedModel({ provider: p, model: m }); }}
                      >
                        {models.map(m => (
                          <option key={`${m.provider}|||${m.model}`} value={`${m.provider}|||${m.model}`}>
                            {m.provider.toUpperCase()} / {m.model}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(129,140,248,0.5)' }} />
                    </div>
                  </div>

                  <div className="p-8 lg:p-10 flex flex-col gap-12">
                    {modelAgg && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        <MetricCard label="Total Trials" val={modelAgg.total_trials} icon={<Zap size={20} />} color="neon" />
                        <MetricCard label="Avg Score" val={`${modelAgg.avg_score.toFixed(1)}%`} icon={<Award size={20} />} color="cyan" />
                        <MetricCard label="Success Rate" val={`${modelAgg.success_rate.toFixed(1)}%`} icon={<Activity size={20} />} color="emerald" />
                        <MetricCard label="Avg Tokens" val={Math.round(modelAgg.avg_tokens)} icon={<Database size={20} />} color="amber" />
                      </div>
                    )}

                    <div>
                      <Divider>Complexity Benchmarks</Divider>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <MiniVis title="Success %" data={modelComplexity} keys={["det_success", "linear_success"]} colors={[C.neon.h, C.cyan.h]} domain={[0, 100]} />
                        <MiniVis title="Score" data={modelComplexity} keys={["det_score", "linear_score"]} colors={[C.cyan.h, C.emerald.h]} domain={[0, 100]} />
                        <MiniVis title="Tokens" data={modelComplexity} keys={["det_tokens", "linear_tokens"]} colors={[C.amber.h, C.rose.h]} />
                        <MiniVis title="Latency" data={modelComplexity} keys={["det_time", "linear_time"]} colors={[C.neon.h, C.amber.h]} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <Divider noMb>Experiment History</Divider>
                        <span className="text-[10px] font-mono tracking-[0.3em] font-bold" style={{ color: 'rgba(129,140,248,0.5)' }}>{modelSessions.length} RUNS</span>
                      </div>
                      <div className="overflow-x-auto rounded-3xl" style={{ background: 'rgba(6,6,18,0.5)', border: '1px solid rgba(129,140,248,0.06)' }}>
                        <table className="w-full text-left">
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(129,140,248,0.08)' }}>
                              {['Session', 'Date', 'DET', 'LINEAR', 'Success', ''].map((h, i) => (
                                <th key={h || i} className={cn("px-7 py-5 text-[10px] font-display font-bold uppercase tracking-[0.25em]", i >= 2 && i <= 4 && 'text-center', i === 5 && 'w-28')} style={{ color: '#8080a0' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {modelSessions.map(s => (
                              <tr key={s.id} className="group cursor-pointer transition-all duration-300" onClick={() => setSelectedSession(s)} style={{ borderBottom: '1px solid rgba(129,140,248,0.04)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(129,140,248,0.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td className="px-7 py-5">
                                  <span className="text-sm font-mono font-bold" style={{ color: C.neon.h }}>#{s.id.toString().padStart(4, '0')}</span>
                                  <span className="block text-[11px] mt-1 font-semibold" style={{ color: '#8080a0' }}>{s.total_trials} trials</span>
                                </td>
                                <td className="px-7 py-5">
                                  <span className="text-sm font-medium" style={{ color: '#c0c0d8' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                                  <span className="block text-[11px] mt-1" style={{ color: '#7070a0' }}>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-7 py-5 text-center"><Badge v={s.det_score} color="neon" /></td>
                                <td className="px-7 py-5 text-center"><Badge v={s.linear_score} color="cyan" /></td>
                                <td className="px-7 py-5">
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="w-28 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(129,140,248,0.08)' }}>
                                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.success_rate}%`, background: `linear-gradient(90deg, ${C.neon.h}, ${C.cyan.h})`, boxShadow: `0 0 16px rgba(${C.neon.r}, 0.4)` }} />
                                    </div>
                                    <span className="text-sm font-mono font-bold w-14 text-right" style={{ color: '#e0e0f0' }}>{s.success_rate.toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className="px-7 py-5">
                                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedSession(s); }} className="p-2.5 rounded-xl transition-all" style={{ color: '#8080a0' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.1)'; e.currentTarget.style.color = C.neon.h; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8080a0'; }}
                                      aria-label="View session"><Eye size={15} /></button>
                                    <button onClick={(e) => handleDelete(e, s.id)} className="p-2.5 rounded-xl transition-all" style={{ color: '#8080a0' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,113,133,0.1)'; e.currentTarget.style.color = C.rose.h; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8080a0'; }}
                                      aria-label="Delete session"><Trash2 size={15} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ═══ BOTTOM: LOG + INSIGHTS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="lg:col-span-1 glass-card overflow-hidden">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: '1px solid rgba(129,140,248,0.08)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}>
                        <Radar size={16} style={{ color: C.neon.h }} />
                      </div>
                      <h3 className="text-sm font-display font-extrabold" style={{ color: '#f0f0ff' }}>System Feed</h3>
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.3em] font-bold" style={{ color: 'rgba(129,140,248,0.45)' }}>{summary?.sessions?.length || 0}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 max-h-[520px]">
                    <div className="flex flex-col gap-1">
                      {summary?.sessions.map(s => (
                        <button
                          key={s.id} type="button"
                          onClick={() => {
                            const mod = models.find(m => m.model === s.model);
                            if (mod) setSelectedModel({ provider: mod.provider, model: mod.model });
                            setSelectedSession(s);
                          }}
                          className="group w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(129,140,248,0.04)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div className="relative w-3 h-3 shrink-0">
                            <div className="absolute inset-0 rounded-full transition-colors" style={{ background: 'rgba(129,140,248,0.2)' }} />
                            <div className="absolute inset-0.5 rounded-full transition-colors" style={{ background: 'rgba(129,140,248,0.5)', boxShadow: `0 0 8px rgba(${C.neon.r}, 0.4)` }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#d0d0e8' }}>{s.model}</p>
                            <p className="text-[11px] mt-0.5 font-mono" style={{ color: '#7070a0' }}>{s.mode} &middot; {new Date(s.created_at).toLocaleDateString()}</p>
                          </div>
                          <ChevronRight size={13} className="shrink-0 transition-colors" style={{ color: 'rgba(129,140,248,0.25)' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 glass-card overflow-hidden">
                <div className="relative z-10 p-10 md:p-12 flex flex-col gap-10">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
                      <Orbit size={18} style={{ color: C.cyan.h }} />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-extrabold" style={{ color: '#f0f0ff' }}>Neural Insights</h3>
                      <p className="text-[11px] mt-0.5 font-semibold" style={{ color: '#9191b0' }}>Strategic analysis & recommendations</p>
                    </div>
                  </div>
                  <p className="text-sm leading-[1.8] font-light max-w-2xl" style={{ color: '#b0b0cc' }}>
                    This platform evaluates reasoning architectures across problem complexity tiers (3, 5, 7 variables).
                    DET and LINEAR methods are profiled independently to surface optimal strategies as reasoning depth scales.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InsightTile color="neon" title="DET Stability" desc="Deterministic reasoning leads in small-medium complexity with significantly lower variance across trials." icon={<Shield size={18} />} />
                    <InsightTile color="cyan" title="Linear Discovery" desc="Linear chains exhibit higher variance but occasionally discover novel reasoning pathways at higher complexity." icon={<GitBranch size={18} />} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ═══ SESSION DETAIL ═══ */
          <div className="flex flex-col gap-12 animate-fade-up">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedSession(null)} className="group flex items-center gap-3 text-sm font-display font-bold transition-colors" style={{ color: '#9191b0' }}
                onMouseEnter={(e) => e.currentTarget.style.color = C.neon.h}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9191b0'}
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1.5 transition-transform" />
                <span>Back to portfolio</span>
              </button>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold font-mono tracking-wider px-5 py-2.5 rounded-2xl" style={{ color: C.neon.h, background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}>
                  SESSION #{selectedSession.id.toString().padStart(4, '0')}
                </span>
                <span className="text-sm font-mono hidden sm:inline" style={{ color: '#8080a0' }}>{new Date(selectedSession.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              <TiltCard className="overflow-hidden">
                <div className="relative z-10 p-8 flex flex-col gap-7">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}>
                      <Gauge size={17} style={{ color: C.neon.h }} />
                    </div>
                    <h4 className="text-xs font-display font-extrabold uppercase tracking-[0.25em]" style={{ color: '#e0e0f0' }}>Configuration</h4>
                  </div>
                  <div className="flex flex-col">
                    <DetailRow label="Model" val={selectedModel.model} />
                    <DetailRow label="Provider" val={selectedModel.provider} />
                    <DetailRow label="Trials" val={selectedSession.total_trials} />
                    <DetailRow label="Avg Score" val={`${(selectedSession.avg_score || 0).toFixed(1)}%`} />
                    <DetailRow label="Success" val={`${(selectedSession.success_rate || 0).toFixed(1)}%`} />
                  </div>
                  <div className="flex items-center justify-around pt-3" style={{ borderTop: '1px solid rgba(129,140,248,0.08)' }}>
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing value={selectedSession.avg_score || 0} size={56} stroke={4} color="neon" />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8080a0' }}>Score</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing value={selectedSession.success_rate || 0} size={56} stroke={4} color="emerald" />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8080a0' }}>Success</span>
                    </div>
                  </div>
                </div>
              </TiltCard>

              <div className="md:col-span-2 flex flex-col gap-7">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
                    <BarChart2 size={16} style={{ color: C.cyan.h }} />
                  </div>
                  <h3 className="text-base font-display font-extrabold" style={{ color: '#f0f0ff' }}>Session Analytics</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <MiniVis title="Success %" data={sessionComplexity} keys={["det_success", "linear_success"]} colors={[C.neon.h, C.cyan.h]} domain={[0, 100]} />
                  <MiniVis title="Score" data={sessionComplexity} keys={["det_score", "linear_score"]} colors={[C.cyan.h, C.emerald.h]} domain={[0, 100]} />
                  <MiniVis title="Tokens" data={sessionComplexity} keys={["det_tokens", "linear_tokens"]} colors={[C.amber.h, C.rose.h]} />
                  <MiniVis title="Latency" data={sessionComplexity} keys={["det_time", "linear_time"]} colors={[C.neon.h, C.amber.h]} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

function HeroStat({ label, val, icon, color, i, ring }) {
  const animated = useAnimatedNumber(val);
  const c = C[color];
  const suffix = typeof val === 'string' && val.includes('%') ? '%' : '';
  const numForRing = typeof val === 'string' ? parseFloat(val) : val;

  return (
    <TiltCard
      className="group p-7 md:p-8 animate-count-in"
      style={{ animationDelay: `${i * 100}ms`, boxShadow: `0 0 60px rgba(${c.r}, 0.06)` }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.3em]" style={{ color: '#9191b0' }}>{label}</p>
          <div className="opacity-40 group-hover:opacity-80 transition-opacity duration-700" style={{ color: c.h }}>{icon}</div>
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className={cn("stat-num text-4xl md:text-5xl font-extrabold tracking-tight")} style={{ color: c.h, textShadow: `0 0 40px rgba(${c.r}, 0.5), 0 0 100px rgba(${c.r}, 0.2)` }}>
            {animated}{suffix}
          </p>
          {ring && numForRing <= 100 && (
            <ProgressRing value={numForRing} size={52} stroke={4} color={color} />
          )}
        </div>
      </div>
    </TiltCard>
  );
}

function GlowChart({ title, sub, icon, color, children }) {
  const c = C[color];
  return (
    <div className="glass-card group transition-all duration-700" style={{ boxShadow: `0 0 50px rgba(${c.r}, 0.04)` }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 80px rgba(${c.r}, 0.08), 0 30px 100px rgba(0,0,0,0.5)`}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 50px rgba(${c.r}, 0.04)`}
    >
      <div className="relative z-10">
        <div className="px-8 pt-8 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span style={{ color: c.h, opacity: 0.7 }}>{icon}</span>
              <h4 className="text-base font-display font-extrabold" style={{ color: '#f0f0ff' }}>{title}</h4>
            </div>
            {sub && <p className="text-[12px] font-medium" style={{ color: '#9191b0' }}>{sub}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: c.h, boxShadow: `0 0 16px rgba(${c.r}, 0.6)` }} />
          </div>
        </div>
        <div className="px-5 pb-7">{children}</div>
      </div>
    </div>
  );
}

function MiniVis({ title, data, keys, colors, domain }) {
  return (
    <TiltCard className="p-5" style={{ borderRadius: '20px' }}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-[12px] font-display font-bold tracking-tight" style={{ color: '#e0e0f0' }}>{title}</h5>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#9191b0' }}>
              <span className="w-3.5 h-2.5 rounded-sm" style={{ background: colors[0], boxShadow: `0 0 10px ${colors[0]}60` }} />DET
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#9191b0' }}>
              <span className="w-3.5 h-2.5 rounded-sm" style={{ background: colors[1], boxShadow: `0 0 10px ${colors[1]}60` }} />LIN
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barGap={5}>
            <defs>
              {colors.map((c, i) => (
                <linearGradient key={i} id={`mv${title.replace(/\s/g, '')}${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={1} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(129,140,248,0.06)" vertical={false} />
            <XAxis dataKey="size" tick={{ fill: '#a0a0c0', fontSize: 10, fontWeight: 700, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
            <YAxis domain={domain} tick={{ fill: '#7070a0', fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(129,140,248,0.04)' }} />
            <Bar dataKey={keys[0]} name="DET" fill={`url(#mv${title.replace(/\s/g, '')}0)`} radius={[6, 6, 1, 1]} />
            <Bar dataKey={keys[1]} name="LINEAR" fill={`url(#mv${title.replace(/\s/g, '')}1)`} radius={[6, 6, 1, 1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </TiltCard>
  );
}

function MetricCard({ label, val, icon, color }) {
  const c = C[color];
  const animated = useAnimatedNumber(val);
  const suffix = typeof val === 'string' && val.includes('%') ? '%' : '';
  return (
    <TiltCard className="p-6 group" style={{ boxShadow: `0 0 40px rgba(${c.r}, 0.05)` }}>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.25em]" style={{ color: '#9191b0' }}>{label}</p>
          <div className="opacity-35 group-hover:opacity-70 transition-opacity duration-600" style={{ color: c.h }}>{icon}</div>
        </div>
        <p className="stat-num text-2xl font-extrabold tracking-tight" style={{ color: c.h, textShadow: `0 0 20px rgba(${c.r}, 0.4)` }}>{animated}{suffix}</p>
      </div>
    </TiltCard>
  );
}

function Badge({ v, color }) {
  const c = C[color];
  if (!v) return <span className="text-sm font-mono" style={{ color: '#5050a0' }}>--</span>;
  return (
    <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-mono font-bold"
      style={{ color: c.h, background: `rgba(${c.r}, 0.08)`, border: `1px solid rgba(${c.r}, 0.12)`, boxShadow: `0 0 16px rgba(${c.r}, 0.1)` }}
    >
      {v.toFixed(1)}%
    </span>
  );
}

function InsightTile({ color, title, desc, icon }) {
  const c = C[color];
  return (
    <div className="group p-7 rounded-3xl transition-all duration-500 hover:translate-y-[-3px]"
      style={{ background: `rgba(${c.r}, 0.04)`, border: `1px solid rgba(${c.r}, 0.1)` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(${c.r}, 0.2)`; e.currentTarget.style.boxShadow = `0 0 40px rgba(${c.r}, 0.08)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `rgba(${c.r}, 0.1)`; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `rgba(${c.r}, 0.08)`, border: `1px solid rgba(${c.r}, 0.12)` }}>
          <span style={{ color: c.h }}>{icon}</span>
        </div>
        <p className="text-[10px] font-display font-bold uppercase tracking-[0.3em]" style={{ color: c.h }}>{title}</p>
      </div>
      <p className="text-sm leading-[1.7] font-light" style={{ color: '#b0b0cc' }}>{desc}</p>
    </div>
  );
}

function Divider({ children, noMb }) {
  return (
    <div className={cn("flex items-center gap-4", !noMb && "mb-6")}>
      <span className="text-[10px] font-display font-bold uppercase tracking-[0.35em]" style={{ color: 'rgba(129,140,248,0.55)' }}>{children}</span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(129,140,248,0.15), rgba(34,211,238,0.08), transparent)' }} />
    </div>
  );
}

function DetailRow({ label, val }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(129,140,248,0.06)' }}>
      <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]" style={{ color: '#8080a0' }}>{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color: '#e0e0f0' }}>{val}</span>
    </div>
  );
}

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-6 py-5" style={{ boxShadow: '0 0 50px rgba(129,140,248,0.12), 0 25px 80px rgba(0,0,0,0.6)', borderRadius: '16px', border: '1px solid rgba(129,140,248,0.1)' }}>
      <div className="relative z-10">
        <p className="text-[10px] font-display font-bold mb-3 pb-2 uppercase tracking-[0.3em]" style={{ color: 'rgba(129,140,248,0.7)', borderBottom: '1px solid rgba(129,140,248,0.1)' }}>{label}</p>
        <div className="flex flex-col gap-2.5">
          {payload.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-12">
              <span className="flex items-center gap-2.5 text-[11px] font-medium" style={{ color: '#b0b0cc' }}>
                <span className="w-3.5 h-2.5 rounded-sm" style={{ background: item.color || item.fill, boxShadow: `0 0 10px ${item.color || item.fill}50` }} />
                {item.name}
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: '#f0f0ff' }}>{typeof item.value === 'number' ? (item.value > 100 ? item.value.toFixed(0) : item.value.toFixed(1)) : item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
