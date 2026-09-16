export type LeadCategory = 'PERSONAL_BRAND' | 'STREAMER' | 'SPORTSBOOK' | 'INDIE_LABEL';

export type QualificationStatus = 'QUALIFIED' | 'NEEDS_AUDIT' | 'DISQUALIFIED';

export type OutreachStatus = 'UNSENT' | 'DRAFTED' | 'SENT' | 'OPENED' | 'REPLIED' | 'BOUNCED';

export type OutreachChannel = 'GMAIL' | 'INSTAGRAM_DM' | 'BOTH';

export interface GateCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  isMakeOrBreak?: boolean;
}

export type SequenceStatus = 'NOT_STARTED' | 'INITIAL_SENT' | 'FOLLOWUP_DUE' | 'FOLLOWUP_SENT' | 'REPLIED';

export interface Lead {
  id: string;
  name: string;
  email: string;
  category: LeadCategory;
  companyOrBrand: string;
  instagramHandle?: string;
  youtubeUrl?: string;
  twitchOrKickUrl?: string;
  websiteUrl?: string;
  location?: string;
  audienceSizeFormatted?: string;
  qualificationStatus: QualificationStatus;
  outreachStatus: OutreachStatus;
  sequenceStatus: SequenceStatus;
  initialSentDate?: string;
  followupDueDate?: string;
  followupSentDate?: string;
  matchScore: number; // 0-100%
  lastAuditDate?: string;
  notes?: string;
  
  // Niche-specific criteria details
  details: {
    language?: string;
    // Personal Brands
    monetizationOffer?: string; // Course, coaching, physical product, SaaS, service
    longFormContentFormat?: string; // YouTube, Podcast, Webinar, 10m+ IG Video
    
    // Streamers
    streamingPlatform?: 'Twitch' | 'Kick' | 'YouTube Live' | 'Rumble' | 'Other';
    lastStreamDate?: string; // e.g., "3 days ago"
    avgConcurrentViewers?: number;
    hasVodArchive?: boolean;
    
    // Sportsbooks
    licensingJurisdiction?: string; // e.g. "UK Gambling Commission", "NJ Division of Gaming Enforcement"
    hasAffiliateProgram?: boolean; // Make-or-break gate!
    lastInstagramPostDate?: string;
    
    // Indie Labels
    artistRosterCount?: number; // 5-40 target
    lastReleaseDate?: string;
    isMajorImprint?: boolean;
    subGenre?: string;
    [key: string]: any;
  };

  // Specific gate evaluation results
  gateChecks: GateCheck[];

  // Custom AI analysis summary
  aiInsights?: AiInsights;

  // Outbound copy pre-built
  personalizedEmail?: PersonalizedEmail;

  createdAt: string;
}

export interface AiInsights {
  summary: string;
  strengths: string[];
  dealbreakers: string[];
  recommendedAngle: string;
}

export interface PersonalizedEmail {
  subject: string;
  body: string;
  instagramDmScript: string;
  sentAt?: string;
  method?: DispatchMethod;
}

export interface EmailTemplate {
  id: string;
  category: LeadCategory;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  dmTemplate: string;
}

export interface CategoryStats {
  total: number;
  qualified: number;
  needsAudit: number;
  disqualified: number;
  sentOutreach: number;
}

export type DispatchMethod = 'GMAIL_API' | 'BIRD_API' | 'GMAIL_WEB' | 'MAILTO' | 'SMTP_SERVER' | 'EML_FILE';

export interface OAuthGmailAccount {
  id: string; // e.g. 'account-1', 'account-2', 'account-3'
  slotIndex: number; // 0, 1, 2
  email: string;
  name: string;
  photoUrl?: string;
  accessToken: string | null;
  tokenExpiresAt?: number;
  isConnected: boolean;
  isActive: boolean; // whether active for automated sequence rotation
  dailySentCount: number;
  dailyQuotaLimit: number; // e.g. 500 for standard Gmail, 2000 for Workspace
  lastSentAt?: string;
  connectedAt?: string;
}

export interface BirdConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  secure?: boolean;
}

export interface DispatchLog {
  id: string;
  leadId: string;
  leadName: string;
  recipientEmail: string;
  subject: string;
  method: DispatchMethod;
  status: 'DELIVERED' | 'DISPATCHED_WEB_GMAIL' | 'DISPATCHED_MAILTO' | 'FAILED' | 'ACCEPTED_BY_BIRD' | 'DISPATCHED' | string;
  timestamp: string;
  responseMessage?: string;
  birdMessageId?: string;
  messageId?: string;
  remediation?: string;
  docUrl?: string;
}
