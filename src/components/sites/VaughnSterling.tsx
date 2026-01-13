import React, { useState, useEffect } from 'react';
import { services, portfolioItems, faqs, stats, aboutContent, socialLinks } from '@/data/vaughnsterling';
import { useContact } from '@/hooks/useContact';
import { useCheckout } from '@/hooks/useCheckout';
import { Check, ChevronDown, ChevronUp, Mail, ExternalLink, Calendar, ArrowRight, Zap, Twitter, Linkedin, Github, Send, Clock, Globe, TrendingUp, Loader2, CreditCard, X, Shield, CheckCircle } from 'lucide-react';

const VaughnSterling: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', service: '' });
  const { submit, loading: contactLoading, success: formSubmitted } = useContact();
  const { createCheckout, loading: checkoutLoading, error: checkoutError } = useCheckout();
  
  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', notes: '' });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  // Check URL params for payment status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('payment') === 'cancelled') {
      setPaymentCancelled(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      await submit({ ...formData, site: 'vaughnsterling' });
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !checkoutForm.name || !checkoutForm.email) return;

    await createCheckout({
      serviceId: selectedService.id,
      customerName: checkoutForm.name,
      customerEmail: checkoutForm.email,
      notes: checkoutForm.notes
    });
  };

  const openCheckoutModal = (service: typeof services[0]) => {
    setSelectedService(service);
    setCheckoutForm({ name: '', email: '', notes: '' });
    setShowCheckoutModal(true);
  };

  const iconMap: Record<string, React.ReactNode> = {
    twitter: <Twitter className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />,
    github: <Github className="w-5 h-5" />,
    mail: <Mail className="w-5 h-5" />
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-emerald-500 text-white py-4 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">Payment Successful!</p>
                <p className="text-sm text-emerald-100">Thank you for your deposit. I'll be in touch within 24 hours to get started.</p>
              </div>
            </div>
            <button onClick={() => setPaymentSuccess(false)} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Cancelled Banner */}
      {paymentCancelled && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-amber-500 text-white py-4 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <X className="w-6 h-6" />
              <div>
                <p className="font-semibold">Payment Cancelled</p>
                <p className="text-sm text-amber-100">No worries! Feel free to reach out if you have any questions.</p>
              </div>
            </div>
            <button onClick={() => setPaymentCancelled(false)} className="text-amber-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky ${paymentSuccess || paymentCancelled ? 'top-28' : 'top-14'} z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 transition-all`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-teal-500 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #14b8a6 100%)' }}>
              <span className="text-white font-black text-lg">VS</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Vaughn Sterling</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900">Services</a>
            <a href="#portfolio" className="text-sm font-medium text-slate-600 hover:text-slate-900">Portfolio</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900">About</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900">FAQ</a>
          </nav>

          <a 
            href="#contact"
            className="bg-gradient-to-r from-blue-900 to-teal-500 hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-opacity"
          >
            Hire Me
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
                <Zap className="w-4 h-4" />
                Available for new projects
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                I Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-teal-500">Automated Income</span> Systems
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                AI-powered niche sites, automated content pipelines, and affiliate marketing systems. 
                From South Africa to Southeast Asia — building location-independent income.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#services"
                  className="bg-gradient-to-r from-blue-900 to-teal-500 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  View Services <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#portfolio"
                  className="bg-white text-slate-700 font-bold px-8 py-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  See My Work
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto">
                <img 
                  src={aboutContent.headshot}
                  alt="Vaughn Sterling"
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">100+</p>
                      <p className="text-slate-500 text-sm">Articles Generated</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">15+</p>
                      <p className="text-slate-500 text-sm">Countries Reached</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From complete niche sites to content automation — everything you need to build passive income online.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm">
              <Shield className="w-4 h-4" />
              Secure payments via Stripe • 50% deposit to start
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {services.map(service => (
              <div 
                key={service.id} 
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all hover:shadow-xl ${
                  service.popular ? 'border-teal-500 shadow-lg' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-900 to-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{service.name}</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {service.deliveryTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-900">R{service.price.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">{service.currency}</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {/* Deposit info */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">50% Deposit to Start:</span>
                    <span className="font-bold text-slate-900">R{(service.price / 2).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => openCheckoutModal(service)}
                    className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      service.popular 
                        ? 'bg-gradient-to-r from-blue-900 to-teal-500 text-white hover:opacity-90' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Pay Deposit
                  </button>
                  <a 
                    href="#contact"
                    onClick={() => setFormData(prev => ({ ...prev, service: service.name }))}
                    className="px-4 py-3 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Inquire
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Portfolio</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Real projects, real results. Here's what I've built.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {portfolioItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium"
                    >
                      Visit <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-slate-600 mb-4">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                    {item.stats.map((stat, i) => (
                      <div key={i} className="text-center">
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                        <p className="text-slate-500 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-1">
              <img 
                src={aboutContent.headshot}
                alt="Vaughn Sterling"
                className="w-full aspect-square object-cover rounded-2xl shadow-lg"
              />
              <div className="flex justify-center gap-3 mt-6">
                {socialLinks.map(link => (
                  <a 
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {iconMap[link.icon]}
                  </a>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{aboutContent.headline}</h2>
              <p className="text-teal-600 font-medium mb-6">{aboutContent.subheadline}</p>
              <div className="prose prose-slate">
                {aboutContent.bio.split('\n\n').map((para, i) => (
                  <p key={i} className="text-slate-600 mb-4">{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Everything you need to know before we work together.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map(faq => (
              <div 
                key={faq.id} 
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Let's Work Together</h2>
            <p className="text-slate-300">Ready to build your automated income system? Get in touch.</p>
          </div>
          
          {formSubmitted ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-slate-300">I'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="John Smith"
                    required
                    disabled={contactLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="john@example.com"
                    required
                    disabled={contactLoading}
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Service Interested In</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={contactLoading}
                >
                  <option value="">Select a service...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} - R{s.price.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Tell me about your project..."
                  required
                  disabled={contactLoading}
                />
              </div>
              <button 
                type="submit"
                disabled={contactLoading}
                className="w-full bg-gradient-to-r from-blue-900 to-teal-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Message</>}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-400 mb-4">Or book a call directly:</p>
            <a 
              href="https://calendly.com/vaughnsterling"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Calendar className="w-5 h-5" /> Schedule on Calendly
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">VS</span>
              </div>
              <span className="font-bold text-white">Vaughn Sterling</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              © 2026 Vaughn Sterling. Building the future, one automated system at a time.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(link => (
                <a 
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  {iconMap[link.icon]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {showCheckoutModal && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Checkout</h3>
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Service Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-slate-900 mb-2">{selectedService.name}</h4>
                <p className="text-sm text-slate-600 mb-4">{selectedService.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Price:</span>
                    <span className="font-medium text-slate-900">R{selectedService.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Deposit (50%):</span>
                    <span className="font-bold">R{(selectedService.price / 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Due on completion:</span>
                    <span>R{(selectedService.price / 2).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="John Smith"
                      required
                      disabled={checkoutLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="john@example.com"
                      required
                      disabled={checkoutLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Notes (Optional)</label>
                    <textarea
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Any specific requirements or details..."
                      disabled={checkoutLoading}
                    />
                  </div>
                </div>

                {checkoutError && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
                    {checkoutError}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full bg-gradient-to-r from-blue-900 to-teal-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay R{(selectedService.price / 2).toLocaleString()} Deposit
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Shield className="w-4 h-4" />
                  Secure payment powered by Stripe
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaughnSterling;
