import { getAccountToken } from './gmailAuth';

export interface SendGmailParams {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  accessToken?: string;
  accountId?: string;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  senderEmail?: string;
  error?: string;
  rawResponse?: any;
}

/**
 * Base64URL encode string conforming to RFC 4648
 */
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Dispatches an email directly through the Google Gmail REST API using the user's OAuth access token.
 */
export async function sendEmailViaGmail({
  to,
  subject,
  body,
  fromName,
  fromEmail,
  accessToken,
  accountId,
}: SendGmailParams): Promise<GmailSendResult> {
  const token = accessToken || (accountId ? getAccountToken(accountId) : null);

  if (!token) {
    throw new Error('No active Gmail OAuth access token found for this account. Please reconnect your Gmail account in the dashboard.');
  }

  // Construct RFC 2822 payload
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const fromHeader = fromName && fromEmail ? `${fromName} <${fromEmail}>` : (fromEmail || 'me');

  const emailLines = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedRaw = base64UrlEncode(rawMessage);

  try {
    // Attempt direct call to Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedRaw,
      }),
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = resJson.error?.message || `Gmail API error (${response.status})`;
      // Try backend proxy fallback if CORS or token scope issue
      const proxyRes = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          fromName,
          fromEmail,
          raw: encodedRaw,
        }),
      });

      const proxyJson = await proxyRes.json().catch(() => ({}));
      if (proxyRes.ok && proxyJson.success) {
        return {
          success: true,
          messageId: proxyJson.messageId,
          threadId: proxyJson.threadId,
          senderEmail: fromEmail,
          rawResponse: proxyJson,
        };
      }

      throw new Error(errMsg);
    }

    return {
      success: true,
      messageId: resJson.id,
      threadId: resJson.threadId,
      senderEmail: fromEmail,
      rawResponse: resJson,
    };
  } catch (error: any) {
    console.error('Gmail API send error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending email via Gmail API.',
    };
  }
}
