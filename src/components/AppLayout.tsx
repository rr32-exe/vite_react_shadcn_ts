import React, { useState } from 'react';
import SwankyBoyz from './sites/SwankyBoyz';
import VaughnSterlingTours from './sites/VaughnSterlingTours';
import VaughnSterling from './sites/VaughnSterling';
import { Globe, ShoppingBag, Plane, User, ChevronDown, ExternalLink, X } from 'lucide-react';

type SiteType = 'swankyboyz' | 'vaughnsterlingtours' | 'vaughnsterling';

// Detect site from hostname
const detectSite = (): SiteType => {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('swankyboyz')) return 'swankyboyz';
  if (host.includes('vaughnsterlingtours')) return 'vaughnsterlingtours';
  if (host.includes('vaughnsterling') && !host.includes('tours')) return 'vaughnsterling';
  // Default for localhost/development
  return 'vaughnsterling';
};

// Check if we're in production (on a real domain)
const isProduction = (): boolean => {
  const host = window.location.hostname.toLowerCase();
  return host.includes('swankyboyz.com') || 
         host.includes('vaughnsterlingtours.com') || 
         host.includes('vaughnsterling.com') ||
         host.includes('.pages.dev') ||
         host.includes('.workers.dev');
};

const AppLayout: React.FC = () => {
  const detectedSite = detectSite();
  const inProduction = isProduction();
  
  const [activeSite, setActiveSite] = useState<SiteType>(detectedSite);
  const [showSiteSelector, setShowSiteSelector] = useState(false);

  const sites = [
    {
      id: 'swankyboyz' as SiteType,
      name: 'SwankyBoyz.com',
      description: "Men's lifestyle affiliate site with premium product reviews",
      icon: ShoppingBag,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-zinc-950',
      domain: 'swankyboyz.com'
    },
    {
      id: 'vaughnsterlingtours' as SiteType,
      name: 'VaughnSterlingTours.com',
      description: 'Travel & digital nomad content documenting my relocation journey',
      icon: Plane,
      color: 'from-sky-500 to-emerald-500',
      bgColor: 'bg-slate-50',
      domain: 'vaughnsterlingtours.com'
    },
    {
      id: 'vaughnsterling' as SiteType,
      name: 'VaughnSterling.com',
      description: 'Personal brand + freelance services landing page',
      icon: User,
      color: 'from-blue-900 to-teal-500',
      bgColor: 'bg-white',
      domain: 'vaughnsterling.com'
    }
  ];

  const currentSite = sites.find(s => s.id === activeSite)!;

  // In production, render the site directly without preview UI
  if (inProduction) {
    return (
      <div className="min-h-screen">
        {activeSite === 'swankyboyz' && <SwankyBoyz />}
        {activeSite === 'vaughnsterlingtours' && <VaughnSterlingTours />}
        {activeSite === 'vaughnsterling' && <VaughnSterling />}
      </div>
    );
  }

  // Development mode: show preview UI with site selector
  return (
    <div className="min-h-screen">
      {/* Site Selector Bar - Development Only */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300 text-sm font-medium hidden sm:inline">Dev Preview:</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSiteSelector(!showSiteSelector)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <currentSite.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{currentSite.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSiteSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showSiteSelector && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
                  {sites.map(site => (
                    <button
                      key={site.id}
                      onClick={() => {
                        setActiveSite(site.id);
                        setShowSiteSelector(false);
                      }}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-slate-700/50 transition-colors text-left ${
                        activeSite === site.id ? 'bg-slate-700/50' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${site.color} flex items-center justify-center flex-shrink-0`}>
                        <site.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{site.name}</span>
                          {activeSite === site.id && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mt-0.5">{site.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={`https://${currentSite.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
            >
              {currentSite.domain} <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="flex gap-1">
              {sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => setActiveSite(site.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    activeSite === site.id 
                      ? `bg-gradient-to-br ${site.color}` 
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={site.name}
                >
                  <site.icon className={`w-4 h-4 ${activeSite === site.id ? 'text-white' : 'text-slate-400'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Site Content */}
      <div className="pt-14">
        {activeSite === 'swankyboyz' && <SwankyBoyz />}
        {activeSite === 'vaughnsterlingtours' && <VaughnSterlingTours />}
        {activeSite === 'vaughnsterling' && <VaughnSterling />}
      </div>

      {/* Quick Info Panel */}
      <div className="fixed bottom-4 right-4 z-[100]">
        <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentSite.color} flex items-center justify-center`}>
              <currentSite.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{currentSite.name}</p>
              <p className="text-slate-400 text-xs">Preview Mode</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-emerald-400">Ready to Deploy</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Framework:</span>
              <span className="text-white">React + Tailwind</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Hosting:</span>
              <span className="text-white">Cloudflare Pages</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-slate-500 text-xs">
              Switch between sites using the dropdown above or the quick buttons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
