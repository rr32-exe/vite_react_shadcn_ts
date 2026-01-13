import React, { useState } from 'react';
import { destinations, travelArticles, travelGear, journeyMilestones, costComparison } from '@/data/vaughnsterlingtours';
import { useNewsletter } from '@/hooks/useNewsletter';
import { MapPin, Calendar, Plane, Clock, ChevronRight, Mail, ExternalLink, Star, CheckCircle, Circle, ArrowRight, Globe, Shield, Loader2 } from 'lucide-react';

const VaughnSterlingTours: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'destinations' | 'articles' | 'gear'>('destinations');
  const [budgetInput, setBudgetInput] = useState(15000);
  const [email, setEmail] = useState('');
  const { subscribe, loading: newsletterLoading, success: subscribed } = useNewsletter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await subscribe(email, 'vaughnsterlingtours', 'Relocation Checklist');
    }
  };

  const getAffordableDestinations = (budget: number) => {
    return destinations.filter(d => d.costPerMonth * 18 <= budget).sort((a, b) => a.costPerMonth - b.costPerMonth);
  };

  const daysUntilThailand = Math.ceil((new Date('2026-03-15').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">Vaughn Sterling</span>
              <span className="text-sky-500 font-bold">Tours</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setSelectedTab('destinations')} className={`text-sm font-medium ${selectedTab === 'destinations' ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'}`}>Destinations</button>
            <button onClick={() => setSelectedTab('articles')} className={`text-sm font-medium ${selectedTab === 'articles' ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'}`}>Blog</button>
            <button onClick={() => setSelectedTab('gear')} className={`text-sm font-medium ${selectedTab === 'gear' ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'}`}>Gear</button>
            <a href="#calculator" className="text-sm font-medium text-slate-600 hover:text-slate-900">Budget Calculator</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <Calendar className="w-4 h-4" />
              {daysUntilThailand} days to Thailand
            </div>
            <button 
              onClick={() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Follow Journey
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130367063_f1c4de4b.png"
            alt="Tropical paradise"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-white/90 text-sm">Currently: South Africa → Thailand in {daysUntilThailand} days</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              From <span className="text-orange-400">Zero</span> to <span className="text-emerald-400">Digital Nomad</span>
            </h1>
            <p className="text-xl text-slate-200 mb-8">
              Follow my raw, unfiltered journey from broke in South Africa to living the dream in Southeast Asia. 
              Real numbers. Real struggles. Real solutions.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setSelectedTab('articles')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                Read My Story <ChevronRight className="w-5 h-5" />
              </button>
              <a 
                href="#calculator"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold px-8 py-3 rounded-lg border border-white/20 transition-colors"
              >
                Budget Calculator
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">My Journey Timeline</h2>
          <p className="text-slate-600 text-center mb-12">From decision to destination</p>
          
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 hidden md:block" />
            <div className="space-y-8">
              {journeyMilestones.map((milestone, index) => (
                <div key={milestone.id} className={`flex flex-col md:flex-row items-center gap-4 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className={`bg-slate-50 rounded-xl p-6 ${milestone.status === 'current' ? 'ring-2 ring-sky-500' : ''}`}>
                      <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{milestone.title}</h3>
                      <p className="text-slate-600 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    {milestone.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-emerald-500 bg-white rounded-full" />
                    ) : milestone.status === 'current' ? (
                      <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    ) : (
                      <Circle className="w-8 h-8 text-slate-300 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            {[
              { id: 'destinations', label: 'Destinations', icon: MapPin },
              { id: 'articles', label: 'Blog', icon: Globe },
              { id: 'gear', label: 'Travel Gear', icon: Shield }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedTab === tab.id 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' 
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Destinations Grid */}
          {selectedTab === 'destinations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map(destination => (
                <div key={destination.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={destination.image} 
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {destination.featured && (
                      <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        TOP PICK
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900">{destination.name}</h3>
                            <p className="text-slate-500 text-sm">{destination.country}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-600 font-bold">${destination.costPerMonth}/mo</p>
                            <p className="text-slate-400 text-xs">avg. cost</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <Plane className="w-4 h-4" />
                      {destination.visaInfo}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {destination.highlights.map((highlight, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{highlight}</span>
                      ))}
                    </div>
                    <a 
                      href={destination.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      Find Hotels <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Articles Grid */}
          {selectedTab === 'articles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelArticles.map(article => (
                <article key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">{article.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {article.readTime} min
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">{article.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{article.excerpt}</p>
                    <button className="text-sky-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Gear Grid */}
          {selectedTab === 'gear' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {travelGear.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all">
                  <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-slate-100">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                    <span className="text-slate-500 text-sm ml-1">{item.rating}</span>
                  </div>
                  <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">{item.category}</span>
                  <h3 className="font-bold text-slate-900 mt-1 mb-2">{item.name}</h3>
                  <p className="text-slate-600 text-sm mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">${item.price}</span>
                    <a 
                      href={item.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      Get It <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Budget Calculator */}
      <section id="calculator" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">Budget Calculator</h2>
          <p className="text-slate-600 text-center mb-12">See where you can live based on your savings</p>
          
          <div className="bg-gradient-to-br from-sky-50 to-emerald-50 rounded-2xl p-8">
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Total Savings (ZAR)</label>
              <input
                type="range"
                min="5000"
                max="100000"
                step="1000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between mt-2">
                <span className="text-slate-500 text-sm">R5,000</span>
                <span className="text-2xl font-bold text-sky-600">R{budgetInput.toLocaleString()}</span>
                <span className="text-slate-500 text-sm">R100,000</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-4">Affordable Destinations (3+ months)</h3>
              {getAffordableDestinations(budgetInput).length > 0 ? (
                <div className="space-y-3">
                  {getAffordableDestinations(budgetInput).map(dest => (
                    <div key={dest.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-medium text-slate-900">{dest.name}, {dest.country}</span>
                          <p className="text-sm text-slate-500">${dest.costPerMonth}/month</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-600 font-bold">{Math.floor(budgetInput / 18 / dest.costPerMonth)} months</span>
                        <p className="text-xs text-slate-500">possible stay</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Save a bit more to unlock destinations!</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Cost Comparison (Monthly in ZAR)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-slate-600 font-medium">Category</th>
                      <th className="text-right py-2 text-slate-600 font-medium">South Africa</th>
                      <th className="text-right py-2 text-emerald-600 font-medium">Thailand</th>
                      <th className="text-right py-2 text-sky-600 font-medium">Vietnam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costComparison.map(row => (
                      <tr key={row.category} className={row.category === 'Total' ? 'font-bold border-t border-slate-200' : ''}>
                        <td className="py-2 text-slate-900">{row.category}</td>
                        <td className="py-2 text-right text-slate-600">R{row.southAfrica.toLocaleString()}</td>
                        <td className="py-2 text-right text-emerald-600">R{row.thailand.toLocaleString()}</td>
                        <td className="py-2 text-right text-sky-600">R{row.vietnam.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-16 bg-gradient-to-br from-sky-600 to-emerald-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Follow My Journey</h2>
          <p className="text-white/80 mb-8">
            Get weekly updates on my progress, budget breakdowns, and tips for your own escape plan. 
            Plus, download my free Relocation Checklist.
          </p>
          {subscribed ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
              <CheckCircle className="w-12 h-12 text-white mx-auto mb-3" />
              <p className="text-white font-semibold">You're on the list! Check your inbox for the checklist.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
                disabled={newsletterLoading}
              />
              <button 
                type="submit"
                disabled={newsletterLoading}
                className="bg-white text-sky-600 font-bold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {newsletterLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Free Checklist'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Destinations</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {destinations.slice(0, 4).map(d => (
                  <li key={d.id}><button onClick={() => setSelectedTab('destinations')} className="hover:text-white transition-colors">{d.name}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => setSelectedTab('articles')} className="hover:text-white transition-colors">Visa Guides</button></li>
                <li><a href="#calculator" className="hover:text-white transition-colors">Budget Tips</a></li>
                <li><button onClick={() => setSelectedTab('articles')} className="hover:text-white transition-colors">Remote Work</button></li>
                <li><button onClick={() => setSelectedTab('gear')} className="hover:text-white transition-colors">Travel Gear</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Affiliates</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://booking.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Booking.com</a></li>
                <li><a href="https://safetywing.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SafetyWing</a></li>
                <li><a href="https://airalo.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Airalo</a></li>
                <li><a href="https://amazon.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Amazon</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Affiliate Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">VaughnSterlingTours</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              © 2026 VaughnSterlingTours. We may earn commission from affiliate links.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VaughnSterlingTours;
