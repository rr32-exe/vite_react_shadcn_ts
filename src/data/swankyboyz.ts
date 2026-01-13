// SwankyBoyz.com - Men's Lifestyle Affiliate Data

export interface Product {
  id: string;
  name: string;
  category: 'watches' | 'grooming' | 'tech' | 'fitness' | 'fashion';
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  pros: string[];
  cons: string[];
  affiliateLink: string;
  featured?: boolean;
}

export interface Article {
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

export const products: Product[] = [
  // Watches
  {
    id: 'w1',
    name: 'Vincero Chrono S',
    category: 'watches',
    price: 169,
    originalPrice: 225,
    rating: 4.8,
    reviews: 2847,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130272999_caea4f5f.png',
    description: 'Italian marble dial with Swiss movement. The perfect entry into luxury timepieces without the luxury price tag.',
    pros: ['Sapphire crystal glass', 'Genuine Italian marble', '5 ATM water resistant'],
    cons: ['Limited color options', 'No automatic movement'],
    affiliateLink: 'https://amazon.com/dp/B08XYZ?tag=swankyboyz-20',
    featured: true
  },
  {
    id: 'w2',
    name: 'MVMT Classic',
    category: 'watches',
    price: 128,
    rating: 4.6,
    reviews: 5621,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130272489_0d5270be.png',
    description: 'Minimalist design that pairs with everything. The watch that launched a thousand Instagram posts.',
    pros: ['Interchangeable straps', 'Minimalist design', 'Affordable luxury'],
    cons: ['Quartz movement only', 'No date function'],
    affiliateLink: 'https://amazon.com/dp/B08ABC?tag=swankyboyz-20'
  },
  {
    id: 'w3',
    name: 'Orient Bambino V2',
    category: 'watches',
    price: 285,
    originalPrice: 350,
    rating: 4.9,
    reviews: 3892,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130267695_e3352afd.jpg',
    description: 'Japanese automatic movement at an unbeatable price. True horological value.',
    pros: ['Automatic movement', 'Domed crystal', 'Exhibition caseback'],
    cons: ['Larger case size', 'No hacking seconds'],
    affiliateLink: 'https://amazon.com/dp/B08DEF?tag=swankyboyz-20',
    featured: true
  },
  {
    id: 'w4',
    name: 'Tissot PRX',
    category: 'watches',
    price: 375,
    rating: 4.7,
    reviews: 1256,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130274405_8a037ea7.jpg',
    description: 'Integrated bracelet design inspired by 70s luxury. Swiss made quality.',
    pros: ['Swiss made', 'Integrated bracelet', '100m water resistant'],
    cons: ['Higher price point', 'Scratches easily'],
    affiliateLink: 'https://amazon.com/dp/B08GHI?tag=swankyboyz-20'
  },
  {
    id: 'w5',
    name: 'Seiko Presage',
    category: 'watches',
    price: 425,
    originalPrice: 495,
    rating: 4.8,
    reviews: 2134,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130269955_6af5f781.jpg',
    description: 'Japanese craftsmanship meets cocktail-inspired dials. A true gentleman\'s watch.',
    pros: ['Automatic movement', 'Stunning dial', 'Hardlex crystal'],
    cons: ['No sapphire crystal', 'Dressy only'],
    affiliateLink: 'https://amazon.com/dp/B08JKL?tag=swankyboyz-20'
  },
  {
    id: 'w6',
    name: 'Citizen Eco-Drive',
    category: 'watches',
    price: 295,
    rating: 4.7,
    reviews: 4521,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130275959_87d316c9.jpg',
    description: 'Solar powered, never needs a battery. The environmentally conscious choice.',
    pros: ['Solar powered', 'Never needs battery', 'Titanium case'],
    cons: ['Needs light exposure', 'Conservative design'],
    affiliateLink: 'https://amazon.com/dp/B08MNO?tag=swankyboyz-20'
  },
  // Grooming
  {
    id: 'g1',
    name: 'Brickell Men\'s Daily Essential',
    category: 'grooming',
    price: 89,
    originalPrice: 110,
    rating: 4.7,
    reviews: 3421,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130291053_aac1e3b3.png',
    description: 'Complete skincare routine in one set. Natural ingredients, visible results.',
    pros: ['Natural ingredients', 'Complete routine', 'Travel friendly'],
    cons: ['Premium price', 'Strong scent'],
    affiliateLink: 'https://amazon.com/dp/B08PQR?tag=swankyboyz-20',
    featured: true
  },
  {
    id: 'g2',
    name: 'Philips Norelco 9000',
    category: 'grooming',
    price: 199,
    originalPrice: 249,
    rating: 4.6,
    reviews: 8932,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130294782_742994c2.png',
    description: 'The closest electric shave you\'ll ever experience. Contour-following technology.',
    pros: ['Wet/dry use', 'Quick charge', 'Quiet operation'],
    cons: ['Expensive heads', 'Learning curve'],
    affiliateLink: 'https://amazon.com/dp/B08STU?tag=swankyboyz-20'
  },
  {
    id: 'g3',
    name: 'Baxter of California Clay Pomade',
    category: 'grooming',
    price: 23,
    rating: 4.8,
    reviews: 5621,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130294740_d988dc87.jpg',
    description: 'Matte finish, strong hold. The styling product every man needs.',
    pros: ['Matte finish', 'Strong hold', 'Water soluble'],
    cons: ['Small container', 'Dries out'],
    affiliateLink: 'https://amazon.com/dp/B08VWX?tag=swankyboyz-20'
  },
  {
    id: 'g4',
    name: 'Jack Black Beard Lube',
    category: 'grooming',
    price: 19,
    rating: 4.9,
    reviews: 7234,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130298711_b359077d.png',
    description: 'Pre-shave oil, shave cream, and skin conditioner in one. Revolutionary formula.',
    pros: ['3-in-1 formula', 'Sensitive skin safe', 'Great scent'],
    cons: ['Goes fast', 'Tube packaging'],
    affiliateLink: 'https://amazon.com/dp/B08YZA?tag=swankyboyz-20'
  },
  // Tech
  {
    id: 't1',
    name: 'Sony WF-1000XM5',
    category: 'tech',
    price: 298,
    rating: 4.8,
    reviews: 4521,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130342635_9579887e.png',
    description: 'Industry-leading noise cancellation in a compact form. Audio perfection.',
    pros: ['Best-in-class ANC', 'Compact design', '8hr battery'],
    cons: ['Premium price', 'No multipoint'],
    affiliateLink: 'https://amazon.com/dp/B08BCD?tag=swankyboyz-20',
    featured: true
  },
  {
    id: 't2',
    name: 'Apple Watch Ultra 2',
    category: 'tech',
    price: 799,
    rating: 4.9,
    reviews: 2341,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130334829_e4a5ef50.jpg',
    description: 'The ultimate smartwatch for the modern man. Adventure ready.',
    pros: ['Titanium case', '36hr battery', 'Dual frequency GPS'],
    cons: ['Expensive', 'iOS only'],
    affiliateLink: 'https://amazon.com/dp/B08EFG?tag=swankyboyz-20'
  },
  {
    id: 't3',
    name: 'Anker 737 Power Bank',
    category: 'tech',
    price: 149,
    originalPrice: 179,
    rating: 4.7,
    reviews: 6234,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130334551_de791d1a.jpg',
    description: '24,000mAh capacity with 140W output. Never run out of power.',
    pros: ['Massive capacity', '140W output', 'Smart display'],
    cons: ['Heavy', 'Large size'],
    affiliateLink: 'https://amazon.com/dp/B08HIJ?tag=swankyboyz-20'
  },
  {
    id: 't4',
    name: 'Bellroy Tech Kit',
    category: 'tech',
    price: 89,
    rating: 4.6,
    reviews: 1892,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130346063_24026a21.png',
    description: 'Premium leather tech organizer. Keep your cables tamed in style.',
    pros: ['Premium leather', 'Organized layout', 'Compact'],
    cons: ['Limited space', 'Pricey'],
    affiliateLink: 'https://amazon.com/dp/B08KLM?tag=swankyboyz-20'
  },
  // Fitness
  {
    id: 'f1',
    name: 'Bowflex SelectTech 552',
    category: 'fitness',
    price: 429,
    originalPrice: 549,
    rating: 4.8,
    reviews: 12453,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130445181_545a9deb.png',
    description: 'Replace 15 sets of weights with one. The home gym essential.',
    pros: ['Space saving', '5-52.5 lbs range', 'Quick adjust'],
    cons: ['Bulky cradle', 'Plastic parts'],
    affiliateLink: 'https://amazon.com/dp/B08NOP?tag=swankyboyz-20',
    featured: true
  },
  {
    id: 'f2',
    name: 'Theragun Prime',
    category: 'fitness',
    price: 299,
    rating: 4.7,
    reviews: 5621,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130442910_415de9c1.png',
    description: 'Professional-grade percussive therapy. Recover like an athlete.',
    pros: ['Quiet operation', '4 attachments', '120min battery'],
    cons: ['Heavy', 'No carrying case'],
    affiliateLink: 'https://amazon.com/dp/B08QRS?tag=swankyboyz-20'
  },
  {
    id: 'f3',
    name: 'Whoop 4.0',
    category: 'fitness',
    price: 239,
    rating: 4.5,
    reviews: 3421,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130449755_ccc450ce.png',
    description: 'The fitness tracker for serious athletes. Data-driven performance.',
    pros: ['Detailed analytics', 'Waterproof', 'No screen distraction'],
    cons: ['Subscription required', 'No display'],
    affiliateLink: 'https://amazon.com/dp/B08TUV?tag=swankyboyz-20'
  },
  // Fashion
  {
    id: 'fa1',
    name: 'Montblanc Meisterstück Wallet',
    category: 'fashion',
    price: 395,
    rating: 4.9,
    reviews: 1234,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130465377_e6ea0707.jpg',
    description: 'The wallet that makes a statement. European leather, timeless design.',
    pros: ['Premium leather', 'Timeless design', 'RFID blocking'],
    cons: ['Expensive', 'Thick when full'],
    affiliateLink: 'https://amazon.com/dp/B08WXY?tag=swankyboyz-20',
    featured: true
  },
  {
    id: 'fa2',
    name: 'Anson Belt & Buckle',
    category: 'fashion',
    price: 89,
    originalPrice: 119,
    rating: 4.8,
    reviews: 8932,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130466864_0c8f656a.jpg',
    description: 'Micro-adjustable belt system. The perfect fit, every time.',
    pros: ['40 fit positions', 'Interchangeable', 'No holes'],
    cons: ['Unique buckle', 'Takes adjustment'],
    affiliateLink: 'https://amazon.com/dp/B08ZAB?tag=swankyboyz-20'
  },
  {
    id: 'fa3',
    name: 'Ray-Ban Clubmaster',
    category: 'fashion',
    price: 178,
    rating: 4.7,
    reviews: 15621,
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130473208_a23e264d.png',
    description: 'The iconic frames that never go out of style. Instant sophistication.',
    pros: ['Timeless design', 'Quality lenses', 'Durable'],
    cons: ['Common style', 'Pricey'],
    affiliateLink: 'https://amazon.com/dp/B08CDE?tag=swankyboyz-20'
  }
];

export const articles: Article[] = [
  {
    id: 'a1',
    title: '10 Affordable Luxury Watches That Look Like $10,000',
    slug: 'affordable-luxury-watches',
    excerpt: 'You don\'t need to spend a fortune to look like a million bucks. These timepieces deliver premium aesthetics at a fraction of the price.',
    category: 'Watches',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130272999_caea4f5f.png',
    readTime: 8,
    publishDate: '2026-01-10',
    featured: true
  },
  {
    id: 'a2',
    title: 'The Complete Men\'s Skincare Routine for 2026',
    slug: 'mens-skincare-routine-2026',
    excerpt: 'Clear skin isn\'t just for women. Here\'s the no-nonsense guide to looking your best without spending hours in the bathroom.',
    category: 'Grooming',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130291053_aac1e3b3.png',
    readTime: 6,
    publishDate: '2026-01-09',
    featured: true
  },
  {
    id: 'a3',
    title: 'Best Wireless Earbuds for Men: Tested & Ranked',
    slug: 'best-wireless-earbuds-men',
    excerpt: 'We tested 15 premium earbuds to find the perfect balance of sound quality, comfort, and style.',
    category: 'Tech',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130342635_9579887e.png',
    readTime: 10,
    publishDate: '2026-01-08'
  },
  {
    id: 'a4',
    title: 'Build Your Home Gym for Under $1,000',
    slug: 'home-gym-under-1000',
    excerpt: 'Skip the gym membership. Here\'s everything you need to build a complete home gym without breaking the bank.',
    category: 'Fitness',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130445181_545a9deb.png',
    readTime: 7,
    publishDate: '2026-01-07'
  },
  {
    id: 'a5',
    title: 'The Gentleman\'s Guide to Leather Accessories',
    slug: 'leather-accessories-guide',
    excerpt: 'From wallets to belts, learn how to spot quality leather and build a collection that lasts decades.',
    category: 'Fashion',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130465377_e6ea0707.jpg',
    readTime: 5,
    publishDate: '2026-01-06'
  },
  {
    id: 'a6',
    title: 'Seiko vs Orient: The Ultimate Budget Watch Showdown',
    slug: 'seiko-vs-orient-comparison',
    excerpt: 'Two Japanese giants battle for the title of best affordable automatic watch. Here\'s our verdict.',
    category: 'Watches',
    image: 'https://d64gsuwffb70l.cloudfront.net/696386662a4c1ba983c3f5f0_1768130269955_6af5f781.jpg',
    readTime: 12,
    publishDate: '2026-01-05'
  }
];

export const categories = [
  { id: 'all', name: 'All Products', icon: 'grid' },
  { id: 'watches', name: 'Watches', icon: 'watch' },
  { id: 'grooming', name: 'Grooming', icon: 'scissors' },
  { id: 'tech', name: 'Tech', icon: 'smartphone' },
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt' }
];
