import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  ShieldAlert,
  Truck,
  ArrowRight,
  Boxes,
  Sliders,
} from 'lucide-react';

export default function AdminDashboard() {
  const modules = [
    {
      title: 'Phase 11: Supply Intelligence & Alerts',
      desc: 'Proactive stockout warnings, demand forecasting, inventory positions, and draft PO workflows.',
      link: '/admin/alerts',
      altLink: '/admin/replenishment',
      icon: ShieldAlert,
      badge: 'Active & Complete',
    },
    {
      title: 'Phase 9: Allocation Impact Analyzer',
      desc: 'Before/after diffing between allocation runs with root-cause attribution and Recharts visual diff.',
      link: '/admin/impact',
      icon: Layers,
      badge: 'Active & Complete',
    },
    {
      title: 'AI Priority Assistant',
      desc: 'Groq LLaMA-3 powered priority recommendations with deterministic human approval gates.',
      link: '/admin/ai',
      icon: Sparkles,
      badge: 'Active & Complete',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      <div className="border border-arcade-border bg-arcade-neutral p-6">
        <h1 className="font-display text-3xl font-black uppercase text-arcade-primary">
          OrderWise Admin Operations Center
        </h1>
        <p className="text-arcade-secondary text-xs sm:text-sm mt-1 max-w-2xl">
          Deterministic business rules, AI-assisted priority recommendations, and explainable inventory allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.title} className="border border-arcade-border bg-arcade-neutral p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-arcade-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-arcade-accent border border-arcade-accent/30 bg-arcade-accent/10 px-2 py-0.5">
                    {m.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-arcade-primary">{m.title}</h3>
                <p className="text-xs text-arcade-secondary mt-1 leading-relaxed">{m.desc}</p>
              </div>

              <div className="pt-2 border-t border-arcade-border flex items-center justify-between">
                <Link
                  to={m.link}
                  className="text-xs font-bold uppercase tracking-wider text-arcade-accent hover:underline flex items-center space-x-1"
                >
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {m.altLink && (
                  <Link
                    to={m.altLink}
                    className="text-xs font-semibold uppercase tracking-wider text-arcade-secondary hover:text-arcade-primary"
                  >
                    <span>Replenishment</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
