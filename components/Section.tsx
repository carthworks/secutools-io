import { ReactNode } from "react"

export default function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
return (
<section className="space-y-4">
<div>
<h2 className="text-xl font-semibold text-slate-800">{title}</h2>
{subtitle ? <p className="text-slate-600 text-sm mt-1">{subtitle}</p> : null}
</div>
<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">{children}</div>
</section>
)
}