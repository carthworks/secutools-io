import { ReactNode } from "react";

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function Section({ title, subtitle, children, className = "" }: SectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        {subtitle ? <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{subtitle}</p> : null}
      </div>
      <div className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 text-slate-900 dark:text-slate-100 transition-colors shadow-sm ${className}`}>{children}</div>
    </section>
  );
}