"use client";

import Link from "next/link";
import { Stethoscope, Mic, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootLanding() {
  const cards = [
    {
      href: "/chat",
      title: "Text Interview Mode",
      icon: Stethoscope,
      blurb:
        "Practice history-taking through a typed conversation. Progressive disclosure of the patient's narrative and structured write‑up scoring.",
      cta: "Start Text Interview",
      accent:
        "from-blue-600/20 via-blue-500/10 to-transparent border-blue-600/40 hover:border-blue-500 hover:shadow-blue-500/30",
    },
    {
      href: "/realtime",
      title: "Realtime Voice Mode",
      icon: Mic,
      blurb:
        "Simulate a live voice encounter using the Realtime API. Speak with the virtual patient, then generate your write‑up.",
      cta: "Start Voice Session",
      accent:
        "from-emerald-600/20 via-emerald-500/10 to-transparent border-emerald-600/40 hover:border-emerald-500 hover:shadow-emerald-500/30",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-14">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Clinical Encounter Simulator
          </h1>
          <p className="mt-3 text-gray-400 max-w-2xl">
            Choose a mode to start practicing focused history-taking and clinical
            reasoning. Submit a structured write‑up for automated feedback and
            scoring.
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-2">
          {cards.map(({ href, title, icon: Icon, blurb, cta, accent }) => (
            <Link
              key={href}
              href={href}
              className={`
                group relative rounded-2xl border bg-gradient-to-br ${accent}
                p-8 transition-all duration-300
                hover:shadow-lg hover:translate-y-[-2px]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600/40 focus:ring-offset-gray-950
              `}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-gray-800/70 p-3 ring-1 ring-inset ring-white/10 group-hover:bg-gray-700/70 transition-colors">
                  <Icon className="h-6 w-6 text-gray-200" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="text-sm leading-relaxed text-gray-400">{blurb}</p>
                  <Button
                    variant="outline"
                    className="mt-2 border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
                  >
                    {cta}
                  </Button>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
            </Link>
          ))}
        </div>

        <footer className="mt-20 text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Clinical Simulator. All rights
          reserved.
        </footer>
      </div>
    </main>
  );
}
