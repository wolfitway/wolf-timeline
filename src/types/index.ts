export interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  author: string;
  desc: string;
  tags?: string[];
  type?: "manual" | "ai" | "git" | "release";
}

export interface ExpertReview {
  expert: string;
  avatar: string;
  role: string;
  score: number;
  verdict: "Approved" | "Recommended" | "Caution" | "Security Flag";
  comment: string;
}

export interface AiDebateTurn {
  id: string;
  speaker: string;
  avatar: string;
  stance: "pro" | "con" | "neutral" | "synthesis";
  argument: string;
  timestamp?: string;
}

export interface AiExploration {
  id: string;
  title: string;
  date: string;
  model: string;
  url?: string;
  rationale: string;
  transcript: string;
  tags?: string[];
  debate_models?: string[];
  debate_turns?: AiDebateTurn[];
  decision_outcome?: string;
  tradeoffs?: Array<{ aspect: string; pro: string; con: string }>;
  key_takeaways?: string[];
  status?: "debating" | "consensus_reached" | "superseded";
}

export interface MoodImage {
  id: string;
  url: string;
  caption: string;
  source?: string;
  aspect_ratio?: string;
  tags?: string[];
  created_at?: string;
  order_index?: number;
  sizeBytes?: number;
  fileName?: string;
  width?: number;
  height?: number;
}

export interface WebBookmark {
  id: string;
  url: string;
  title: string;
  domain: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  projectId?: number;
  note?: string;
  favicon?: string;
  tags?: string[];
  preview_image?: string;
  description?: string;
  expert_reviews?: ExpertReview[];
  fetch_status?: "idle" | "fetching" | "fetched" | "error";
}


export interface Note {
  id: number;
  created_at: string;
  title: string;
  body: string;
  tags: string[];
  kind: "idea" | "link" | "post" | "milestone";
  status: "ideation" | "research" | "design" | "in_progress" | "live" | "backlog" | "exploring" | "shipped";
  funnel_stage: "awareness" | "lead_magnet" | "product" | "revenue";
  remind_at?: string | null;
  url?: string | null;
  events?: TimelineEvent[];
  ai_explorations?: AiExploration[];
  mood_gallery?: MoodImage[];
  bookmarks?: WebBookmark[];
  color?: string;
  pinned?: boolean;
}

export interface KeyPractice {
  id: string;
  text: string;
  completed: boolean;
}

export interface RoadmapPhase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  status: "In Progress" | "Live" | "Up Next" | "Planned" | "Backlog";
  description: string;
  focus: string;
  outcome: string;
  collapsed?: boolean;
  practices: KeyPractice[];
}

export interface VaultSecretItem {
  id: string;
  service: string;
  username?: string;
  password?: string;
  category: "api" | "login" | "db" | "token";
  host?: string;
  notes?: string;
  ciphertext?: string;
  iv?: string;
  salt?: string;
  created_at: string;
  updated_at: string;
}

export interface ScannedCredentialCandidate {
  id: string;
  service: string;
  category: "api" | "login" | "db" | "token";
  username: string;
  password: string;
  host: string;
  notes: string;
  selected: boolean;
}

export type LicenseTier = "solo_free" | "commercial_solo" | "team";

export interface LicenseInfo {
  activated: boolean;
  tier: LicenseTier;
  tier_label: string;
  machine_id: string;
  key?: string;
  company_name?: string;
  seats?: number;
  activated_at?: string;
  expires_at?: string | null;
  features?: string[];
}

export interface CouncilExpert {
  role: string;
  handle: string;
  avatar: string;
  mandate: string;
  status: string;
  discipline?: string;
}

export interface WolfitwayProduct {
  id: string;
  name: string;
  domain: string;
  icon: string;
  desc: string;
  placeholder?: string;
}
