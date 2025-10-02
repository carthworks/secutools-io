"use client";

import Section from "@/components/Section";

export default function AboutPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
          About Cybersecurity Handy Tools
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          A comprehensive toolkit designed for cybersecurity students and professionals.
        </p>
      </section>

      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          <Section title="Our Mission" subtitle="Empowering the cybersecurity community">
            <p className="text-slate-700">
              We believe that cybersecurity tools should be accessible, fast, and privacy-focused.
              Our platform provides essential tools that cybersecurity professionals use daily,
              from hash analysis to threat intelligence gathering.
            </p>
          </Section>

          <Section title="Key Features" subtitle="What makes us different">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">🔒 Privacy First</h3>
                <p className="text-sm text-slate-600">
                  All processing happens client-side. No data is stored or tracked.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">⚡ Fast & Reliable</h3>
                <p className="text-sm text-slate-600">
                  Optimized for speed with minimal dependencies.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">🎓 Educational</h3>
                <p className="text-sm text-slate-600">
                  Perfect for students learning cybersecurity concepts.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">🛡️ Professional</h3>
                <p className="text-sm text-slate-600">
                  Used by security professionals in their daily work.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Open Source" subtitle="Built with transparency">
            <p className="text-slate-700">
              This project is open source and community-driven. We welcome contributions,
              bug reports, and feature requests. The codebase is available on GitHub
              for transparency and educational purposes.
            </p>
          </Section>
        </div>

        {/* Right Column (Author Info Card) */}
        <aside className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border border-indigo-200 rounded-xl p-6 shadow-md h-fit">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">👤 Author Info</h2>
          <div className="space-y-3 text-slate-700">
            <p>
              <strong>Name:</strong> Karthikeyan T
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:tkarthikeyan@gmail.com"
                className="text-indigo-600 hover:underline"
              >
                tkarthikeyan@gmail.com
              </a>
            </p>
            <p>
              <strong>About:</strong> Passionate cybersecurity professional and developer
              creating privacy-friendly, open-source tools for students, SOC teams, 
              and security researchers.
            </p>
            <p>
              <strong>LinkedIn:</strong>{" "}
              <a
                href="https://www.linkedin.com/in/carthworks"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                linkedin.com/in/carthworks
              </a>
            </p>
            <p>
              <strong>Bitbucket:</strong>{" "}
              <a
              href="https://github.com/carthworks"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              https://github.com/carthworks
            </a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
