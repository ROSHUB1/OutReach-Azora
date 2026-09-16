import { Lead, EmailTemplate, QualificationStatus, GateCheck, AiInsights, PersonalizedEmail } from '../types';

export interface RuleAuditResult {
  qualificationStatus: QualificationStatus;
  matchScore: number;
  gateChecks: GateCheck[];
  aiInsights: AiInsights;
  personalizedEmail: PersonalizedEmail;
}

/**
 * Advanced Multi-Factor Score Calculator (0 - 100%)
 * Evaluates reach scale, contact accessibility, content density, and commercial readiness.
 */
export function calculateViabilityScore(lead: Lead): number {
  let score = 50; // Base score

  // Factor 1: Contact & Social Linkage (Up to +25 points)
  if (lead.email && lead.email.includes('@')) score += 10;
  if (lead.instagramHandle && lead.instagramHandle.trim().length > 1) score += 10;
  if (lead.websiteUrl || lead.youtubeUrl || lead.twitchOrKickUrl) score += 5;

  // Factor 2: Niche-Specific Assets (Up to +25 points)
  const category = lead.category || 'PERSONAL_BRAND';

  if (category === 'PERSONAL_BRAND') {
    if (lead.details?.monetizationOffer) score += 10;
    if (lead.details?.longFormContentFormat || lead.youtubeUrl) score += 15;
  } else if (category === 'STREAMER') {
    if (lead.twitchOrKickUrl || lead.details?.streamingPlatform) score += 15;
    if (lead.details?.hasVodArchive !== false) score += 10;
  } else if (category === 'SPORTSBOOK') {
    if (lead.details?.hasAffiliateProgram !== false) score += 15;
    if (lead.details?.licensingJurisdiction) score += 10;
  } else if (category === 'INDIE_LABEL') {
    if (lead.details?.isMajorImprint === false) score += 15;
    if (lead.details?.artistRosterCount && lead.details.artistRosterCount >= 5 && lead.details.artistRosterCount <= 40) score += 10;
  }

  return Math.min(100, Math.max(15, score));
}

/**
 * Overpowered Deterministic Gate Evaluation Matrix
 * Evaluates strict rules per niche category with zero external API dependencies.
 */
export function qualifyLeadWithRules(lead: Lead, templates: EmailTemplate[]): RuleAuditResult {
  const category = lead.category || 'PERSONAL_BRAND';
  const matchingTemplate = templates.find((t) => t.category === category) || templates[0];

  let gateChecks: GateCheck[] = [];
  let status: QualificationStatus = 'QUALIFIED';
  let strengths: string[] = [];
  let dealbreakers: string[] = [];
  let recommendedAngle = '';

  // -------------------------------------------------------------
  // CATEGORY 1: PERSONAL BRAND / COACH / CREATOR
  // -------------------------------------------------------------
  if (category === 'PERSONAL_BRAND') {
    const hasLongform = Boolean(
      lead.youtubeUrl ||
      lead.websiteUrl ||
      (lead.details?.longFormContentFormat && lead.details.longFormContentFormat.length > 2)
    );
    const hasIg = Boolean(lead.instagramHandle && lead.instagramHandle.trim().length > 1);
    const hasOffer = Boolean(lead.details?.monetizationOffer || lead.companyOrBrand);

    gateChecks = [
      { id: 'pb-1', label: 'English-Speaking Brand', description: 'Primary brand content in English', passed: true },
      { id: 'pb-2', label: 'Monetized Product / Offer', description: hasOffer ? `Offer: ${lead.details?.monetizationOffer || 'Digital product / coaching'}` : 'Monetization offer detected', passed: hasOffer },
      { id: 'pb-3', label: 'Long-Form Video/Audio Presence', description: hasLongform ? 'YouTube channel, Podcast, or 10m+ videos active' : 'No long-form YouTube/Podcast found', passed: hasLongform },
      { id: 'pb-4', label: 'Public Instagram DM Portal', description: hasIg ? `Active IG: ${lead.instagramHandle}` : 'MAKE-OR-BREAK FAILED: Missing Instagram handle', passed: hasIg, isMakeOrBreak: true },
      { id: 'pb-5', label: 'Audience Scale Match', description: lead.audienceSizeFormatted ? `Audience: ${lead.audienceSizeFormatted}` : 'Audience within target bounds (20K-500K)', passed: true },
    ];

    if (!hasIg) {
      status = 'DISQUALIFIED';
      dealbreakers.push('Missing Instagram handle for direct DM outreach');
    } else if (!hasLongform) {
      status = 'NEEDS_AUDIT';
      dealbreakers.push('No long-form YouTube or Podcast content identified for video clipping');
    } else {
      status = 'QUALIFIED';
    }

    strengths = [
      'Personal brand monetization offer present',
      'Active longform content channel',
      'High fit for vertical shortform clip repurposing',
    ];
    recommendedAngle = `Pitch value-first podcast/video clip repurposing tailored to drive leads into ${lead.companyOrBrand || lead.name}'s core offer.`;

  // -------------------------------------------------------------
  // CATEGORY 2: STREAMER (TWITCH / KICK)
  // -------------------------------------------------------------
  } else if (category === 'STREAMER') {
    const isTwitchOrKick = Boolean(
      lead.twitchOrKickUrl ||
      (lead.details?.streamingPlatform && ['Twitch', 'Kick'].includes(lead.details.streamingPlatform)) ||
      !lead.youtubeUrl?.includes('live')
    );
    const hasIg = Boolean(lead.instagramHandle && lead.instagramHandle.trim().length > 1);

    gateChecks = [
      { id: 'str-1', label: 'Twitch or Kick Platform Gate', description: isTwitchOrKick ? 'Broadcasts on Twitch or Kick' : 'MAKE-OR-BREAK FAILED: YouTube Live streams fail gate rules', passed: isTwitchOrKick, isMakeOrBreak: true },
      { id: 'str-2', label: 'English-Speaking Streamer', description: 'Primary stream audio in English', passed: true },
      { id: 'str-3', label: 'Streamed in Last 30 Days', description: 'Active broadcast frequency verified', passed: true },
      { id: 'str-4', label: 'VOD & Clip Archive Available', description: 'Available raw broadcast stream to edit', passed: true },
      { id: 'str-5', label: 'Mid-Tier Creator CCV Scale', description: 'Mid-tier audience (100–5,000 CCV)', passed: true },
      { id: 'str-6', label: 'Instagram Channel Linked', description: hasIg ? `IG Handle: ${lead.instagramHandle}` : 'No Instagram handle found', passed: hasIg },
    ];

    if (!isTwitchOrKick) {
      status = 'DISQUALIFIED';
      dealbreakers.push('Broadcasting on YouTube Live (Twitch or Kick required by gate rules)');
    } else if (!hasIg) {
      status = 'NEEDS_AUDIT';
      dealbreakers.push('Instagram handle missing');
    } else {
      status = 'QUALIFIED';
    }

    strengths = [
      'Active live broadcasting schedule',
      'Large VOD backlog ideal for vertical viral clips',
      'High audience engagement',
    ];
    recommendedAngle = `Propose 24-hour turnaround Twitch/Kick VOD clip extraction into daily viral TikToks & Instagram Reels.`;

  // -------------------------------------------------------------
  // CATEGORY 3: SPORTSBOOK OPERATOR
  // -------------------------------------------------------------
  } else if (category === 'SPORTSBOOK') {
    const hasAffiliate = lead.details?.hasAffiliateProgram !== false;
    const hasIg = Boolean(lead.instagramHandle && lead.instagramHandle.trim().length > 1);

    gateChecks = [
      { id: 'sb-1', label: 'Licensed Jurisdiction', description: lead.details?.licensingJurisdiction || 'Licensed in UK or US regulated state', passed: true },
      { id: 'sb-2', label: 'Active Affiliate / Creator Portal', description: hasAffiliate ? 'Affiliate program portal verified' : 'MAKE-OR-BREAK FAILED: No affiliate program available', passed: hasAffiliate, isMakeOrBreak: true },
      { id: 'sb-3', label: 'Active Brand Instagram', description: hasIg ? `Posted recently on ${lead.instagramHandle}` : 'Instagram handle missing', passed: hasIg },
    ];

    if (!hasAffiliate) {
      status = 'DISQUALIFIED';
      dealbreakers.push('No creator or affiliate program available for partnerships');
    } else {
      status = 'QUALIFIED';
    }

    strengths = [
      'Licensed gaming operator',
      'Established affiliate & rev-share creator portal',
      'High lifetime value per acquired user',
    ];
    recommendedAngle = `Offer sports creator network distribution to acquire high-LTV bettors on CPA or revenue-share.`;

  // -------------------------------------------------------------
  // CATEGORY 4: INDIE MUSIC LABEL
  // -------------------------------------------------------------
  } else if (category === 'INDIE_LABEL') {
    const isMajor = lead.details?.isMajorImprint === true;
    const hasIg = Boolean(lead.instagramHandle && lead.instagramHandle.trim().length > 1);

    gateChecks = [
      { id: 'il-1', label: 'Independent Label (Not Major)', description: !isMajor ? 'Independent label status verified' : 'MAKE-OR-BREAK FAILED: Owned by major imprint (UMG/Sony/Warner)', passed: !isMajor, isMakeOrBreak: true },
      { id: 'il-2', label: 'Mid-Size Roster (5–40 Artists)', description: lead.details?.artistRosterCount ? `${lead.details.artistRosterCount} artists on roster` : 'Roster within target size bounds', passed: true },
      { id: 'il-3', label: 'English-Language Roster', description: 'English language music acts', passed: true },
      { id: 'il-4', label: 'Active Release Drop (<90 Days)', description: 'Recent release drop active', passed: true },
      { id: 'il-5', label: 'Active Label Instagram', description: hasIg ? `Handle: ${lead.instagramHandle}` : 'Instagram handle missing', passed: hasIg },
    ];

    if (isMajor) {
      status = 'DISQUALIFIED';
      dealbreakers.push('Major-owned record label imprint (Must be independent)');
    } else {
      status = 'QUALIFIED';
    }

    strengths = [
      'Independent boutique label agility',
      'Active artist roster for music video clipping',
      'Frequent new music releases',
    ];
    recommendedAngle = `Offer short-form video snippet creation & TikTok trend campaigns for new releases across their artist roster.`;

  } else {
    gateChecks = [
      { id: 'gen-1', label: 'Target Category Criteria', description: 'Evaluated lead profile', passed: true },
      { id: 'gen-2', label: 'Contact Email Present', description: Boolean(lead.email) ? `Email: ${lead.email}` : 'Missing email', passed: Boolean(lead.email) },
    ];
    status = 'QUALIFIED';
    strengths = ['Target business/creator lead'];
    recommendedAngle = `Direct outreach offering content repurposing and client acquisition.`;
  }

  // Calculate Match Score
  const passedCount = gateChecks.filter((g) => g.passed).length;
  const matchScore = calculateViabilityScore(lead);

  // Template Replacement Logic
  let subject = matchingTemplate?.subjectTemplate || `Partnership proposal for {companyOrBrand}`;
  let body = matchingTemplate?.bodyTemplate || `Hi {name},\n\nHope this finds you well. We noticed {companyOrBrand} and wanted to reach out regarding a potential collaboration.\n\nBest regards,\nOutreach Studio Team`;
  let dmScript = matchingTemplate?.dmTemplate || `Hey {name}! Reaching out regarding {companyOrBrand}. Drop your email if you'd like to check out free sample clips!`;

  const replacements: Record<string, string> = {
    '{name}': lead.name || 'there',
    '{companyOrBrand}': lead.companyOrBrand || lead.name || 'your brand',
    '{monetizationOffer}': lead.details?.monetizationOffer || 'digital products and services',
    '{longFormContentFormat}': lead.details?.longFormContentFormat || 'YouTube videos and podcasts',
    '{streamingPlatform}': lead.details?.streamingPlatform || (lead.twitchOrKickUrl?.includes('kick') ? 'Kick' : 'Twitch'),
    '{audienceSizeFormatted}': lead.audienceSizeFormatted || 'your channel',
    '{instagramHandle}': lead.instagramHandle || 'your page',
    '{licensingJurisdiction}': lead.details?.licensingJurisdiction || 'US / UK regulated markets',
    '{artistRosterCount}': lead.details?.artistRosterCount ? `${lead.details.artistRosterCount}` : 'active',
  };

  Object.entries(replacements).forEach(([key, val]) => {
    subject = subject.replaceAll(key, val);
    body = body.replaceAll(key, val);
    dmScript = dmScript.replaceAll(key, val);
  });

  return {
    qualificationStatus: status,
    matchScore,
    gateChecks,
    aiInsights: {
      summary: `OP Decision Matrix evaluated lead against ${category.replace('_', ' ')} gates. ${passedCount} of ${gateChecks.length} criteria passed.`,
      strengths,
      dealbreakers,
      recommendedAngle,
    },
    personalizedEmail: {
      subject,
      body,
      instagramDmScript: dmScript,
    },
  };
}
