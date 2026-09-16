import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { OAuthGmailAccount } from '../types';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// In-memory token store per account slot (prevents storing tokens in localStorage)
const accountTokens: Record<string, string> = {};

export const setAccountToken = (accountId: string, token: string) => {
  accountTokens[accountId] = token;
};

export const getAccountToken = (accountId: string): string | null => {
  return accountTokens[accountId] || null;
};

export const clearAccountToken = (accountId: string) => {
  delete accountTokens[accountId];
};

/**
 * Connects a Gmail account via Google Identity Services (GSI) or Firebase OAuth popup
 */
export async function connectGmailAccount(slotIndex: number): Promise<OAuthGmailAccount> {
  const accountId = `account-${slotIndex + 1}`;

  // Method 1: Google Identity Services (GSI) Token Client (Standard Google OAuth 2.0)
  if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
    try {
      const token = await new Promise<string>((resolve, reject) => {
        try {
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: firebaseConfig.oAuthClientId,
            scope: GMAIL_SCOPES.join(' '),
            prompt: 'select_account consent',
            callback: (tokenResponse: any) => {
              if (tokenResponse?.error) {
                if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
                  const err: any = new Error('Google Sign-In popup was closed or cancelled.');
                  err.isCancelled = true;
                  reject(err);
                } else {
                  reject(new Error(tokenResponse.error_description || tokenResponse.error));
                }
              } else if (tokenResponse?.access_token) {
                resolve(tokenResponse.access_token);
              } else {
                reject(new Error('No access token received from Google OAuth.'));
              }
            },
            error_callback: (nonOAuthErr: any) => {
              if (nonOAuthErr?.type === 'popup_closed' || nonOAuthErr?.type === 'popup_failed_to_open') {
                const err: any = new Error('Google Sign-In popup was closed or blocked by browser.');
                err.isCancelled = true;
                reject(err);
              } else {
                reject(new Error(nonOAuthErr?.message || 'Google OAuth popup error.'));
              }
            },
          });

          tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch (initErr) {
          reject(initErr);
        }
      });

      // Fetch user profile using access token
      let userEmail = `sender${slotIndex + 1}@gmail.com`;
      let userName = `Gmail Sender ${slotIndex + 1}`;
      let userPhoto: string | undefined;

      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          if (info.email) userEmail = info.email;
          if (info.name) userName = info.name;
          if (info.picture) userPhoto = info.picture;
        }
      } catch (profileErr) {
        console.warn('Could not fetch Google profile details, using defaults:', profileErr);
      }

      setAccountToken(accountId, token);

      const account: OAuthGmailAccount = {
        id: accountId,
        slotIndex,
        email: userEmail,
        name: userName,
        photoUrl: userPhoto,
        accessToken: token,
        tokenExpiresAt: Date.now() + 3600 * 1000,
        isConnected: true,
        isActive: true,
        dailySentCount: 0,
        dailyQuotaLimit: 500,
        connectedAt: new Date().toISOString(),
      };

      return account;
    } catch (gsiError: any) {
      if (gsiError?.isCancelled) {
        throw gsiError;
      }
      console.warn('GSI token client failed, attempting Firebase Auth fallback:', gsiError);
    }
  }

  // Method 2: Firebase Google Auth Provider Popup fallback
  const provider = new GoogleAuthProvider();
  GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'select_account consent',
    access_type: 'offline',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    const accessToken = credential?.accessToken || null;
    const user = result.user;

    if (!accessToken) {
      throw new Error('No access token returned from Google authentication.');
    }

    setAccountToken(accountId, accessToken);

    const account: OAuthGmailAccount = {
      id: accountId,
      slotIndex,
      email: user.email || `account${slotIndex + 1}@gmail.com`,
      name: user.displayName || user.email?.split('@')[0] || `Gmail Account #${slotIndex + 1}`,
      photoUrl: user.photoURL || undefined,
      accessToken,
      tokenExpiresAt: Date.now() + 3600 * 1000,
      isConnected: true,
      isActive: true,
      dailySentCount: 0,
      dailyQuotaLimit: 500,
      connectedAt: new Date().toISOString(),
    };

    return account;
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.message?.includes('popup-closed-by-user')
    ) {
      const friendlyErr: any = new Error('Sign-in cancelled: The Google login popup was closed.');
      friendlyErr.isCancelled = true;
      throw friendlyErr;
    }

    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popups were blocked by your browser. Please allow popups or open the app in a new tab.');
    }

    throw error;
  }
}

/**
 * Initial empty 5 Gmail accounts slots structure
 */
export const INITIAL_GMAIL_ACCOUNTS: OAuthGmailAccount[] = [
  {
    id: 'account-1',
    slotIndex: 0,
    email: '',
    name: 'Gmail Sender 1',
    accessToken: null,
    isConnected: false,
    isActive: true,
    dailySentCount: 0,
    dailyQuotaLimit: 500,
  },
  {
    id: 'account-2',
    slotIndex: 1,
    email: '',
    name: 'Gmail Sender 2',
    accessToken: null,
    isConnected: false,
    isActive: true,
    dailySentCount: 0,
    dailyQuotaLimit: 500,
  },
  {
    id: 'account-3',
    slotIndex: 2,
    email: '',
    name: 'Gmail Sender 3',
    accessToken: null,
    isConnected: false,
    isActive: true,
    dailySentCount: 0,
    dailyQuotaLimit: 500,
  },
  {
    id: 'account-4',
    slotIndex: 3,
    email: '',
    name: 'Gmail Sender 4',
    accessToken: null,
    isConnected: false,
    isActive: true,
    dailySentCount: 0,
    dailyQuotaLimit: 500,
  },
  {
    id: 'account-5',
    slotIndex: 4,
    email: '',
    name: 'Gmail Sender 5',
    accessToken: null,
    isConnected: false,
    isActive: true,
    dailySentCount: 0,
    dailyQuotaLimit: 500,
  },
];

export const getStoredGmailAccounts = (): OAuthGmailAccount[] => {
  try {
    const saved = localStorage.getItem('oauth_gmail_accounts_5');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        return parsed.map((a: OAuthGmailAccount) => ({
          ...a,
          accessToken: getAccountToken(a.id) || a.accessToken || null,
        }));
      }
    }
  } catch (e) {
    console.warn('Could not load oauth_gmail_accounts from storage:', e);
  }
  return INITIAL_GMAIL_ACCOUNTS;
};

export const saveStoredGmailAccounts = (accounts: OAuthGmailAccount[]) => {
  try {
    const serialized = accounts.map((a) => ({
      ...a,
      accessToken: null, // do not persist security tokens in localStorage
    }));
    localStorage.setItem('oauth_gmail_accounts_5', JSON.stringify(serialized));
  } catch (e) {
    console.warn('Could not save oauth_gmail_accounts to storage:', e);
  }
};

