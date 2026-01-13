import React, { useState } from 'react';
import { products, articles, categories, Product } from '@/data/swankyboyz';
import { useNewsletter } from '@/hooks/useNewsletter';
import { Search, Star, ChevronRight, Mail, ExternalLink, Filter, X, ShoppingBag, Clock, TrendingUp, Loader2 } from 'lucide-react';

const SwankyBoyz: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [email, setEmail] = useState('');
  const { subscribe, loading: newsletterLoading, success: subscribed } = useNewsletter();

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter(p => p.featured);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const success = await subscribe(email, 'swankyboyz', '10 Budget Luxury Finds');
      if (success) {
        setTimeout(() => setShowNewsletter(false), 2000);
      }
    }
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-zinc-900 rounded-xl overflow-hidden group hover:ring-2 hover:ring-amber-500/50 transition-all duration-300">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.originalPrice && (
          <div className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded">
            SAVE {Math.round((1 - product.price / product.originalPrice) * 100)}%
          </div>
        )}
        {product.featured && (
          <div className="absolute top-3 right-3 bg-zinc-800/90 text-amber-400 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Featured
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} 
            />
          ))}
          <span className="text-zinc-400 text-xs ml-1">({product.reviews.toLocaleString()})</span>
        </div>
        <h3 className="text-white font-semibold mb-1 group-hover:text-amber-400 transition-colors">{product.name}</h3>
        <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-amber-400 font-bold text-lg">${product.price}</span>
            {product.originalPrice && (
              <span className="text-zinc-500 text-sm line-through">${product.originalPrice}</span>
            )}
          </div>
          <a 
            href={product.affiliateLink}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
          >
            View Deal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xl">S</span>
            </div>
            <span className="text-xl font-bold">Swanky<span className="text-amber-400">Boyz</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {categories.slice(1).map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'text-amber-400' : 'text-zinc-400 hover:text-white'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
            <button 
              onClick={() => setShowNewsletter(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Subscribe
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130312934_c2528f4b.jpg"
            alt="Luxury accessories"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-400 text-sm font-medium">New: 2026 Watch Guide Released</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Elevate Your <span className="text-amber-400">Style</span> Without Breaking the Bank
            </h1>
            <p className="text-xl text-zinc-300 mb-8">
              Curated reviews of premium men's products. Luxury quality at accessible prices. 
              No fluff, just honest recommendations.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setSelectedCategory('watches')}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                Shop Watches <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
              >
                Read Guides
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Featured Picks</h2>
            <p className="text-zinc-400">Hand-selected products we stand behind</p>
          </div>
          <button 
            onClick={() => setSelectedCategory('all')}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Category Filter & All Products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Filter className="w-5 h-5 text-zinc-400" />
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-amber-500 text-black' 
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 flex items-center gap-2"
            >
              "{searchQuery}" <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-zinc-400">Try adjusting your search or filter</p>
          </div>
        )}
      </section>

      {/* Articles Section */}
      <section id="articles" className="bg-zinc-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Latest Guides</h2>
              <p className="text-zinc-400">In-depth reviews and buying guides</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <article key={article.id} className="bg-zinc-900 rounded-xl overflow-hidden group hover:ring-2 hover:ring-amber-500/50 transition-all cursor-pointer">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">{article.category}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500 text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {article.readTime} min read
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-amber-400 transition-colors">{article.title}</h3>
                  <p className="text-zinc-400 text-sm line-clamp-2">{article.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Get the Inside Track</h2>
          <p className="text-zinc-300 mb-6 max-w-xl mx-auto">
            Join 5,000+ men who get our weekly picks: exclusive deals, new product drops, and style tips delivered to your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
              disabled={newsletterLoading}
            />
            <button 
              type="submit"
              disabled={newsletterLoading}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {newsletterLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Subscribe Free'}
            </button>
          </form>
          <p className="text-zinc-500 text-sm mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Categories</h4>
              <ul className="space-y-2">
                {categories.slice(1).map(cat => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-zinc-400 hover:text-amber-400 transition-colors text-sm"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#articles" className="hover:text-amber-400 transition-colors">Buying Guides</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Product Reviews</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Style Tips</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Deal Alerts</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-amber-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Advertise</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Affiliate Disclosure</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-black">S</span>
              </div>
              <span className="font-bold">SwankyBoyz</span>
            </div>
            <p className="text-zinc-500 text-sm text-center">
              © 2026 SwankyBoyz. All rights reserved. We may earn commission from links on this page.
            </p>
          </div>
        </div>
      </footer>

      {/* Newsletter Modal */}
      {showNewsletter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setShowNewsletter(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            {subscribed ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">You're In!</h3>
                <p className="text-zinc-400">Check your inbox for a welcome gift.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Get 10 Budget Luxury Finds</h3>
                  <p className="text-zinc-400 text-sm">Free guide + weekly deals delivered to your inbox</p>
                </div>
                <form onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                    disabled={newsletterLoading}
                  />
                  <button 
                    type="submit"
                    disabled={newsletterLoading}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {newsletterLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Free Guide'}
                  </button>
                </form>
                <p className="text-zinc-500 text-xs text-center mt-4">No spam. Unsubscribe anytime.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwankyBoyz;
