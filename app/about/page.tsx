"use client";

import { useState } from "react";
import Section from "@/components/Section";

export default function AboutPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message! We will get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About SecuTools.io
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          A comprehensive toolkit designed for cybersecurity students and professionals.
        </p>
      </section>

      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          <Section title="Our Mission" subtitle="Empowering the cybersecurity community">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We believe that cybersecurity tools should be accessible, fast, and privacy-focused.
              Our platform provides essential tools that cybersecurity professionals use daily,
              from hash analysis to threat intelligence gathering.
            </p>
          </Section>

          <Section title="Key Features" subtitle="What makes us different">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">🔒 Privacy First</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  All processing happens client-side. No data is stored or tracked.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">⚡ Fast & Reliable</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Optimized for speed with minimal dependencies.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">🎓 Educational</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Perfect for students learning cybersecurity concepts.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">🛡️ Professional</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Used by security professionals in their daily work.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Open Source" subtitle="Built with transparency">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              This project is open source and community-driven. We welcome contributions,
              bug reports, and feature requests. The codebase is available on GitHub
              for transparency and educational purposes.
            </p>
          </Section>

          {/* Contact Form Section */}
          <Section title="Get in Touch" subtitle="We would love to hear from you">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="about-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Name</label>
                <input
                  id="about-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="about-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Email</label>
                <input
                  id="about-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="about-message" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Message</label>
                <textarea
                  id="about-message"
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-xs"
              >
                Send Message
              </button>
            </form>
          </Section>
        </div>

        {/* Right Column (Author Info Card) */}
        <aside className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-100/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">👤 Author Info</h2>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">Name:</strong> Karthikeyan T
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Email:</strong>{" "}
                <a
                  href="mailto:tkarthikeyan@gmail.com"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  tkarthikeyan@gmail.com
                </a>
              </p>
              <p className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">About:</strong> Passionate cybersecurity professional and developer
                creating privacy-friendly, open-source tools for students, SOC teams,
                and security researchers.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">LinkedIn:</strong>{" "}
                <a
                  href="https://www.linkedin.com/in/carthworks"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  linkedin.com/in/carthworks
                </a>
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">GitHub:</strong>{" "}
                <a
                  href="https://github.com/carthworks"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  github.com/carthworks
                </a>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-100/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border border-emerald-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📞 Contact Info</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Support Hours</h4>
                <p className="text-slate-600 dark:text-slate-400"><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EST</p>
                <p className="text-slate-600 dark:text-slate-400"><strong>Weekend:</strong> Community support only</p>
                <p className="text-slate-600 dark:text-slate-400"><strong>Response Time:</strong> Within 24 hours</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Community</h4>
                <p className="text-slate-600 dark:text-slate-400">Join our community discussions & research labs</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
