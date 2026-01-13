// VaughnSterling.com - Personal Brand & Freelance Services Data

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
  deliveryTime: string;
}

export interface PortfolioItem {
  id: string;
  name: string;
  url: string;
  description: string;
  image: string;
  stats: {
    label: string;
    value: string;
  }[];
  tags: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  image?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const services: Service[] = [
  {
    id: 's1',
    name: 'Custom AI-Powered Niche Site',
    description: 'Complete affiliate website with AI-generated content, SEO optimization, and automated content pipeline.',
    price: 8000,
    currency: 'ZAR',
    features: [
      'Custom domain setup',
      '20 AI-generated articles',
      'Affiliate integration',
      'SEO optimization',
      'Mobile responsive design',
      'Analytics setup',
      '30-day support'
    ],
    popular: true,
    deliveryTime: '7-10 days'
  },
  {
    id: 's2',
    name: '30 AI-Generated Articles',
    description: 'High-quality, SEO-optimized articles for your existing website. Each article 2,000+ words.',
    price: 5000,
    currency: 'ZAR',
    features: [
      '30 unique articles',
      '2,000+ words each',
      'SEO optimized',
      'Internal linking',
      'Meta descriptions',
      'Featured images',
      'Keyword research'
    ],
    deliveryTime: '5-7 days'
  },
  {
    id: 's3',
    name: 'Full Automation Setup',
    description: 'Complete content automation system. AI generates and publishes content on autopilot.',
    price: 15000,
    currency: 'ZAR',
    features: [
      'AI content pipeline',
      'Automated publishing',
      'Social media integration',
      'Email automation',
      'Analytics dashboard',
      'Training & documentation',
      '60-day support'
    ],
    popular: true,
    deliveryTime: '14-21 days'
  },
  {
    id: 's4',
    name: 'Strategy Consulting (1 Hour)',
    description: 'One-on-one consultation on affiliate marketing, content strategy, or digital nomad lifestyle.',
    price: 800,
    currency: 'ZAR',
    features: [
      '60-minute video call',
      'Screen sharing',
      'Action plan',
      'Follow-up email',
      'Resource list'
    ],
    deliveryTime: 'Within 48 hours'
  }
];

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'p1',
    name: 'SwankyBoyz.com',
    url: 'https://swankyboyz.com',
    description: 'Men\'s lifestyle affiliate site with automated content generation and premium product reviews.',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130312934_c2528f4b.jpg',
    stats: [
      { label: 'Monthly Traffic', value: '5,000+' },
      { label: 'Articles', value: '50+' },
      { label: 'Products', value: '100+' }
    ],
    tags: ['Affiliate', 'AI Content', 'E-commerce']
  },
  {
    id: 'p2',
    name: 'VaughnSterlingTours.com',
    url: 'https://vaughnsterlingtours.com',
    description: 'Personal travel blog documenting my journey from South Africa to Southeast Asia.',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130367063_f1c4de4b.png',
    stats: [
      { label: 'Monthly Readers', value: '3,000+' },
      { label: 'Countries Covered', value: '10+' },
      { label: 'Email Subscribers', value: '500+' }
    ],
    tags: ['Travel', 'Personal Brand', 'Affiliate']
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Coming Soon',
    company: 'Your Company',
    role: 'Your Role',
    content: 'Your testimonial could be here! Be one of my first clients and get featured on my portfolio.',
    rating: 5
  }
];

export const faqs: FAQ[] = [
  {
    id: 'f1',
    question: 'How does AI content generation work?',
    answer: 'I use advanced AI models combined with human editing to create high-quality, unique content. Each article goes through keyword research, AI generation, and manual review to ensure quality and accuracy.'
  },
  {
    id: 'f2',
    question: 'What\'s included in the niche site package?',
    answer: 'You get a complete, ready-to-monetize website including domain setup, hosting configuration, 20 SEO-optimized articles, affiliate link integration, and 30 days of support. Everything you need to start earning.'
  },
  {
    id: 'f3',
    question: 'How long until I see results?',
    answer: 'SEO typically takes 3-6 months to show significant results. However, you\'ll have a fully functional site generating content from day one. Some clients see their first affiliate commissions within the first month.'
  },
  {
    id: 'f4',
    question: 'Do you offer payment plans?',
    answer: 'Yes! For larger projects, I offer 50% upfront and 50% on completion. For the Full Automation Setup, we can discuss a 3-payment plan.'
  },
  {
    id: 'f5',
    question: 'What if I\'m not satisfied?',
    answer: 'I offer unlimited revisions until you\'re happy with the work. If we can\'t reach an agreement, I provide a partial refund based on work completed. Your satisfaction is my priority.'
  },
  {
    id: 'f6',
    question: 'Can you work with existing websites?',
    answer: 'Absolutely! I can add AI content generation to your existing site, optimize your current content, or build new sections. Let\'s discuss your specific needs.'
  }
];

export const stats = [
  { label: 'Sites Built', value: '2+' },
  { label: 'Articles Generated', value: '100+' },
  { label: 'Happy Clients', value: '5+' },
  { label: 'Countries Reached', value: '15+' }
];

export const socialLinks = [
  { name: 'Twitter', url: 'https://twitter.com/vaughnsterling', icon: 'twitter' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/vaughnsterling', icon: 'linkedin' },
  { name: 'GitHub', url: 'https://github.com/vaughnsterling', icon: 'github' },
  { name: 'Email', url: 'mailto:hello@vaughnsterling.com', icon: 'mail' }
];

export const aboutContent = {
  headline: 'Building Automated Income Systems',
  subheadline: 'From South Africa to Southeast Asia',
  bio: `I'm Vaughn Sterling, a digital entrepreneur on a mission. Currently based in South Africa, I'm building location-independent income streams to fund my relocation to Thailand.

My approach is simple: use AI and automation to create valuable content at scale, monetize through affiliate marketing, and help others do the same.

I believe in transparency. I share my journey openly—the wins, the losses, the real numbers. Because if I can do this starting from near zero, so can you.

Whether you need a complete niche site, content for your existing platform, or strategic guidance on building online income, I'm here to help.`,
  headshot: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130421721_16c77169.jpg'
};
