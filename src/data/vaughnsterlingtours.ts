// VaughnSterlingTours.com - Travel & Digital Nomad Data

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  costPerMonth: number;
  visaInfo: string;
  highlights: string[];
  bookingLink: string;
  featured?: boolean;
}

export interface TravelArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image: string;
  readTime: number;
  publishDate: string;
  featured?: boolean;
}

export interface TravelGear {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
  affiliateLink: string;
}

export interface JourneyMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
}

export const destinations: Destination[] = [
  {
    id: 'd1',
    name: 'Chiang Mai',
    country: 'Thailand',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130389734_79536a4e.png',
    costPerMonth: 800,
    visaInfo: '60-day visa on arrival, extendable to 90 days',
    highlights: ['Digital nomad hub', 'Affordable coworking', 'Amazing food scene', 'Mountain temples'],
    bookingLink: 'https://www.booking.com/city/th/chiang-mai.html?aid=YOUR_BOOKING_ID',
    featured: true
  },
  {
    id: 'd2',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130391190_347e04b0.jpg',
    costPerMonth: 700,
    visaInfo: 'E-visa available, 90-day stay',
    highlights: ['Lowest cost of living', 'Fast internet', 'Vibrant nightlife', 'French colonial charm'],
    bookingLink: 'https://www.booking.com/city/vn/ho-chi-minh-city.html?aid=YOUR_BOOKING_ID',
    featured: true
  },
  {
    id: 'd3',
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130397583_4d0df20b.png',
    costPerMonth: 1200,
    visaInfo: '30-day visa on arrival, B211A for longer stays',
    highlights: ['Beach lifestyle', 'Yoga & wellness', 'Stunning rice terraces', 'Expat community'],
    bookingLink: 'https://www.booking.com/region/id/bali.html?aid=YOUR_BOOKING_ID'
  },
  {
    id: 'd4',
    name: 'Bangkok',
    country: 'Thailand',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130387468_2e7dc168.jpg',
    costPerMonth: 1000,
    visaInfo: '60-day visa on arrival, DTV visa for nomads',
    highlights: ['World-class malls', 'Street food paradise', 'Modern infrastructure', 'Nightlife'],
    bookingLink: 'https://www.booking.com/city/th/bangkok.html?aid=YOUR_BOOKING_ID'
  },
  {
    id: 'd5',
    name: 'Da Nang',
    country: 'Vietnam',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130402153_08f9ef7a.png',
    costPerMonth: 600,
    visaInfo: 'E-visa available, 90-day stay',
    highlights: ['Beach city', 'Growing tech scene', 'Marble Mountains', 'Best value in Asia'],
    bookingLink: 'https://www.booking.com/city/vn/danang.html?aid=YOUR_BOOKING_ID',
    featured: true
  },
  {
    id: 'd6',
    name: 'Phuket',
    country: 'Thailand',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130395216_a53df540.jpg',
    costPerMonth: 1100,
    visaInfo: '60-day visa on arrival, extendable',
    highlights: ['Island hopping', 'Diving paradise', 'Beach clubs', 'Thai boxing'],
    bookingLink: 'https://www.booking.com/region/th/phuket.html?aid=YOUR_BOOKING_ID'
  }
];

export const travelArticles: TravelArticle[] = [
  {
    id: 'ta1',
    title: 'How I\'m Escaping South Africa with Zero Savings',
    slug: 'escaping-south-africa-zero-savings',
    excerpt: 'The raw, unfiltered truth about my journey from broke in Johannesburg to building a location-independent income.',
    category: 'My Journey',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130367063_f1c4de4b.png',
    readTime: 12,
    publishDate: '2026-01-11',
    featured: true
  },
  {
    id: 'ta2',
    title: 'Living in Thailand on $500/Month: Is It Possible?',
    slug: 'living-thailand-500-month',
    excerpt: 'Breaking down every expense and showing you exactly how to stretch your budget in the Land of Smiles.',
    category: 'Budget Living',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130389734_79536a4e.png',
    readTime: 10,
    publishDate: '2026-01-10',
    featured: true
  },
  {
    id: 'ta3',
    title: 'Complete Digital Nomad Visa Guide 2026',
    slug: 'digital-nomad-visa-guide-2026',
    excerpt: 'Every country offering digital nomad visas, requirements, costs, and my personal recommendations.',
    category: 'Visas',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130391190_347e04b0.jpg',
    readTime: 15,
    publishDate: '2026-01-09'
  },
  {
    id: 'ta4',
    title: 'South African Expat Guide: Everything You Need to Know',
    slug: 'south-african-expat-guide',
    excerpt: 'From tax implications to banking, here\'s what every South African needs to know before leaving.',
    category: 'Expat Life',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130397583_4d0df20b.png',
    readTime: 14,
    publishDate: '2026-01-08'
  },
  {
    id: 'ta5',
    title: 'Remote Work Setup for Under R5,000',
    slug: 'remote-work-setup-budget',
    excerpt: 'The exact gear I use to work from anywhere. Laptop, accessories, and software that won\'t break the bank.',
    category: 'Remote Work',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130387468_2e7dc168.jpg',
    readTime: 8,
    publishDate: '2026-01-07'
  },
  {
    id: 'ta6',
    title: 'Vietnam vs Thailand: Where Should You Move?',
    slug: 'vietnam-vs-thailand-comparison',
    excerpt: 'A detailed comparison of cost, lifestyle, visas, and opportunities in Southeast Asia\'s top nomad destinations.',
    category: 'Destinations',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130402153_08f9ef7a.png',
    readTime: 11,
    publishDate: '2026-01-06'
  }
];

export const travelGear: TravelGear[] = [
  {
    id: 'tg1',
    name: 'Osprey Farpoint 40',
    category: 'Backpacks',
    price: 185,
    rating: 4.9,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130334551_de791d1a.jpg',
    description: 'The perfect carry-on backpack for digital nomads. Fits everything, goes everywhere.',
    affiliateLink: 'https://amazon.com/dp/B08XYZ?tag=vaughntours-20'
  },
  {
    id: 'tg2',
    name: 'Airalo eSIM',
    category: 'Connectivity',
    price: 15,
    rating: 4.7,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130346063_24026a21.png',
    description: 'Stay connected in 200+ countries without swapping SIM cards. Essential for travelers.',
    affiliateLink: 'https://airalo.com?ref=vaughnsterling'
  },
  {
    id: 'tg3',
    name: 'SafetyWing Insurance',
    category: 'Insurance',
    price: 45,
    rating: 4.8,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130342635_9579887e.png',
    description: 'Nomad insurance that actually works. Coverage in 180+ countries, pay monthly.',
    affiliateLink: 'https://safetywing.com?ref=vaughnsterling'
  }
];

export const journeyMilestones: JourneyMilestone[] = [
  {
    id: 'm1',
    date: '2025-10-01',
    title: 'The Decision',
    description: 'Made the commitment to leave South Africa and build a location-independent life.',
    status: 'completed'
  },
  {
    id: 'm2',
    date: '2025-11-15',
    title: 'First Client',
    description: 'Landed my first freelance client through cold outreach. R3,000 project.',
    status: 'completed'
  },
  {
    id: 'm3',
    date: '2025-12-20',
    title: 'Sites Launched',
    description: 'SwankyBoyz.com and VaughnSterlingTours.com go live. The journey begins.',
    status: 'completed'
  },
  {
    id: 'm4',
    date: '2026-01-11',
    title: 'Building Momentum',
    description: 'Growing traffic, landing clients, saving for the ticket.',
    status: 'current'
  },
  {
    id: 'm5',
    date: '2026-03-15',
    title: 'Flight to Thailand',
    description: 'One-way ticket to Chiang Mai. The adventure truly begins.',
    status: 'upcoming'
  },
  {
    id: 'm6',
    date: '2026-06-01',
    title: 'R25,000/Month Goal',
    description: 'Sustainable income from affiliates + freelance. Location independent.',
    status: 'upcoming'
  }
];

export const affiliatePrograms = [
  { name: 'Booking.com', commission: '25%', category: 'Accommodation' },
  { name: 'Agoda', commission: '4-7%', category: 'Accommodation' },
  { name: 'GetYourGuide', commission: '8%', category: 'Tours' },
  { name: 'SafetyWing', commission: '10%', category: 'Insurance' },
  { name: 'Airalo', commission: '10%', category: 'eSIM' },
  { name: 'Amazon', commission: '3-10%', category: 'Gear' }
];

export const costComparison = [
  { category: 'Rent (1BR)', southAfrica: 8000, thailand: 6000, vietnam: 4500 },
  { category: 'Food', southAfrica: 4000, thailand: 3000, vietnam: 2500 },
  { category: 'Transport', southAfrica: 2500, thailand: 1500, vietnam: 1000 },
  { category: 'Internet', southAfrica: 800, thailand: 500, vietnam: 300 },
  { category: 'Entertainment', southAfrica: 2000, thailand: 2000, vietnam: 1500 },
  { category: 'Total', southAfrica: 17300, thailand: 13000, vietnam: 9800 }
];
