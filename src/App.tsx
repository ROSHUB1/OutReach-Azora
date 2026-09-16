/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, LeadCategory, QualificationStatus, EmailTemplate, SmtpConfig, BirdConfig, DispatchMethod, DispatchLog, OAuthGmailAccount } from './types';
import { INITIAL_LEADS, DEFAULT_EMAIL_TEMPLATES } from './data/initialLeads';
import { qualifyLeadWithRules } from './utils/rulesEngine';
import { Navbar, MainTab } from './components/Navbar';
import { SequenceAutomationControl } from './components/SequenceAutomationControl';
import { MetricsOverview } from './components/MetricsOverview';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { LeadTable } from './components/LeadTable';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { AddLeadModal } from './components/AddLeadModal';
import { BatchAuditModal } from './components/BatchAuditModal';
import { OutreachComposerModal } from './components/OutreachComposerModal';
import { TemplateEditorModal } from './components/TemplateEditorModal';
import { DatasetUploadModal } from './components/DatasetUploadModal';
import { SmtpSettingsModal } from './components/SmtpSettingsModal';
import { DispatchLogsModal } from './components/DispatchLogsModal';
import { GmailAccountManager } from './components/GmailAccountManager';
import { getStoredGmailAccounts, saveStoredGmailAccounts, clearAccountToken } from './utils/gmailAuth';
import { sendEmailViaGmail } from './utils/gmailApi';
import {
  Users,
  Zap,
  BarChart3,
  FileCode,
  Clock,
  Send,
  ShieldCheck,
  Edit3,
  Sparkles,
  Radio,
  Trophy,
  Disc,
  Mail,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('outreach_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge any legacy sample mock profiles so the user's workspace is strictly real
          const realLeads = parsed.filter(
            (l: any) =>
              l &&
              !l.id?.startsWith('lead-pb-') &&
              !l.id?.startsWith('lead-str-') &&
              !l.id?.startsWith('lead-sb-') &&
              !l.id?.startsWith('lead-il-') &&
              l.email !== 'alex.vane.biz@gmail.com' &&
              l.email !== 'kaelen.stream@gmail.com' &&
              l.email !== 'elena@rostovamedia.com' &&
              l.email !== 'dev@syntaxsurge.io'
          );
          return realLeads;
        }
      }
    } catch (e) {
      console.warn('Could not parse outreach_leads from localStorage:', e);
    }
    return INITIAL_LEADS;
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('outreach_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse outreach_templates from localStorage:', e);
    }
    return DEFAULT_EMAIL_TEMPLATES;
  });

  // Sync leads safely to localStorage whenever updated with quota fallback
  useEffect(() => {
    try {
      localStorage.setItem('outreach_leads', JSON.stringify(leads));
    } catch (e) {
      console.warn('LocalStorage quota limit reached for full outreach_leads array. Saving trimmed set:', e);
      try {
        // Fallback: Store up to 50 most recent leads to stay within quota limits
        const trimmed = leads.slice(0, 50);
        localStorage.setItem('outreach_leads', JSON.stringify(trimmed));
      } catch (innerErr) {
        console.warn('LocalStorage quota critically full. Safely clearing key to prevent runtime crash.');
        try {
          localStorage.removeItem('outreach_leads');
        } catch (_) {}
      }
    }
  }, [leads]);

  // Sync templates safely to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('outreach_templates', JSON.stringify(templates));
    } catch (e) {
      console.warn('LocalStorage quota limit reached for outreach_templates:', e);
    }
  }, [templates]);

  // Main Section Tab state
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('directory');

  // Selection & Filter state
  const [selectedCategory, setSelectedCategory] = useState<LeadCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<QualificationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isProcessingSequence, setIsProcessingSequence] = useState<boolean>(false);

  // Modal / Drawer State
  const [inspectLead, setInspectLead] = useState<Lead | null>(null);
  const [composerLead, setComposerLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBatchAuditModalOpen, setIsBatchAuditModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState<boolean>(false);
  const [isDispatchLogsModalOpen, setIsDispatchLogsModalOpen] = useState<boolean>(false);

  // Real-Time Dispatch Configuration (Bird API & SMTP)
  const [birdConfig, setBirdConfig] = useState<BirdConfig>(() => {
    try {
      const saved = localStorage.getItem('bird_config');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      apiKey: 'bk_us1_KaQTuR1EomxkawrDrPJapuq4bS4Ll',
      fromEmail: 'outreach@messagebird.dev',
      fromName: 'Outreach Studio',
    };
  });

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(() => {
    try {
      const saved = localStorage.getItem('smtp_config');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });

  const [preferredDispatchMethod, setPreferredDispatchMethod] = useState<DispatchMethod>(() => {
    try {
      const saved = localStorage.getItem('preferred_dispatch_method');
      if (saved) return saved as DispatchMethod;
    } catch (_) {}
    return 'BIRD_API';
  });

  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(() => {
    try {
      const saved = localStorage.getItem('dispatch_logs');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // 5 Gmail OAuth Accounts State
  const [gmailAccounts, setGmailAccounts] = useState<OAuthGmailAccount[]>(() => {
    return getStoredGmailAccounts();
  });
  const [gmailRotationMode, setGmailRotationMode] = useState<'ROUND_ROBIN' | 'SPECIFIC_ACCOUNT'>('ROUND_ROBIN');
  const [selectedGmailAccountId, setSelectedGmailAccountId] = useState<string>('account-1');
  const lastRotationIndexRef = useRef<number>(0);

  const handleUpdateGmailAccount = (updated: OAuthGmailAccount) => {
    setGmailAccounts((prev) => {
      const updatedList = prev.map((a) => (a.id === updated.id ? updated : a));
      saveStoredGmailAccounts(updatedList);
      return updatedList;
    });
  };

  const handleDisconnectGmailAccount = (accountId: string) => {
    clearAccountToken(accountId);
    setGmailAccounts((prev) => {
      const updatedList = prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              email: '',
              name: `Gmail Sender ${a.slotIndex + 1}`,
              accessToken: null,
              isConnected: false,
              photoUrl: undefined,
              dailySentCount: 0,
            }
          : a
      );
      saveStoredGmailAccounts(updatedList);
      return updatedList;
    });
    showToast(`Unlinked Gmail account from Slot #${accountId.replace('account-', '')}`);
  };

  const handleSaveBirdConfig = (config: BirdConfig) => {
    setBirdConfig(config);
    try {
      localStorage.setItem('bird_config', JSON.stringify(config));
    } catch (_) {}
    showToast('✓ Saved Bird Email API configuration!');
  };

  const handleSaveSmtpConfig = (config: SmtpConfig | null) => {
    setSmtpConfig(config);
    try {
      if (config) localStorage.setItem('smtp_config', JSON.stringify(config));
      else localStorage.removeItem('smtp_config');
    } catch (_) {}
    showToast('✓ Saved SMTP server configuration!');
  };

  const handleSavePreferredMethod = (method: DispatchMethod) => {
    setPreferredDispatchMethod(method);
    try {
      localStorage.setItem('preferred_dispatch_method', method);
    } catch (_) {}
    showToast(`✓ Active dispatch method changed to ${method === 'BIRD_API' ? 'Bird Email API' : method === 'GMAIL_WEB' ? 'Gmail Web Direct' : 'SMTP Server'}`);
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Import parsed leads from dataset file
  const handleImportLeads = (newLeadsData: Partial<Lead>[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const createdLeads: Lead[] = newLeadsData.map((data, idx) => {
      const baseLead: Lead = {
        id: `imported-${Date.now()}-${idx}`,
        name: data.name || 'Target Lead',
        email: data.email || `lead_${Date.now()}_${idx}@target.com`,
        companyOrBrand: data.companyOrBrand || data.name || 'Brand Target',
        category: data.category || 'PERSONAL_BRAND',
        qualificationStatus: 'NEEDS_AUDIT',
        sequenceStatus: 'NOT_STARTED',
        outreachStatus: 'UNSENT',
        matchScore: 0,
        gateChecks: [],
        details: {},
        instagramHandle: data.instagramHandle,
        youtubeUrl: data.youtubeUrl,
        twitchOrKickUrl: data.twitchOrKickUrl,
        websiteUrl: data.websiteUrl,
        notes: data.notes || 'Imported via dataset file upload',
        createdAt: todayStr,
      };

      // Run instant local qualification rules engine
      const ruleResult = qualifyLeadWithRules(baseLead, templates);
      return {
        ...baseLead,
        qualificationStatus: ruleResult.qualificationStatus,
        matchScore: ruleResult.matchScore,
        gateChecks: ruleResult.gateChecks,
        aiInsights: ruleResult.aiInsights,
        personalizedEmail: ruleResult.personalizedEmail,
        lastAuditDate: todayStr,
      };
    });

    setLeads((prev) => [...createdLeads, ...prev]);
    showToast(`Successfully imported & qualified ${createdLeads.length} leads into pipeline!`);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: leads.length,
      PERSONAL_BRAND: leads.filter((l) => l.category === 'PERSONAL_BRAND').length,
      STREAMER: leads.filter((l) => l.category === 'STREAMER').length,
      SPORTSBOOK: leads.filter((l) => l.category === 'SPORTSBOOK').length,
      INDIE_LABEL: leads.filter((l) => l.category === 'INDIE_LABEL').length,
    };
  }, [leads]);

  // Sequence Counts
  const sequenceCounts = useMemo(() => {
    return {
      notStarted: leads.filter((l) => !l.sequenceStatus || l.sequenceStatus === 'NOT_STARTED').length,
      initialSent: leads.filter((l) => l.sequenceStatus === 'INITIAL_SENT').length,
      followupDue: leads.filter((l) => l.sequenceStatus === 'FOLLOWUP_DUE').length,
      followupSent: leads.filter((l) => l.sequenceStatus === 'FOLLOWUP_SENT').length,
      replied: leads.filter((l) => l.sequenceStatus === 'REPLIED' || l.sequenceStatus === 'CLOSED').length,
    };
  }, [leads]);

  // Master 1-Click Auto-Pilot Sequence Engine (Audit + Initial Send + 2-Day Bump)
  const handleRunFullSequence = async () => {
    setIsProcessingSequence(true);
    showToast('🚀 Running Master 1-Click Auto-Pilot: Audit, Initial Send & 2-Day Re-Outreach...');

    await new Promise((resolve) => setTimeout(resolve, 600));

    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const twoDaysLaterStr = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Ensure lead is audited if NEEDS_AUDIT
        let currentLead = lead;
        if (currentLead.qualificationStatus === 'NEEDS_AUDIT') {
          const ruleResult = qualifyLeadWithRules(currentLead, templates);
          currentLead = {
            ...currentLead,
            qualificationStatus: ruleResult.qualificationStatus,
            matchScore: ruleResult.matchScore,
            gateChecks: ruleResult.gateChecks,
            aiInsights: ruleResult.aiInsights,
            personalizedEmail: ruleResult.personalizedEmail,
            lastAuditDate: todayStr,
          };
        }

        // 1. If NOT_STARTED -> Send Initial Outreach + Schedule 2-day follow-up
        if (!currentLead.sequenceStatus || currentLead.sequenceStatus === 'NOT_STARTED') {
          const ruleResult = qualifyLeadWithRules(currentLead, templates);
          return {
            ...currentLead,
            sequenceStatus: 'INITIAL_SENT',
            outreachStatus: 'SENT',
            initialSentDate: todayStr,
            followupDueDate: twoDaysLaterStr,
            personalizedEmail: currentLead.personalizedEmail || ruleResult.personalizedEmail,
          };
        }

        // 2. If FOLLOWUP_DUE or INITIAL_SENT -> Send 2-Day Follow-Up Bump
        if (currentLead.sequenceStatus === 'FOLLOWUP_DUE' || currentLead.sequenceStatus === 'INITIAL_SENT') {
          return {
            ...currentLead,
            sequenceStatus: 'FOLLOWUP_SENT',
            outreachStatus: 'SENT',
            followupSentDate: todayStr,
          };
        }

        return currentLead;
      })
    );

    setIsProcessingSequence(false);
    showToast('⚡ Master sequence complete! Initial emails dispatched & 2-day re-outreach bumps active.');
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Category filter
      if (selectedCategory !== 'ALL' && lead.category !== selectedCategory) {
        return false;
      }
      // Qualification status filter
      if (selectedStatus !== 'ALL' && lead.qualificationStatus !== selectedStatus) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchEmail = lead.email.toLowerCase().includes(q);
        const matchBrand = (lead.companyOrBrand || '').toLowerCase().includes(q);
        const matchIg = (lead.instagramHandle || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchBrand && !matchIg) {
          return false;
        }
      }
      return true;
    });
  }, [leads, selectedCategory, selectedStatus, searchQuery]);

  // Toggle single lead selection
  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleSelectAllLeads = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  // Add new leads
  const handleAddLeads = (newLeadsData: Partial<Lead>[]) => {
    const formattedNewLeads: Lead[] = newLeadsData.map((data, idx) => ({
      id: `lead-custom-${Date.now()}-${idx}`,
      name: data.name || 'New Creator Lead',
      email: data.email || 'lead@gmail.com',
      category: data.category || 'PERSONAL_BRAND',
      companyOrBrand: data.companyOrBrand || data.name || 'Brand',
      instagramHandle: data.instagramHandle,
      youtubeUrl: data.youtubeUrl,
      twitchOrKickUrl: data.twitchOrKickUrl,
      websiteUrl: data.websiteUrl,
      qualificationStatus: 'NEEDS_AUDIT',
      outreachStatus: 'UNSENT',
      sequenceStatus: 'NOT_STARTED',
      matchScore: 85,
      notes: data.notes || 'Awaiting Category Gate Audit.',
      details: data.details || {},
      gateChecks: [
        { id: 'g1', label: 'English Speaking', description: 'English language profile', passed: true },
        { id: 'g2', label: 'Category Must-Haves', description: 'Pending Gate evaluation', passed: true },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    }));

    setLeads((prev) => [...formattedNewLeads, ...prev]);
    showToast(`Added ${formattedNewLeads.length} new Gmail lead(s) to queue.`);
  };

  // Clear All Data
  const handleClearAllLeads = () => {
    setLeads([]);
    setSelectedLeadIds([]);
    try {
      localStorage.removeItem('outreach_leads');
    } catch (_) {}
    showToast('Cleared pipeline leads.');
  };

  // Run single gate audit using local rules engine
  const handleRunSingleAudit = async (leadToAudit: Lead) => {
    showToast(`Auditing ${leadToAudit.name} via Rules Engine...`);
    const data = qualifyLeadWithRules(leadToAudit, templates);

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadToAudit.id
          ? {
              ...l,
              qualificationStatus: data.qualificationStatus,
              matchScore: data.matchScore,
              gateChecks: data.gateChecks,
              aiInsights: data.aiInsights,
              personalizedEmail: data.personalizedEmail,
              lastAuditDate: new Date().toISOString().split('T')[0],
            }
          : l
      )
    );

    if (inspectLead?.id === leadToAudit.id) {
      setInspectLead((prev) =>
        prev
          ? {
              ...prev,
              qualificationStatus: data.qualificationStatus,
              matchScore: data.matchScore,
              gateChecks: data.gateChecks,
              aiInsights: data.aiInsights,
              personalizedEmail: data.personalizedEmail,
            }
          : null
      );
    }

    showToast(`✓ Audit complete for ${leadToAudit.name}: ${data.qualificationStatus}`);
  };

  // Update batch audited leads
  const handleAuditComplete = (updatedLeads: Lead[]) => {
    setLeads((prev) =>
      prev.map((existing) => {
        const match = updatedLeads.find((u) => u.id === existing.id);
        return match || existing;
      })
    );
    showToast(`Batch AI Gate Audit complete for ${updatedLeads.length} leads.`);
  };

  // Handle outreach send / status update
  const handleSendOutreach = (
    leadId: string,
    subject: string,
    body: string,
    dmScript: string,
    dispatchMethod: DispatchMethod = preferredDispatchMethod,
    dispatchResult?: any
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);

    // Record real-time dispatch audit log
    const newLog: DispatchLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId,
      leadName: targetLead?.name || 'Target Lead',
      recipientEmail: targetLead?.email || 'lead@domain.com',
      subject,
      method: dispatchMethod,
      status: dispatchResult?.status || (dispatchMethod === 'BIRD_API' ? 'ACCEPTED_BY_BIRD' : 'DISPATCHED'),
      timestamp: new Date().toISOString(),
      messageId: dispatchResult?.messageId || dispatchResult?.id,
      responseMessage: dispatchResult?.remediation || dispatchResult?.message || (dispatchMethod === 'BIRD_API' ? 'Transmitted via Bird Email API' : 'Opened in 1-Click Gmail Web Direct'),
    };

    setDispatchLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 100);
      try {
        localStorage.setItem('dispatch_logs', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              outreachStatus: 'SENT',
              personalizedEmail: {
                subject,
                body,
                instagramDmScript: dmScript,
                sentAt: new Date().toISOString(),
                method: dispatchMethod,
              },
            }
          : l
      )
    );

    if (dispatchMethod === 'BIRD_API' && dispatchResult?.status === 'ACCEPTED_BY_BIRD') {
      showToast(`⚡ Real-Time Bird API accepted! ID: ${dispatchResult.messageId?.slice(0, 8)}...`);
    } else {
      showToast('Outreach dispatched & lead marked as SENT.');
    }
  };

  // Delete lead
  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelectedLeadIds((prev) => prev.filter((i) => i !== id));
    showToast('Target lead deleted.');
  };

  // Quick 1-Click Direct Email Dispatch (Uses configured preferredMethod or connected Gmail)
  const handleQuickSendEmail = async (leadToSend: Lead) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isFollowup = leadToSend.sequenceStatus === 'INITIAL_SENT' || leadToSend.sequenceStatus === 'FOLLOWUP_DUE';
    const nextSequenceStatus = isFollowup ? 'FOLLOWUP_SENT' : 'INITIAL_SENT';

    const defaultTpl = templates.find((t) => t.category === leadToSend.category) || templates[0];
    const subject = leadToSend.personalizedEmail?.subject || defaultTpl.subjectTemplate.replace(/{name}/g, leadToSend.name);
    const body = leadToSend.personalizedEmail?.body || defaultTpl.bodyTemplate.replace(/{name}/g, leadToSend.name);
    const dmScript = leadToSend.personalizedEmail?.instagramDmScript || defaultTpl.dmTemplate.replace(/{name}/g, leadToSend.name);

    // Pick active connected Gmail account if available
    const activeGmails = gmailAccounts.filter((a) => a.isConnected && a.isActive);
    let chosenGmail: OAuthGmailAccount | undefined;
    if (activeGmails.length > 0) {
      if (gmailRotationMode === 'ROUND_ROBIN') {
        const nextIdx = lastRotationIndexRef.current % activeGmails.length;
        chosenGmail = activeGmails[nextIdx];
        lastRotationIndexRef.current = nextIdx + 1;
      } else {
        chosenGmail = activeGmails.find((a) => a.id === selectedGmailAccountId) || activeGmails[0];
      }
    }

    if (chosenGmail) {
      showToast(`⚡ Sending to ${leadToSend.name} via ${chosenGmail.email} (Slot #${chosenGmail.slotIndex + 1})...`);
      try {
        const result = await sendEmailViaGmail({
          to: leadToSend.email,
          subject,
          body,
          fromName: chosenGmail.name,
          fromEmail: chosenGmail.email,
          accessToken: chosenGmail.accessToken || undefined,
          accountId: chosenGmail.id,
        });

        if (result.success) {
          handleUpdateGmailAccount({
            ...chosenGmail,
            dailySentCount: (chosenGmail.dailySentCount || 0) + 1,
            lastSentAt: new Date().toISOString(),
          });
          handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_API', result);
          showToast(`✓ Dispatched via Gmail API (${chosenGmail.email})`);
        } else {
          showToast(`Gmail API: ${result.error || 'Opening 1-Click Compose fallback...'}`);
          const fallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadToSend.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(fallbackUrl, '_blank');
          handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_WEB', result);
        }
      } catch (err: any) {
        const fallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadToSend.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(fallbackUrl, '_blank');
        handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_WEB');
      }
    } else if (preferredDispatchMethod === 'BIRD_API') {
      showToast(`⚡ Sending to ${leadToSend.name} via Bird API...`);
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: leadToSend.email,
            subject,
            body,
            leadId: leadToSend.id,
            leadName: leadToSend.name,
            dispatchMethod: 'BIRD_API',
            birdConfig,
          }),
        });
        const result = await res.json();
        if (result.success) {
          handleSendOutreach(leadToSend.id, subject, body, dmScript, 'BIRD_API', result);
        } else {
          // If Bird rejected with OnboardingRecipientNotAllowed (E04009) or another error, seamlessly open 1-Click Gmail Web
          if (result.isSandboxRestriction || result.birdCode === 'E04009') {
            showToast('Bird Sandbox: Opening 1-Click Gmail Compose...');
          } else {
            showToast(`Bird API notice: Opening 1-Click Gmail Compose fallback...`);
          }
          const fallbackUrl =
            result.gmailComposeUrl ||
            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadToSend.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(fallbackUrl, '_blank');
          handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_WEB', result);
        }
      } catch (err: any) {
        const fallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadToSend.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(fallbackUrl, '_blank');
        handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_WEB');
      }
    } else if (preferredDispatchMethod === 'SMTP_SERVER') {
      showToast(`Sending to ${leadToSend.name} via SMTP...`);
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: leadToSend.email,
            subject,
            body,
            leadId: leadToSend.id,
            leadName: leadToSend.name,
            dispatchMethod: 'SMTP_SERVER',
            smtpConfig,
          }),
        });
        const result = await res.json();
        handleSendOutreach(leadToSend.id, subject, body, dmScript, 'SMTP_SERVER', result);
      } catch (err) {
        const fallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadToSend.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(fallbackUrl, '_blank');
        handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_WEB');
      }
    } else {
      // 1-Click Direct Gmail Web Compose
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadToSend.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, '_blank');
      handleSendOutreach(leadToSend.id, subject, body, dmScript, 'GMAIL_WEB');
    }

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadToSend.id
          ? {
              ...l,
              sequenceStatus: nextSequenceStatus,
              initialSentDate: l.initialSentDate || todayStr,
              followupDueDate: isFollowup ? undefined : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              followupSentDate: isFollowup ? todayStr : l.followupSentDate,
            }
          : l
      )
    );
  };

  // Save updated template
  const handleSaveTemplate = (updated: EmailTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.category === updated.category ? updated : t)));
    setIsTemplateModalOpen(false);
    showToast(`Updated outreach template for ${updated.category.replace('_', ' ')}.`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-white/10 bg-[#12141c]/95 backdrop-blur-md px-4 py-3 text-xs font-mono text-zinc-100 shadow-2xl animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeMainTab={activeMainTab}
        onSelectMainTab={setActiveMainTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBatchAuditModal={() => setIsBatchAuditModalOpen(true)}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenDispatchSettings={() => setIsSmtpModalOpen(true)}
        onOpenDispatchLogs={() => setIsDispatchLogsModalOpen(true)}
        onRunFullSequence={handleRunFullSequence}
        totalLeadsCount={leads.length}
        qualifiedCount={categoryCounts.all ? leads.filter((l) => l.qualificationStatus === 'QUALIFIED').length : 0}
        dispatchLogsCount={dispatchLogs.length}
        connectedGmailCount={gmailAccounts.filter((a) => a.isConnected).length}
        activeDispatchMethod={preferredDispatchMethod}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onClearData={handleClearAllLeads}
        isProcessingSequence={isProcessingSequence}
      />

      {/* Main Content Workspace */}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-5">
        <AnimatePresence mode="wait">
          {activeMainTab === 'directory' && (
            <motion.div
              key="directory"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Directory Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                      Outreach Pipeline
                    </h1>
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300 font-mono border border-zinc-700/50">
                      {leads.length} Contacts
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Review target prospects, track qualification gates, and dispatch 2-day outreach sequences.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono">
                    <span>Qualified: <strong className="text-zinc-200">{leads.filter((l) => l.qualificationStatus === 'QUALIFIED').length}</strong></span>
                    <span className="text-zinc-700">•</span>
                    <span>Sent: <strong className="text-zinc-200">{sequenceCounts.initialSent + sequenceCounts.followupSent}</strong></span>
                    <span className="text-zinc-700">•</span>
                    <span>Follow-up Due: <strong className={sequenceCounts.followupDue > 0 ? 'text-amber-400 font-semibold' : 'text-zinc-200'}>{sequenceCounts.followupDue}</strong></span>
                  </div>

                  <button
                    onClick={handleRunFullSequence}
                    disabled={isProcessingSequence}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5 fill-white" />
                    <span>{isProcessingSequence ? 'Running Sequence...' : 'Run Sequence'}</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar & Search */}
              <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                counts={categoryCounts}
              />

              {/* Lead Data Table */}
              <LeadTable
                leads={filteredLeads}
                selectedLeadIds={selectedLeadIds}
                onToggleSelectLead={handleToggleSelectLead}
                onSelectAllLeads={handleSelectAllLeads}
                onOpenLeadDetail={(lead) => setInspectLead(lead)}
                onOpenOutreachComposer={(lead) => setComposerLead(lead)}
                onQuickSendEmail={handleQuickSendEmail}
                onRunSingleAudit={handleRunSingleAudit}
                onDeleteLead={handleDeleteLead}
                onBatchAuditSelected={() => setIsBatchAuditModalOpen(true)}
                onBatchOutreachSelected={() => {
                  const first = leads.find((l) => selectedLeadIds.includes(l.id));
                  if (first) setComposerLead(first);
                }}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
              />
            </motion.div>
          )}

          {activeMainTab === 'sequence' && (
            <motion.div
              key="sequence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Automated 2-Day Outreach & Follow-Up Engine Bar */}
              <SequenceAutomationControl
                leads={leads}
                onRunFullSequence={handleRunFullSequence}
                onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onNavigateToSenders={() => setActiveMainTab('senders')}
                gmailAccounts={gmailAccounts}
                rotationMode={gmailRotationMode}
                isProcessing={isProcessingSequence}
              />

              {/* Sequence Drip Pipeline Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Ready for Initial Outreach */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Ready for Outreach
                    </span>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                      {sequenceCounts.notStarted} Leads
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Target leads qualified by OP rules engine ready for initial cold outreach.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {leads
                      .filter((l) => !l.sequenceStatus || l.sequenceStatus === 'NOT_STARTED')
                      .slice(0, 5)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-2.5"
                        >
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{lead.name}</span>
                            <span className="text-[10px] text-zinc-400">{lead.companyOrBrand}</span>
                          </div>
                          <button
                            onClick={() => setComposerLead(lead)}
                            className="shrink-0 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/30"
                          >
                            Send
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. Initial Sent (Day 0) */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      Initial Sent (Day 0)
                    </span>
                    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-300 border border-sky-500/30">
                      {sequenceCounts.initialSent} Leads
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    First email launched. Waiting 48 hours for automated follow-up check.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {leads
                      .filter((l) => l.sequenceStatus === 'INITIAL_SENT')
                      .slice(0, 5)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-2.5"
                        >
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{lead.name}</span>
                            <span className="text-[10px] text-sky-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Due in 2 days
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. 2-Day Follow-Up Due */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] backdrop-blur-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" /> 2-Day Follow-Up Due
                    </span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                      {sequenceCounts.followupDue} Leads
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    48 hours elapsed! Follow-up email is ready to be dispatched.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {leads
                      .filter((l) => l.sequenceStatus === 'FOLLOWUP_DUE')
                      .slice(0, 5)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-black/60 p-2.5"
                        >
                          <div className="truncate">
                            <span className="font-bold text-amber-200 block truncate">{lead.name}</span>
                            <span className="text-[10px] text-amber-400 font-semibold">Ready now</span>
                          </div>
                          <button
                            onClick={() => setComposerLead(lead)}
                            className="shrink-0 text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 px-2 py-1 rounded border border-amber-500/40"
                          >
                            Follow Up
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 4. Sequence Completed */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Sequence Completed
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                      {sequenceCounts.followupSent + sequenceCounts.replied} Leads
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    2-Day outreach cycle completed. Follow-up dispatched or lead engaged.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {leads
                      .filter((l) => l.sequenceStatus === 'FOLLOWUP_SENT' || l.sequenceStatus === 'REPLIED')
                      .slice(0, 5)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-2.5"
                        >
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{lead.name}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">Done</span>
                          </div>
                          <span className="text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === 'senders' && (
            <motion.div
              key="senders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <GmailAccountManager
                accounts={gmailAccounts}
                onUpdateAccount={handleUpdateGmailAccount}
                onDisconnectAccount={handleDisconnectGmailAccount}
                rotationMode={gmailRotationMode}
                onToggleRotationMode={setGmailRotationMode}
                selectedSingleAccountId={selectedGmailAccountId}
                onSelectSingleAccount={setSelectedGmailAccountId}
                onShowToast={showToast}
              />
            </motion.div>
          )}

          {activeMainTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Key Sequence Metrics Overview */}
              <MetricsOverview leads={leads} />

              {/* Niche Category Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    category: 'PERSONAL_BRAND',
                    title: 'Personal Brands',
                    icon: <Sparkles className="h-5 w-5 text-amber-400" />,
                    leadsCount: categoryCounts.PERSONAL_BRAND,
                    avgMatch: Math.round(
                      leads
                        .filter((l) => l.category === 'PERSONAL_BRAND')
                        .reduce((acc, l) => acc + l.matchScore, 0) /
                        Math.max(1, categoryCounts.PERSONAL_BRAND)
                    ),
                    gateFocus: 'Engagement & Bio Link',
                  },
                  {
                    category: 'STREAMER',
                    title: 'Streamers (Twitch/Kick)',
                    icon: <Radio className="h-5 w-5 text-purple-400" />,
                    leadsCount: categoryCounts.STREAMER,
                    avgMatch: Math.round(
                      leads
                        .filter((l) => l.category === 'STREAMER')
                        .reduce((acc, l) => acc + l.matchScore, 0) /
                        Math.max(1, categoryCounts.STREAMER)
                    ),
                    gateFocus: 'Live Viewers & Sponsors',
                  },
                  {
                    category: 'SPORTSBOOK',
                    title: 'Sportsbooks',
                    icon: <Trophy className="h-5 w-5 text-emerald-400" />,
                    leadsCount: categoryCounts.SPORTSBOOK,
                    avgMatch: Math.round(
                      leads
                        .filter((l) => l.category === 'SPORTSBOOK')
                        .reduce((acc, l) => acc + l.matchScore, 0) /
                        Math.max(1, categoryCounts.SPORTSBOOK)
                    ),
                    gateFocus: 'GEO Licensing & Compliance',
                  },
                  {
                    category: 'INDIE_LABEL',
                    title: 'Indie Record Labels',
                    icon: <Disc className="h-5 w-5 text-cyan-400" />,
                    leadsCount: categoryCounts.INDIE_LABEL,
                    avgMatch: Math.round(
                      leads
                        .filter((l) => l.category === 'INDIE_LABEL')
                        .reduce((acc, l) => acc + l.matchScore, 0) /
                        Math.max(1, categoryCounts.INDIE_LABEL)
                    ),
                    gateFocus: 'Roster & Sync Rights',
                  },
                ].map((item) => (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 space-y-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <h3 className="font-bold text-white text-sm">{item.title}</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                      <div className="rounded-lg bg-black/40 p-2.5 border border-white/10">
                        <span className="text-[10px] text-zinc-400 block">TARGETS</span>
                        <span className="text-sm font-bold text-white">{item.leadsCount}</span>
                      </div>
                      <div className="rounded-lg bg-black/40 p-2.5 border border-white/10">
                        <span className="text-[10px] text-zinc-400 block">AVG MATCH</span>
                        <span className="text-sm font-bold text-emerald-400">{item.avgMatch}%</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between pt-1 border-t border-white/10">
                      <span>Gate Focus:</span>
                      <span className="text-zinc-200">{item.gateFocus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeMainTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-indigo-400" />
                    <span>Niche Outreach Templates & Gate Rules</span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Customized Gmail & Instagram DM outreach templates with category-specific gate criteria.
                  </p>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Launch Template Editor</span>
                </button>
              </div>

              {/* Template Showcase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((tpl) => (
                  <div
                    key={tpl.category}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        {tpl.category === 'PERSONAL_BRAND' && <Sparkles className="h-4 w-4 text-amber-400" />}
                        {tpl.category === 'STREAMER' && <Radio className="h-4 w-4 text-purple-400" />}
                        {tpl.category === 'SPORTSBOOK' && <Trophy className="h-4 w-4 text-emerald-400" />}
                        {tpl.category === 'INDIE_LABEL' && <Disc className="h-4 w-4 text-cyan-400" />}
                        <h3 className="font-mono text-sm font-bold text-white">
                          {tpl.category.replace('_', ' ')} OUTREACH
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                          SUBJECT TEMPLATE:
                        </span>
                        <div className="rounded-lg bg-black/40 p-2.5 border border-white/10 text-zinc-200">
                          {tpl.subjectTemplate}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                          GMAIL BODY TEMPLATE:
                        </span>
                        <div className="rounded-lg bg-black/40 p-3 border border-white/10 text-zinc-300 leading-relaxed whitespace-pre-wrap text-[11px] max-h-36 overflow-y-auto">
                          {tpl.bodyTemplate}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-pink-300 uppercase tracking-wider block mb-1">
                          INSTAGRAM DM SCRIPT:
                        </span>
                        <div className="rounded-lg bg-black/40 p-2.5 border border-white/10 text-pink-200 text-[11px]">
                          {tpl.dmTemplate}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Lead Detail Drawer / Inspector */}
      <LeadDetailDrawer
        lead={inspectLead}
        onClose={() => setInspectLead(null)}
        onRunAudit={handleRunSingleAudit}
        onOpenComposer={(lead) => {
          setInspectLead(null);
          setComposerLead(lead);
        }}
        onUpdateLeadStatus={(id, qualStatus, outreachStatus) => {
          setLeads((prev) =>
            prev.map((l) => (l.id === id ? { ...l, qualificationStatus: qualStatus, outreachStatus } : l))
          );
        }}
      />

      {/* Add Gmail Lead Modal */}
      {isAddModalOpen && (
        <AddLeadModal
          onClose={() => setIsAddModalOpen(false)}
          onAddLeads={handleAddLeads}
        />
      )}

      {/* Batch AI Audit Modal */}
      {isBatchAuditModalOpen && (
        <BatchAuditModal
          leads={
            selectedLeadIds.length > 0
              ? leads.filter((l) => selectedLeadIds.includes(l.id))
              : leads
          }
          templates={templates}
          onClose={() => setIsBatchAuditModalOpen(false)}
          onAuditComplete={handleAuditComplete}
        />
      )}

      {/* Outreach Composer Modal */}
      {composerLead && (
        <OutreachComposerModal
          lead={composerLead}
          templates={templates}
          birdConfig={birdConfig}
          smtpConfig={smtpConfig}
          gmailAccounts={gmailAccounts}
          preferredMethod={preferredDispatchMethod}
          onClose={() => setComposerLead(null)}
          onSendOutreach={handleSendOutreach}
        />
      )}

      {/* Template Editor Modal */}
      {isTemplateModalOpen && (
        <TemplateEditorModal
          templates={templates}
          onClose={() => setIsTemplateModalOpen(false)}
          onSaveTemplate={handleSaveTemplate}
        />
      )}

      {/* Dataset File Upload Modal */}
      {isUploadModalOpen && (
        <DatasetUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onImportLeads={handleImportLeads}
        />
      )}

      {/* Real-Time Dispatch & Bird API Engine Settings Modal */}
      {isSmtpModalOpen && (
        <SmtpSettingsModal
          onClose={() => setIsSmtpModalOpen(false)}
          birdConfig={birdConfig}
          onSaveBirdConfig={handleSaveBirdConfig}
          smtpConfig={smtpConfig}
          onSaveSmtpConfig={handleSaveSmtpConfig}
          preferredMethod={preferredDispatchMethod}
          onSavePreferredMethod={handleSavePreferredMethod}
        />
      )}

      {/* Live Real-Time Dispatch Audit & Delivery Logs Modal */}
      {isDispatchLogsModalOpen && (
        <DispatchLogsModal
          onClose={() => setIsDispatchLogsModalOpen(false)}
          logs={dispatchLogs}
          onClearLogs={() => {
            setDispatchLogs([]);
            try {
              localStorage.removeItem('dispatch_logs');
            } catch (_) {}
            showToast('Cleared real-time dispatch log history.');
          }}
        />
      )}
    </div>
  );
}

