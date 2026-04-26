export type Position = {
  id: string;
  createdAt?: string;
  partnerDomain?: string;
  thumbnailUrl?: string;
  company: string;
  initial: string;
  role: string;
  category: string;
  industry: string;
  companySize: string;
  eligibleVisas: string[];
  location: string;
  type: "On-site" | "Hybrid" | "Remote";
  start: string;
  postedDays: number;
  applicants: number;
  match: number;
  tags: string[];
  highlight?: "Hot" | "New" | "Recommended";
};

export const ALL_POSITIONS: Position[] = [
  {
    id: "p1",
    company: "Lumen Studio",
    initial: "L",
    role: "Product Design Intern",
    category: "Design",
    industry: "IT",
    companySize: "30인 이하",
    eligibleVisas: ["D-2", "D-10", "F-2", "F-4"],
    location: "Seoul",
    type: "Hybrid",
    start: "2026 Spring",
    postedDays: 2,
    applicants: 24,
    match: 92,
    tags: ["Figma", "UX Research", "Korean+English"],
    highlight: "Recommended"
  },
  {
    id: "p2",
    company: "Northwave",
    initial: "N",
    role: "Global Marketing Assistant",
    category: "Marketing",
    industry: "COMMERCE",
    companySize: "50인 이하",
    eligibleVisas: ["D-10", "E-7", "F-2"],
    location: "Singapore",
    type: "On-site",
    start: "Immediate",
    postedDays: 1,
    applicants: 12,
    match: 86,
    tags: ["Content", "SEO", "English"],
    highlight: "New"
  },
  {
    id: "p3",
    company: "Orbit AI",
    initial: "O",
    role: "AI Operations Associate",
    category: "Operations",
    industry: "IT",
    companySize: "100인 이상",
    eligibleVisas: ["D-10", "E-7", "F-2", "F-4", "F-6"],
    location: "Remote",
    type: "Remote",
    start: "Q2 2026",
    postedDays: 5,
    applicants: 87,
    match: 78,
    tags: ["LLM", "Prompting", "Notion"],
    highlight: "Hot"
  },
  {
    id: "p4",
    company: "Forge & Co.",
    initial: "F",
    role: "Business Development Intern",
    category: "Business",
    industry: "CONSTRUCTION",
    companySize: "100인 이상",
    eligibleVisas: ["E-7", "F-2"],
    location: "Tokyo",
    type: "Hybrid",
    start: "2026 Spring",
    postedDays: 7,
    applicants: 33,
    match: 74,
    tags: ["B2B", "Japanese", "Sales"],
    highlight: "Recommended"
  },
  {
    id: "p5",
    company: "Pavo Labs",
    initial: "P",
    role: "Content Strategist",
    category: "Content",
    industry: "CONTENT",
    companySize: "30인 이하",
    eligibleVisas: ["D-10", "F-2", "F-4"],
    location: "Berlin",
    type: "Remote",
    start: "Immediate",
    postedDays: 3,
    applicants: 41,
    match: 81,
    tags: ["Editorial", "Brand", "English"],
    highlight: "New"
  },
  {
    id: "p6",
    company: "Helio",
    initial: "H",
    role: "Data Analyst Intern",
    category: "Data",
    industry: "HEALTHCARE",
    companySize: "50인 이하",
    eligibleVisas: ["D-2", "D-10", "E-7"],
    location: "Seoul",
    type: "On-site",
    start: "Q2 2026",
    postedDays: 4,
    applicants: 56,
    match: 88,
    tags: ["SQL", "Python", "Tableau"],
    highlight: "Hot"
  },
  {
    id: "p7",
    company: "Atlas Mobility",
    initial: "A",
    role: "UX Researcher",
    category: "Design",
    industry: "CONSTRUCTION",
    companySize: "100인 이상",
    eligibleVisas: ["D-10", "F-2", "F-6"],
    location: "Seoul",
    type: "Hybrid",
    start: "2026 Spring",
    postedDays: 9,
    applicants: 19,
    match: 70,
    tags: ["Interview", "Synthesis"]
  },
  {
    id: "p8",
    company: "Verda",
    initial: "V",
    role: "Frontend Engineer Intern",
    category: "Engineering",
    industry: "IT",
    companySize: "30인 이하",
    eligibleVisas: ["D-2", "D-10", "E-7", "F-2", "F-4"],
    location: "Remote",
    type: "Remote",
    start: "Immediate",
    postedDays: 6,
    applicants: 102,
    match: 84,
    tags: ["React", "TypeScript"],
    highlight: "Hot"
  },
  {
    id: "p9",
    company: "Mira & Co.",
    initial: "M",
    role: "Brand Designer",
    category: "Design",
    industry: "CONTENT",
    companySize: "10인 이하",
    eligibleVisas: ["D-10", "F-2"],
    location: "Tokyo",
    type: "On-site",
    start: "Q2 2026",
    postedDays: 11,
    applicants: 28,
    match: 66,
    tags: ["Identity", "Print"]
  }
];

export function getPositionById(id: string) {
  return ALL_POSITIONS.find((position) => position.id === id) ?? null;
}
