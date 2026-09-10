"use client";

import { useState } from "react";
import Section from "@/components/Section";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Thank you for your message! We will get back to you within 24 hours.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">Contact Us</h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Get in touch with our team for questions, tool suggestions, security vulnerability disclosures, or feedback.
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        <Section title="Send us a Message" subtitle="We would love to hear from you">
          {status && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
              {status}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Send Message
            </button>
          </form>
        </Section>

        <div className="space-y-6">
          <Section title="Get in Touch" subtitle="Multiple ways to reach us">
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Email</h2>
                <a href="mailto:tkarthikeyan@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  tkarthikeyan@gmail.com
                </a>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white mb-1">GitHub</h2>
                <a href="https://github.com/carthworks" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  github.com/carthworks
                </a>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Community & Support</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Open an issue or start a discussion on our GitHub repository.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Support Hours" subtitle="When we are available">
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EST</p>
              <p><strong>Weekend:</strong> Community support only</p>
              <p><strong>Response Time:</strong> Within 24 hours</p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
