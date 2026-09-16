import { Lead, EmailTemplate } from '../types';

// Clean production pipeline: No fake profiles or mock leads
export const INITIAL_LEADS: Lead[] = [];

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-pb',
    category: 'PERSONAL_BRAND',
    name: 'Course & Content Clip Repurposing',
    subjectTemplate: 'Quick question regarding {companyOrBrand} clips & IG reels',
    bodyTemplate: `Hi {name},

Loved your recent content on {monetizationOffer}. The breakdown was spot on.

I noticed you're publishing heavy long-form content ({longFormContentFormat}). We specialize in turning long-form videos and podcasts into high-converting short clips for Instagram ({audienceSizeFormatted}) that directly drive prospects into your digital offer funnel.

Would you be open to seeing 2 sample short clips we cut from your latest long-form video — zero cost or commitment?

Best regards,
Outreach Studio Team`,
    dmTemplate: `Hey {name}! Loved your recent long-form content. Noticed you've got gold in those videos — would love to send over 2 free IG reel edits. Drop a Gmail if you'd like to check them out!`,
  },
  {
    id: 'tpl-str',
    category: 'STREAMER',
    name: 'VOD & Clip Archive Repurposing',
    subjectTemplate: 'Clipping your {streamingPlatform} VODs for Shorts & Reels ({companyOrBrand})',
    bodyTemplate: `Hey {name},

Catching your recent stream — loved the energy on {streamingPlatform}!

I noticed you've got tons of highlight moments in your VOD archive that aren't being distributed onto YouTube Shorts or Instagram Reels.

We help mid-tier streamers turn live stream VODs into vertical viral clips so you can grow your community off-platform on autopilot.

Can I edit 3 free clips from your latest broadcast VOD to show you the quality?

Cheers,
Outreach Studio Team`,
    dmTemplate: `Yo {name}! Watched the broadcast recently on {streamingPlatform}. You've got awesome VODs — want me to send over 3 edited TikToks/Reels cut from your last stream for free?`,
  },
  {
    id: 'tpl-sb',
    category: 'SPORTSBOOK',
    name: 'Affiliate & Creator Acquisition Pitch',
    subjectTemplate: 'Creator network partnership for {companyOrBrand} affiliate program',
    bodyTemplate: `Hi Partnerships Team at {companyOrBrand},

Impressed by your recent campaign on Instagram ({instagramHandle}).

We manage a roster of verified sports content creators (podcasters & match react streamers) looking to partner with licensed operators in {licensingJurisdiction}.

Since {companyOrBrand} operates an active creator & affiliate program, we can seamlessly integrate your odds boost offers into live watchalongs.

Are you currently accepting new creator network partners on CPA or rev-share?

Warm regards,
Outreach Studio Team`,
    dmTemplate: `Hey {companyOrBrand} team! Loving the odds boosts on IG. We manage a network of sports content creators looking to join your affiliate program. Who is the best contact for creator partnerships?`,
  },
  {
    id: 'tpl-il',
    category: 'INDIE_LABEL',
    name: 'Indie Label Roster Video Scaling',
    subjectTemplate: 'Short-form video campaigns for {companyOrBrand} roster releases',
    bodyTemplate: `Hi {companyOrBrand} Team,

Congrats on the recent announcements across your {artistRosterCount}-artist roster!

We run short-form video content scaling for independent music labels, turning official music tracks and studio sessions into high-engagement Reels and TikToks for your acts.

Would you be open to a quick video breakdown of how we help indie labels drive organic streams without massive ad spend?

Best regards,
Outreach Studio Team`,
    dmTemplate: `Hey {companyOrBrand} team! Loving the roster releases. We help indie labels scale short-form video for their acts. Would love to send over sample reel concepts for your latest single!`,
  },
];

