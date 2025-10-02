"use client"
import { useState } from "react"
import Section from "@/components/Section"

export default function ContactPage() {
const [formData, setFormData] = useState({ name: "", email: "", message: "" })

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault()
alert("Thank you for your message! We will get back to you soon.")
setFormData({ name: "", email: "", message: "" })
}

return (
<div className="space-y-8">
<section className="text-center space-y-4">
<h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">Contact Us</h1>
<p className="text-slate-600 max-w-2xl mx-auto">Get in touch with our team for support, feedback, or collaboration opportunities.</p>
</section>

<div className="grid lg:grid-cols-2 gap-8">
<Section title="Send us a Message" subtitle="We would love to hear from you">
<form onSubmit={handleSubmit} className="space-y-4">
<div>
<label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
<input 
type="text" 
value={formData.name}
onChange={(e) => setFormData({...formData, name: e.target.value})}
className="w-full bg-white border border-slate-300 rounded p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
required 
/>
</div>
<div>
<label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
<input 
type="email" 
value={formData.email}
onChange={(e) => setFormData({...formData, email: e.target.value})}
className="w-full bg-white border border-slate-300 rounded p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
required 
/>
</div>
<div>
<label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
<textarea 
value={formData.message}
onChange={(e) => setFormData({...formData, message: e.target.value})}
rows={4}
className="w-full bg-white border border-slate-300 rounded p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
required
></textarea>
</div>
<button 
type="submit"
className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
>
Send Message
</button>
</form>
</Section>

<div className="space-y-6">
<Section title="Get in Touch" subtitle="Multiple ways to reach us">
<div className="space-y-4">
<div>
<h4 className="font-semibold text-slate-800 mb-1"> Email</h4>
<p className="text-slate-600">tkarthikeyan@gmail.com</p>
</div>
<div>
<h4 className="font-semibold text-slate-800 mb-1"> GitHub</h4>
<p className="text-slate-600">github.com/carthworks</p>
</div>
<div>
<h4 className="font-semibold text-slate-800 mb-1"> Discord</h4>
<p className="text-slate-600">Join our community server</p>
</div>
</div>
</Section>

<Section title="Support Hours" subtitle="When we are available">
<div className="text-sm text-slate-600">
<p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EST</p>
<p><strong>Weekend:</strong> Community support only</p>
<p><strong>Response Time:</strong> Within 24 hours</p>
</div>
</Section>
</div>
</div>
</div>
)
}
