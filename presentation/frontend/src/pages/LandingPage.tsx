import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Camera,
  Cpu,
  FileSpreadsheet,
  Users,
  Target,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth";

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: FeatureItem[] = [
  {
    title: "Fast OMR Capture",
    description: "Scan answer sheets from your camera workflow and process large exam batches quickly.",
    icon: ScanLine,
  },
  {
    title: "Instant Insights",
    description: "Track distributions and exam performance with analytics built for educators.",
    icon: BarChart3,
  },
  {
    title: "Reliable Governance",
    description: "Role-based access and structured class management keep records accurate and safe.",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: "Capture",
    desc: "Use any device camera to scan batches of OMR sheets.",
    icon: Camera,
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Process",
    desc: "Our 7-stage Python CV pipeline detects, corrects, and scores bubbles with OpenCV precision.",
    icon: Cpu,
    color: "bg-indigo-50 text-indigo-600"
  },
  {
    title: "Analyze",
    desc: "Instant export to CSV or PDF with deep statistical insights into student performance.",
    icon: FileSpreadsheet,
    color: "bg-emerald-50 text-emerald-600"
  }
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const ctaHref = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN;
  const ctaLabel = isLoading
    ? "Checking session..."
    : isAuthenticated
      ? "Open Dashboard"
      : "Get Started for Free";

  return (
    <div className="relative min-h-screen bg-white text-slate-900 overflow-x-hidden" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* --- LIGHT MODE BACKGROUND ELEMENTS --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.3),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(209,250,229,0.3),transparent_40%)]" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-slate-50 to-transparent" />

      {/* --- HEADER --- */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
             <span className="absolute h-7 w-7 rounded-full border-[3px] border-cyan-500/30" />
             <span className="absolute h-4 w-4 rounded-full bg-cyan-600" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            GradeLens
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-cyan-600 transition-colors">How it Works</a>
          <a href="#about" className="hover:text-cyan-600 transition-colors">About</a>
        </nav>
        <Button asChild variant="ghost" className="text-slate-600 hover:text-slate-900">
          <Link to={ROUTES.LOGIN}>Admin Login</Link>
        </Button>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 mx-auto grid max-w-6xl gap-16 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-2 lg:items-center">
        <section className="space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-700">
              <Sparkles size={14} /> Modern Assessment Intelligence
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.1] text-slate-900 sm:text-6xl" style={{ fontFamily: "'Sora', sans-serif" }}>
              Grading at the speed of <span className="text-cyan-600">sight.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Empower educators with a high-precision OMR pipeline. Turn stacks of paper into 
              structured data and actionable insights in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="h-12 rounded-xl bg-slate-900 px-8 text-white hover:bg-slate-800 shadow-xl shadow-slate-200">
              <Link to={ctaHref} className="flex items-center gap-2">
                {ctaLabel} <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-slate-200">
               <a href="#how-it-works">Watch Demo</a>
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
            <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                <img
                    key={i}
                    /* Note: Usually in Vite/Next.js, use src={`/notionist-${i}.svg`} without 'public' in the string */
                    src={`/notionist-${i}.svg`} 
                    alt={`User avatar ${i}`}
                    className="h-9 w-9 rounded-full border border-gray-500 object-cover bg-slate-100"
                />
                ))}
                
                {/* The "More" Badge */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-500 bg-slate-100 text-[10px] font-bold text-slate-600">
                +46
                </div>
            </div>

            <p className="text-sm text-slate-500 font-medium">
                Trusted by 50+ users
            </p>
            </div>
        </section>

        {/* --- GRAPHIC COLUMN (Feature Cards) --- */}
        <section className="relative">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4 rounded-2xl border border-slate-50 bg-white p-4 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-snug">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-emerald-100/50 blur-3xl -z-10" />
        </section>
      </main>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="relative z-10 bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl" style={{ fontFamily: "'Sora', sans-serif" }}>
              The GradeLens Pipeline
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Behind the scenes, GradeLens uses advanced Computer Vision to ensure 
              near-perfect accuracy even with hand-marked sheets.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.title} className="relative flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} shadow-inner`}>
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                {idx < 2 && (
                  <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-slate-200" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl" style={{ fontFamily: "'Sora', sans-serif" }}>
                Built for the Future of <br />
                <span className="text-cyan-600">Educational Analytics.</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                GradeLens was born out of a simple observation: teachers spend too much time on manual grading 
                and too little time on student intervention. 
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Users, label: "Teacher Centric", sub: "Designed for real workflows" },
                  { icon: Target, label: "99% Accuracy", sub: "Advanced ROI extraction" },
                  { icon: Zap, label: "Real-time", sub: "Websocket-driven results" },
                  { icon: ShieldCheck, label: "Secure", sub: "FERPA-ready architecture" }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                    <item.icon size={20} className="text-cyan-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Cpu size={120} />
               </div>
               <h4 className="text-cyan-400 font-mono text-sm mb-4 uppercase tracking-widest">// Technical Core</h4>
               <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Our hybrid architecture combines a high-speed <strong>Node.js</strong> backend with a specialized <strong>Python compute layer</strong>.
                By offloading Computer Vision tasks to an OpenCV-optimized pipeline, we process 60-question forms with perspective correction and 
                homography in sub-second intervals.
               </p>
               <Link to={ROUTES.LOGIN} className="text-white text-sm font-bold flex items-center gap-2 hover:text-cyan-400 transition-colors">
                 Learn about our API <ArrowRight size={14} />
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-slate-100 py-12 bg-white">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:px-10">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
            <div className="h-6 w-6 rounded bg-slate-900" />
            <span className="font-bold text-slate-900">GradeLens</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 GradeLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}