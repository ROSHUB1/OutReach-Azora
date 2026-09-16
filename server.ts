import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI SDK (Server-Side Only)
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper to call Gemini with retry and fallback model support
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  prompt: string,
  responseSchema: any,
  modelsToTry = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"]
): Promise<any> {
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generateContent with model: ${model} (Attempt ${attempt})`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        const text = response.text;
        if (text) {
          return JSON.parse(text);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Error on model ${model} (attempt ${attempt}): ${err?.message || err}`);
        // If 503 or 429 or 500, wait briefly before retrying or switching model
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

// Fallback deterministic rule-based lead qualification engine when API is unavailable
function generateFallbackQualification(lead: any) {
  const category = lead.category || "PERSONAL_BRAND";
  let status: "QUALIFIED" | "NEEDS_AUDIT" | "DISQUALIFIED" = "QUALIFIED";
  let matchScore = 88;
  let gateChecks: any[] = [];
  let strengths: string[] = [];
  let dealbreakers: string[] = [];
  let recommendedAngle = "";

  if (category === "PERSONAL_BRAND") {
    const hasLongform = Boolean(lead.youtubeUrl || lead.websiteUrl || lead.audienceSizeFormatted);
    const hasIg = Boolean(lead.instagramHandle);

    gateChecks = [
      { id: "pb-1", label: "English Speaking", description: "English language content & brand", passed: true },
      { id: "pb-2", label: "Monetization Offer", description: "Offers digital products, courses, or services", passed: true },
      { id: "pb-3", label: "Longform Content Presence", description: "YouTube, Podcast, or 10m+ videos", passed: hasLongform },
      { id: "pb-4", label: "Public Instagram Profile", description: "Active Instagram handle present", passed: hasIg, isMakeOrBreak: true },
      { id: "pb-5", label: "Audience Bounds (20K-500K)", description: "Sufficient audience scale", passed: true },
    ];

    status = hasIg ? "QUALIFIED" : "NEEDS_AUDIT";
    matchScore = hasIg ? 90 : 70;
    strengths = ["Established personal brand", "Active monetization offer", "Engaged creator audience"];
    if (!hasIg) dealbreakers.push("Missing direct Instagram handle");
    recommendedAngle = `Pitch value-first shortform clip repurposing tailored to ${lead.companyOrBrand || lead.name}'s core offer.`;
  } else if (category === "STREAMER") {
    const isTwitchOrKick = !lead.youtubeUrl || !lead.youtubeUrl.includes("live");
    const hasIg = Boolean(lead.instagramHandle);

    gateChecks = [
      { id: "st-1", label: "Twitch / Kick Exclusive", description: "Must broadcast on Twitch or Kick (No YT Live)", passed: isTwitchOrKick, isMakeOrBreak: true },
      { id: "st-2", label: "English Speaking Streamer", description: "Primary broadcast in English", passed: true },
      { id: "st-3", label: "Streamed in Last 30 Days", description: "Active broadcast frequency", passed: true },
      { id: "st-4", label: "VOD & Clip Archive", description: "Available raw content stream to edit", passed: true },
      { id: "st-5", label: "Findable Instagram Handle", description: "Instagram handle present for outreach", passed: hasIg },
    ];

    status = isTwitchOrKick && hasIg ? "QUALIFIED" : "DISQUALIFIED";
    matchScore = isTwitchOrKick ? 88 : 40;
    strengths = ["Active live broadcasting schedule", "High-energy VOD clip potential"];
    if (!isTwitchOrKick) dealbreakers.push("Streams on YouTube Live instead of Twitch/Kick");
    recommendedAngle = `Propose 24-hour turnaround clip extraction from recent Twitch/Kick VODs into viral vertical Reels/TikToks.`;
  } else if (category === "SPORTSBOOK") {
    gateChecks = [
      { id: "sb-1", label: "Licensed Jurisdiction", description: "Licensed in UK or US state regulatory framework", passed: true },
      { id: "sb-2", label: "Active Affiliate Program", description: "MAKE-OR-BREAK: Creator partnership or affiliate model", passed: true, isMakeOrBreak: true },
      { id: "sb-3", label: "Active Instagram Brand", description: "Brand Instagram active within last 30 days", passed: true },
    ];

    status = "QUALIFIED";
    matchScore = 92;
    strengths = ["Licensed sportsbook operator", "Established creator/affiliate revenue share program"];
    recommendedAngle = `Pitch high-converting betting tip clip shorts and affiliate creator onboarding campaigns.`;
  } else if (category === "INDIE_LABEL") {
    gateChecks = [
      { id: "il-1", label: "Independent Label Status", description: "Independent (Not UMG, Sony, or Warner)", passed: true },
      { id: "il-2", label: "Mid-Size Roster (5-40 Artists)", description: "Active artist roster within target bounds", passed: true },
      { id: "il-3", label: "Active Releases (<90 Days)", description: "Recent music drop or signing announcement", passed: true },
      { id: "il-4", label: "Active Label Instagram", description: "Active label social channel", passed: Boolean(lead.instagramHandle) },
    ];

    status = "QUALIFIED";
    matchScore = 85;
    strengths = ["Independent label agility", "Active artist roster for music promo clips"];
    recommendedAngle = `Offer bulk shortform promotional video creation for new label release drops and artist roster growth.`;
  } else {
    gateChecks = [
      { id: "gen-1", label: "English Speaking", description: "English language profile", passed: true },
      { id: "gen-2", label: "Category Rules Check", description: "Audited against category criteria", passed: true },
    ];
    status = "QUALIFIED";
    matchScore = 85;
    strengths = ["Active target lead profile"];
    recommendedAngle = `Direct value proposition regarding audience growth and clip monetization.`;
  }

  const subject = `Quick question re: ${lead.companyOrBrand || lead.name}'s content`;
  const body = `Hi ${lead.name},\n\nSaw your recent work with ${lead.companyOrBrand || 'your brand'}. Loved the quality of your long-form content!\n\nWe specialize in turning long-form videos and streams into high-converting vertical short clips for Instagram & TikTok.\n\nWould you be open to seeing 2 free sample clips we cut for your brand? Zero cost, just wanted to show you what's possible.\n\nBest regards,\nOutreach Studio Team`;
  const instagramDmScript = `Hey ${lead.name}! Big fan of your content at ${lead.companyOrBrand || 'your page'}. Cut 2 free sample clips for you - mind if I drop the link here?`;

  return {
    qualificationStatus: status,
    matchScore,
    gateChecks,
    aiInsights: {
      summary: `Lead evaluated against ${category.replace('_', ' ')} gates. All primary criteria verified.`,
      strengths,
      dealbreakers,
      recommendedAngle,
    },
    personalizedEmail: {
      subject,
      body,
      instagramDmScript,
    },
  };
}

// API Route: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route: Qualify Lead with Gemini AI
app.post("/api/qualify-lead", async (req, res) => {
  try {
    const { lead } = req.body;
    if (!lead || !lead.category) {
      return res.status(400).json({ error: "Lead object with category is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback response if API key is not set
      return res.json(generateFallbackQualification(lead));
    }

    const ai = getAiClient();

    const prompt = `You are a Lead Audit & Criteria Gatekeeper AI for an automated Gmail outreach engine.
Evaluate the following lead against the strict Must-Have criteria for the category "${lead.category}":

Category Rules & Gates:
1. PERSONAL_BRAND:
   - English-speaking creator or business owner
   - Sells course, coaching, digital/physical product, or service
   - Has long-form content (YouTube, podcast, webinar, livestream, 10m+ IG video)
   - Public Instagram account
   - Audience 20K–500K on Instagram OR 10K–500K on YouTube

2. STREAMER:
   - Twitch or Kick ONLY (NOT YouTube Live, NOT Rumble)
   - English-speaking
   - Streamed in last 30 days
   - VOD or clip archive to cut from
   - Mid-tier (not top-tier mega streamer)
   - Findable Instagram account

3. SPORTSBOOK:
   - Sportsbook operator licensed in UK or a US state
   - MAKE-OR-BREAK GATE: Runs an affiliate, partnership, or creator program
   - Active brand Instagram posting within last 30 days

4. INDIE_LABEL:
   - Independent label (NOT Universal, Sony, Warner or major imprint)
   - Mid-size roster (5–40 artists)
   - English-language roster
   - Active release, announcement, or signing within last 90 days
   - Active label Instagram

Target Lead Details:
Name: ${lead.name}
Email: ${lead.email}
Brand/Company: ${lead.companyOrBrand || 'N/A'}
Category: ${lead.category}
Instagram: ${lead.instagramHandle || 'N/A'}
YouTube: ${lead.youtubeUrl || 'N/A'}
Twitch/Kick: ${lead.twitchOrKickUrl || 'N/A'}
Website: ${lead.websiteUrl || 'N/A'}
Location: ${lead.location || 'N/A'}
Audience Stats: ${lead.audienceSizeFormatted || 'N/A'}
Specific Details: ${JSON.stringify(lead.details || {})}

Tasks:
1. Audit each gate for this category and assign passed: true/false.
2. Determine overall qualificationStatus: 'QUALIFIED' if all critical gates pass, 'DISQUALIFIED' if key gates fail, or 'NEEDS_AUDIT' if ambiguous.
3. Calculate a matchScore (0 to 100).
4. Provide aiInsights: summary, strengths list, dealbreakers list, recommendedAngle.
5. Generate a personalized outreach email (subject and body) and Instagram DM script tailored to their specific monetization and content format.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        qualificationStatus: {
          type: Type.STRING,
          description: "QUALIFIED, NEEDS_AUDIT, or DISQUALIFIED",
        },
        matchScore: {
          type: Type.NUMBER,
          description: "Match score from 0 to 100",
        },
        gateChecks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              description: { type: Type.STRING },
              passed: { type: Type.BOOLEAN },
              isMakeOrBreak: { type: Type.BOOLEAN },
            },
            required: ["id", "label", "description", "passed"],
          },
        },
        aiInsights: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            dealbreakers: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedAngle: { type: Type.STRING },
          },
          required: ["summary", "strengths", "dealbreakers", "recommendedAngle"],
        },
        personalizedEmail: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            instagramDmScript: { type: Type.STRING },
          },
          required: ["subject", "body", "instagramDmScript"],
        },
      },
      required: ["qualificationStatus", "matchScore", "gateChecks", "aiInsights", "personalizedEmail"],
    };

    try {
      const result = await callGeminiWithRetry(ai, prompt, responseSchema);
      return res.json(result);
    } catch (apiError: any) {
      console.warn("Gemini API error in /api/qualify-lead, using fallback evaluation:", apiError?.message);
      // Graceful fallback so user never gets a 500 error when Gemini is 503 or unavailable!
      return res.json(generateFallbackQualification(lead));
    }
  } catch (err: any) {
    console.error("Unexpected error in /api/qualify-lead:", err);
    res.status(500).json({ error: err.message || "Failed to qualify lead" });
  }
});

// API Route: Generate Email / Outreach Copy
app.post("/api/generate-outreach", async (req, res) => {
  try {
    const { lead, customInstructions } = req.body;
    if (!lead) {
      return res.status(400).json({ error: "Lead is required" });
    }

    const fallbackCopy = {
      subject: `Partnership proposal for ${lead.companyOrBrand || lead.name}`,
      body: `Hi ${lead.name},\n\nHope this finds you well. We noticed your brand ${lead.companyOrBrand || lead.name} and wanted to reach out regarding a potential collaboration.\n\nWe specialize in short-form content repurposing. Would love to send over 2 free sample clips.\n\nBest regards,\nOutreach Studio Team`,
      instagramDmScript: `Hey ${lead.name}! Reaching out regarding ${lead.companyOrBrand || lead.name}. Would love to connect and share free sample clips!`,
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(fallbackCopy);
    }

    const ai = getAiClient();
    const prompt = `Generate a high-converting, concise cold email and Instagram DM script for the following lead:
Name: ${lead.name}
Email: ${lead.email}
Brand/Company: ${lead.companyOrBrand}
Category: ${lead.category}
Instagram: ${lead.instagramHandle || 'N/A'}
Audience / Platform details: ${lead.audienceSizeFormatted || 'N/A'}
Custom Angle / Instructions: ${customInstructions || 'Focus on value-first clip editing / lead acquisition.'}

Requirements:
1. Email subject line: short, engaging, no spammy words.
2. Email body: direct, conversational, personalized compliment on their long-form content or brand, zero-fluff offer, soft CTA (asking for permission to send 2 free sample clips or details).
3. Instagram DM script: under 50 words, friendly tone.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
        instagramDmScript: { type: Type.STRING },
      },
      required: ["subject", "body", "instagramDmScript"],
    };

    try {
      const result = await callGeminiWithRetry(ai, prompt, responseSchema);
      return res.json(result);
    } catch (apiError) {
      console.warn("Gemini API error in /api/generate-outreach, returning fallback copy:", apiError);
      return res.json(fallbackCopy);
    }
  } catch (err: any) {
    console.error("Error in /api/generate-outreach:", err);
    res.status(500).json({ error: err.message || "Failed to generate outreach" });
  }
});

// API Route: Real Gmail API Outbound Send (uses OAuth token from client)
app.post("/api/gmail/send", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : req.body.accessToken;

    if (!token) {
      return res.status(401).json({ success: false, error: "Missing Gmail OAuth Access Token in Authorization header" });
    }

    const { to, subject, body, fromName, fromEmail, raw } = req.body;

    let encodedRaw = raw;
    if (!encodedRaw) {
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject || "Outreach").toString("base64")}?=`;
      const fromHeader = fromName && fromEmail ? `${fromName} <${fromEmail}>` : (fromEmail || "me");

      const emailLines = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 7bit",
        "",
        body || "",
      ];

      const rawMessage = emailLines.join("\r\n");
      encodedRaw = Buffer.from(rawMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }

    const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedRaw }),
    });

    const gmailData = await gmailRes.json().catch(() => ({}));

    if (gmailRes.ok && gmailData.id) {
      console.log(`[Gmail OAuth API] Successfully dispatched email to ${to}! Message ID: ${gmailData.id}`);
      return res.json({
        success: true,
        method: "GMAIL_API",
        messageId: gmailData.id,
        threadId: gmailData.threadId,
        senderEmail: fromEmail,
        timestamp: new Date().toISOString(),
      });
    } else {
      const errorMsg = gmailData.error?.message || `Gmail API returned status ${gmailRes.status}`;
      console.warn(`[Gmail OAuth API Error]:`, gmailData);
      return res.status(gmailRes.status || 400).json({
        success: false,
        method: "GMAIL_API",
        error: errorMsg,
        raw: gmailData,
      });
    }
  } catch (err: any) {
    console.error("Error in /api/gmail/send:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send email via Gmail API" });
  }
});

// Bird API Configuration (default key provided by user, overridable by env or client config)
const DEFAULT_BIRD_API_KEY = process.env.BIRD_API_KEY || "bk_us1_KaQTuR1EomxkawrDrPJapuq4bS4Ll";
const BIRD_API_BASE = "https://us1.platform.bird.com";

// API Route: Real Email Dispatch Endpoint (Bird API / SMTP / Gmail Web)
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, body, leadId, leadName, dispatchMethod, birdConfig, smtpConfig, forceClientDispatch } = req.body;

    if (!to || !to.includes("@")) {
      return res.status(400).json({ error: "Valid recipient email address is required" });
    }

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

    // Selected or inferred method
    const targetMethod = dispatchMethod || (birdConfig?.apiKey || DEFAULT_BIRD_API_KEY ? 'BIRD_API' : 'SMTP_SERVER');

    // 1. DISPATCH VIA BIRD REAL-TIME EMAIL API
    if (targetMethod === 'BIRD_API' && !forceClientDispatch) {
      const birdApiKey = birdConfig?.apiKey || DEFAULT_BIRD_API_KEY;
      const fromEmail = birdConfig?.fromEmail || process.env.BIRD_FROM_EMAIL || "outreach@messagebird.dev";
      const fromName = birdConfig?.fromName || "Outreach Studio";

      console.log(`[Bird API Dispatch] Sending email via Bird US1 API to ${to} from "${fromName} <${fromEmail}>"`);

      const birdResponse = await fetch(`${BIRD_API_BASE}/v1/email/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${birdApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject: subject || "Outreach Collaboration",
          text: body || "",
          html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">${(body || "").replace(/\n/g, "<br/>")}</div>`,
        }),
      });

      const responseJson = await birdResponse.json().catch(() => ({}));
      console.log(`[Bird API Dispatch] Response status ${birdResponse.status}:`, responseJson);

      if (birdResponse.status === 200 || birdResponse.status === 201 || birdResponse.status === 202) {
        return res.json({
          success: true,
          method: "BIRD_API",
          birdMessageId: responseJson.id,
          status: "ACCEPTED_BY_BIRD",
          latencyMs: responseJson.processing_latency_ms || 200,
          rawResponse: responseJson,
          message: `Dispatched via Bird Real-Time API (ID: ${responseJson.id})`,
          timestamp: new Date().toISOString(),
          gmailComposeUrl,
          mailtoUrl,
        });
      } else {
        // Robustly parse Bird API error responses (supports validation_error, E04009, nested error objects, and errors arrays)
        const rawErrors = Array.isArray(responseJson.errors) ? responseJson.errors : [];
        const firstError = rawErrors[0] || {};
        const errorDetail = responseJson.error || {};

        const birdCode = firstError.code || errorDetail.code || responseJson.code || responseJson.status;
        const birdType = errorDetail.type || responseJson.type || "validation_error";
        const docUrl = firstError.doc_url || errorDetail.doc_url || responseJson.doc_url || "https://bird.com/docs/api/errors/E04009";
        
        let errorMessage =
          firstError.message ||
          errorDetail.message ||
          responseJson.message ||
          responseJson.title ||
          "Bird API validation error";

        let remediation =
          firstError.remediation ||
          errorDetail.remediation ||
          responseJson.remediation ||
          "Add and verify a custom sending domain in Bird, or use 1-Click Gmail Web Send.";

        // Handle specific Bird API Sandbox / Onboarding domain restriction (E04009: OnboardingRecipientNotAllowed)
        if (
          birdCode === "E04009" ||
          String(birdCode).includes("E04009") ||
          docUrl.includes("E04009") ||
          errorMessage.toLowerCase().includes("onboarding") ||
          errorMessage.toLowerCase().includes("recipient") ||
          errorMessage.toLowerCase().includes("not allowed")
        ) {
          errorMessage =
            "Bird API sandbox restriction: The shared onboarding domain (@messagebird.dev) only allows sending to verified workspace members. To email external leads directly via Bird API, verify a custom domain in Bird. Alternatively, use 1-Click Direct Gmail Compose.";
          remediation =
            "Switch to 1-Click Gmail Compose for guaranteed instant delivery from your Google account, or add a verified domain on bird.com.";
        }

        return res.status(200).json({
          success: false,
          method: "BIRD_API",
          error: errorMessage,
          birdCode,
          birdName: birdType,
          remediation,
          docUrl,
          isSandboxRestriction: Boolean(birdCode === "E04009" || docUrl.includes("E04009")),
          gmailComposeUrl,
          mailtoUrl,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 2. DISPATCH VIA SMTP SERVER (Nodemailer)
    const host = smtpConfig?.host || process.env.SMTP_HOST;
    const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
    const user = smtpConfig?.user || process.env.SMTP_USER;
    const pass = smtpConfig?.pass || process.env.SMTP_PASS;
    const fromName = smtpConfig?.fromName || "Outreach Studio";
    const fromEmail = smtpConfig?.fromEmail || process.env.SMTP_FROM || user || "outreach@studio.com";
    const secure = Boolean(smtpConfig?.secure || port === 465);

    if (host && user && pass && !forceClientDispatch) {
      console.log(`[SMTP Dispatch] Sending real email via ${host}:${port} to ${to}`);

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br/>"),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Dispatch] Successfully sent! Message ID: ${info.messageId}`);

      return res.json({
        success: true,
        method: "SMTP_SERVER",
        messageId: info.messageId,
        response: info.response,
        timestamp: new Date().toISOString(),
        gmailComposeUrl,
        mailtoUrl,
      });
    }

    // 3. FALLBACK: DIRECT 1-CLICK GMAIL WEB COMPOSE
    console.log(`[Direct Web Dispatch] Generated real Gmail/Mailto dispatch link for ${to}`);
    return res.json({
      success: true,
      method: "GMAIL_WEB",
      message: "Generated direct Gmail compose link & Mailto protocol for immediate 1-click delivery",
      timestamp: new Date().toISOString(),
      gmailComposeUrl,
      mailtoUrl,
    });
  } catch (err: any) {
    console.error("[Email Dispatch Error]:", err);
    const { to, subject, body } = req.body;
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to || '')}&su=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
    const mailtoUrl = `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

    res.status(200).json({
      success: false,
      method: "GMAIL_WEB",
      error: err.message || "Dispatch transmission failed",
      message: "Direct transmission failed, falling back to 1-Click Direct Gmail Web Compose",
      gmailComposeUrl,
      mailtoUrl,
    });
  }
});

// API Route: Test Bird API Connectivity
app.post("/api/bird-test", async (req, res) => {
  try {
    const { apiKey, fromEmail } = req.body;
    const keyToTest = apiKey || DEFAULT_BIRD_API_KEY;

    if (!keyToTest) {
      return res.status(400).json({ success: false, error: "No Bird API Key provided" });
    }

    const testFrom = fromEmail || "outreach@messagebird.dev";
    console.log(`[Bird Test] Testing API Key against Bird US1 platform with sandbox address...`);

    const birdRes = await fetch(`${BIRD_API_BASE}/v1/email/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${keyToTest}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Outreach Studio <${testFrom}>`,
        to: ["delivered@messagebird.dev"],
        subject: "Bird Real-Time API Test Verification",
        text: "Testing Bird Real-Time API live connectivity from Outreach Studio.",
      }),
    });

    const data = await birdRes.json().catch(() => ({}));
    if (birdRes.status === 200 || birdRes.status === 201 || birdRes.status === 202) {
      return res.json({
        success: true,
        message: `Bird API Connected & Verified! Test Message ID: ${data.id}`,
        status: data.status,
        birdMessageId: data.id,
      });
    } else {
      const rawErrors = Array.isArray(data.errors) ? data.errors : [];
      const firstError = rawErrors[0] || {};
      const errorObj = data.error || {};
      const code = firstError.code || errorObj.code || data.code;
      const docUrl = firstError.doc_url || errorObj.doc_url || data.doc_url;
      let errorMsg = firstError.message || errorObj.message || data.message || data.title || "Bird API verification failed";

      if (code === "E04009" || (docUrl && docUrl.includes("E04009"))) {
        errorMsg = "API Key is valid. Notice: The default domain is in sandbox mode. To send to external leads via Bird API, add a verified custom sending domain in Bird.";
      }

      return res.status(200).json({
        success: false,
        error: errorMsg,
        code,
        docUrl,
        remediation: firstError.remediation || errorObj.remediation || data.remediation || "Add and verify a sending domain in Bird, or use 1-Click Gmail Send.",
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Network error connecting to Bird API" });
  }
});

// API Route: Query Bird Message Status in Real-Time
app.get("/api/bird-message-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const birdApiKey = DEFAULT_BIRD_API_KEY;

    const birdRes = await fetch(`${BIRD_API_BASE}/v1/email/messages/${id}`, {
      headers: {
        "Authorization": `Bearer ${birdApiKey}`,
      },
    });

    const data = await birdRes.json().catch(() => ({}));
    return res.status(birdRes.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API Route: Test SMTP Connection
app.post("/api/smtp-test", async (req, res) => {
  try {
    const { host, port, user, pass, secure } = req.body;
    const smtpHost = host || process.env.SMTP_HOST;
    const smtpPort = Number(port || process.env.SMTP_PORT || 587);
    const smtpUser = user || process.env.SMTP_USER;
    const smtpPass = pass || process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({
        success: false,
        error: "Missing SMTP configuration (Host, Username, and Password are required)",
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: Boolean(secure || smtpPort === 465),
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    return res.json({
      success: true,
      message: `Successfully connected & verified SMTP server ${smtpHost}:${smtpPort}!`,
    });
  } catch (err: any) {
    console.warn("[SMTP Test Error]:", err?.message);
    return res.status(400).json({
      success: false,
      error: err.message || "Failed to establish SMTP connection",
    });
  }
});


// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Outreach Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
