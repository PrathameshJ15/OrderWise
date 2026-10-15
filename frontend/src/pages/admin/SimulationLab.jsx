import React from 'react';
import { FlaskConical } from 'lucide-react';

export default function SimulationLab() {
  return (
    <div className="border border-arcade-border bg-arcade-neutral p-8 text-center font-mono">
      <FlaskConical className="w-8 h-8 text-arcade-accent mx-auto mb-2" />
      <h2 className="text-xl font-bold uppercase text-arcade-primary">Simulation Lab</h2>
      <p className="text-xs text-arcade-secondary mt-1">What-if simulation scenarios: inventory change, demand surge, supplier delay.</p>
    </div>
  );
}
