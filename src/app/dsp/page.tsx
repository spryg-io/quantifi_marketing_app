"use client";

import { DspForm } from "@/components/dsp/dsp-form";

export default function DspPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">DSP Manual Entry</h2>
      <DspForm />
    </div>
  );
}
