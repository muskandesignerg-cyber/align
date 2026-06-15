import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Required for OAuth redirect handling on native
WebBrowser.maybeCompleteAuthSession();

// Build the redirect URI depending on platform and environment.
// On web: uses the current origin automatically (works for both localhost AND Netlify).
// On native: uses the app's deep-link scheme.
const getRedirectUri = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Dynamically uses whatever domain the app is running on:
    // - http://localhost:8081  (local dev)
    // - https://talent-logic-app.netlify.app  (production)
    return `${window.location.origin}/auth/callback`;
  }
  return makeRedirectUri({
    scheme: 'talent-logic',
    path: 'auth/callback',
  });
};

/**
 * Sign in with Google OAuth.
 * Opens system browser; Supabase handles token exchange.
 */
export const signInWithGoogle = async (): Promise<void> => {
  const redirectUri = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned from Supabase');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success' && result.url) {
    await handleOAuthCallback(result.url);
  } else if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('cancelled');
  }
};

/**
 * Sign in with LinkedIn OAuth.
 */
export const signInWithLinkedIn = async (): Promise<void> => {
  const redirectUri = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned from Supabase');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success' && result.url) {
    await handleOAuthCallback(result.url);
  } else if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('cancelled');
  }
};

/**
 * Parse the OAuth callback URL and set the Supabase session.
 * Handles both fragment (#access_token=...) and query (?code=...) styles.
 */
const handleOAuthCallback = async (url: string): Promise<void> => {
  try {
    const parsedUrl = new URL(url);

    // Fragment-style: #access_token=...&refresh_token=...
    const fragment = parsedUrl.hash ? parsedUrl.hash.substring(1) : '';
    const query   = parsedUrl.search ? parsedUrl.search.substring(1) : '';

    const fragmentParams = new URLSearchParams(fragment);
    const queryParams    = new URLSearchParams(query);

    const accessToken  = fragmentParams.get('access_token')  ?? queryParams.get('access_token');
    const refreshToken = fragmentParams.get('refresh_token') ?? queryParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return;
    }

    // PKCE code-exchange style: ?code=...
    const code = queryParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (error) throw error;
      return;
    }

    // If neither, the browser redirected but with no usable token — treat as cancel
    throw new Error('No tokens received from OAuth provider');
  } catch (err: any) {
    // Re-throw so the calling screen can handle it
    throw err;
  }
};

/**
 * Sign out the current user and clear the session.
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the current session (null if not logged in).
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Get the current user (null if not logged in).
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
};

/**
 * Sign up a new user with email + password.
 * Supabase sends a confirmation email automatically (if enabled in dashboard).
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName: string
): Promise<void> => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
};

/**
 * Sign in an existing user with email + password.
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

/**
 * Send a password-reset email.
 */
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};
