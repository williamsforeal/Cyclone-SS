export interface ConceptDirection {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface BrandStyle {
  id: string;
  name: string;
  description: string;
}

export interface GeneratedConcept {
  id: string;
  direction: string;
  headline: string;
  bodyText: string;
  cta: string;
  angle: string;
  avatar: string;
}

export interface Avatar {
  id: string;
  name: string;
  archetype: string;
  description: string;
  traits: string[];
  ageRange: string;
  adCount: number;
}

export interface Angle {
  id: string;
  name: string;
  category: string;
  exampleHook: string;
  performance: string;
}

export interface Hook {
  id: string;
  text: string;
  type: string;
  angle: string;
  avatar: string;
}

export interface AspectRatio {
  value: string;
  label: string;
}

export interface ConceptCount {
  value: number;
  label: string;
}

export const mockConceptDirections: ConceptDirection[] = [
  {
    id: "dir-1",
    name: "Bold Claim",
    icon: "megaphone",
    description: "Make a strong product claim that demands attention",
  },
  {
    id: "dir-2",
    name: "Storytelling",
    icon: "book-open",
    description: "Connect through narrative and emotion",
  },
  {
    id: "dir-3",
    name: "Social Proof",
    icon: "users",
    description: "Lead with customer results and testimonials",
  },
  {
    id: "dir-4",
    name: "Problem/Solution",
    icon: "crosshair",
    description: "Agitate the pain, then present the fix",
  },
  {
    id: "dir-5",
    name: "Comparison",
    icon: "git-compare",
    description: "Position against alternatives and competitors",
  },
];

export const mockBrandStyles: BrandStyle[] = [
  {
    id: "style-1",
    name: "Abundria",
    description: "Luxurious and premium aesthetic",
  },
  {
    id: "style-2",
    name: "Minimal",
    description: "Clean and understated design",
  },
  {
    id: "style-3",
    name: "Bold",
    description: "High contrast with strong visual impact",
  },
];

export const mockGeneratedConcepts: GeneratedConcept[] = [
  {
    id: "concept-1",
    direction: "Problem/Solution",
    headline: "Your Hands Scream for Help By Day's End",
    bodyText: "Desk work destroys your hands. Typing, scrolling, gripping—every minute adds pressure. PalmAura gives you relief in under 60 seconds. Professional hand massage therapy in a product that actually works.",
    cta: "Shop PalmAura Now",
    angle: "RSI Prevention",
    avatar: "The Desk Warrior",
  },
  {
    id: "concept-2",
    direction: "Social Proof",
    headline: "5,847 People Just Got Their Hands Back",
    bodyText: "After PalmAura, 87% of users report zero hand pain within a week. Real people. Real results. Real relief. Join thousands who ditched expensive massages for this.",
    cta: "Join the Relief",
    angle: "Customer Results",
    avatar: "The Stubborn Provider",
  },
  {
    id: "concept-3",
    direction: "Storytelling",
    headline: "The Moment My Hands Thanked Me",
    bodyText: "I spent $200 a month on massages until I found PalmAura. Now my hands recover overnight. My grip is stronger. My work gets done faster. This isn't just relief—it's reclaiming your life.",
    cta: "Experience the Difference",
    angle: "Emotional Connection",
    avatar: "The Aging Independent",
  },
  {
    id: "concept-4",
    direction: "Comparison",
    headline: "PalmAura vs Expensive Massage Therapy: See the Truth",
    bodyText: "One-time cost of PalmAura beats 6 weeks of massage bills. More convenient. More effective. Available 24/7. Dermatologist-tested, proven results. Why spend thousands when one investment solves it?",
    cta: "Compare and Save",
    angle: "Cost-Benefit Analysis",
    avatar: "The Creator/Gamer",
  },
  {
    id: "concept-5",
    direction: "Bold Claim",
    headline: "The Most Effective Hand Recovery Tool Ever Made",
    bodyText: "Stop wasting time on band-aid solutions. PalmAura uses advanced pressure-point technology proven by sports therapists worldwide. One device. Complete hand restoration. No gimmicks.",
    cta: "Claim Your Recovery",
    angle: "Authority Positioning",
    avatar: "The Desk Warrior",
  },
];

export const mockAvatars: Avatar[] = [
  {
    id: "avatar-1",
    name: "The Desk Warrior",
    archetype: "The Modern Industrial Athlete",
    description: "Remote professionals, RSI fear",
    traits: ["Tech Worker", "RSI Fear"],
    ageRange: "28-42",
    adCount: 12,
  },
  {
    id: "avatar-2",
    name: "The Stubborn Provider",
    archetype: "The Pride-Driven Laborer",
    description: "Manual laborers, pride-driven",
    traits: ["Manual Labor", "Pride-Driven"],
    ageRange: "40-60",
    adCount: 8,
  },
  {
    id: "avatar-3",
    name: "The Aging Independent",
    archetype: "The Freedom Fighter",
    description: "Seniors, independence loss",
    traits: ["Senior", "Independence"],
    ageRange: "55+",
    adCount: 5,
  },
  {
    id: "avatar-4",
    name: "The Creator/Gamer",
    archetype: "The Digital Performer",
    description: "Gamers & artists, performance anxiety",
    traits: ["Gamer", "Artist", "Performance"],
    ageRange: "18-35",
    adCount: 15,
  },
];

export const mockAngles: Angle[] = [
  {
    id: "angle-1",
    name: "RSI Prevention",
    category: "Pain-Based",
    exampleHook: "If your hands hurt after work, this changes everything",
    performance: "High engagement, 3.2% CTR",
  },
  {
    id: "angle-2",
    name: "Performance Anxiety",
    category: "Identity-Based",
    exampleHook: "Pro gamers and artists are using this to stay at their peak",
    performance: "Strong resonance, 2.8% CTR",
  },
  {
    id: "angle-3",
    name: "Recovery Speed",
    category: "Solution-Based",
    exampleHook: "Get tournament-ready hands in 3 days, not 3 weeks",
    performance: "Drives conversions, 4.1% CVR",
  },
  {
    id: "angle-4",
    name: "Cost Savings",
    category: "Anti-Alternative",
    exampleHook: "Stop paying $200 a month for massages. One device fixes it forever.",
    performance: "Attracts price-conscious, 1.9x ROAS",
  },
  {
    id: "angle-5",
    name: "Social Authority",
    category: "Social Proof",
    exampleHook: "5,800+ users reported complete hand recovery within 7 days",
    performance: "High trust signal, 2.6% CTR",
  },
];

export const mockHooks: Hook[] = [
  {
    id: "hook-1",
    text: "If your hands hurt after work, read this.",
    type: "Statement",
    angle: "RSI Prevention",
    avatar: "The Desk Warrior",
  },
  {
    id: "hook-2",
    text: "What if hand pain could disappear in one week?",
    type: "Question",
    angle: "Recovery Speed",
    avatar: "The Creator/Gamer",
  },
  {
    id: "hook-3",
    text: "I spent $12,000 on massages. Then I discovered this.",
    type: "Testimonial",
    angle: "Cost Savings",
    avatar: "The Stubborn Provider",
  },
  {
    id: "hook-4",
    text: "Your hands are literally falling apart right now. Here is why.",
    type: "Pattern-Interrupt",
    angle: "Pain-Based",
    avatar: "The Desk Warrior",
  },
  {
    id: "hook-5",
    text: "Watch how professional athletes recover hands in 3 days.",
    type: "Demonstration",
    angle: "Performance Anxiety",
    avatar: "The Creator/Gamer",
  },
  {
    id: "hook-6",
    text: "Doctors hate this one simple hand recovery trick.",
    type: "Pattern-Interrupt",
    angle: "Social Authority",
    avatar: "The Aging Independent",
  },
  {
    id: "hook-7",
    text: "Before PalmAura, my hands were useless. Now I work 12 hours a day pain-free.",
    type: "Testimonial",
    angle: "Emotional Transformation",
    avatar: "The Desk Warrior",
  },
  {
    id: "hook-8",
    text: "Does hand pain stop you from doing what you love?",
    type: "Question",
    angle: "Identity-Based",
    avatar: "The Aging Independent",
  },
  {
    id: "hook-9",
    text: "The expensive massage therapist told me about this.",
    type: "Statement",
    angle: "Social Authority",
    avatar: "The Stubborn Provider",
  },
  {
    id: "hook-10",
    text: "See the exact moment hand pain leaves your life.",
    type: "Demonstration",
    angle: "Recovery Speed",
    avatar: "The Creator/Gamer",
  },
];

export const aspectRatios: AspectRatio[] = [
  {
    value: "1:1",
    label: "1:1",
  },
  {
    value: "9:16",
    label: "9:16",
  },
  {
    value: "4:5",
    label: "4:5",
  },
  {
    value: "16:9",
    label: "16:9",
  },
];

export const conceptCounts: ConceptCount[] = [
  {
    value: 1,
    label: "1 creative",
  },
  {
    value: 3,
    label: "3 creatives",
  },
  {
    value: 5,
    label: "5 creatives",
  },
];
