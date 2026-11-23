// Spotify Web API via Authorization Code + PKCE: works from a static site, no client secret.
import { getState } from './state';

const TOKEN_KEY = 'chgk-host/spotify-token';
const VERIFIER_KEY = 'chgk-host/spotify-verifier';
const SCOPES = 'user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative';

interface Token {
  access: string;
  refresh: string;
  expires: number;
}

export const redirectUri = () => location.origin + location.pathname;

function readToken(): Token | null {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export const isConnected = () => readToken() != null;
export const logout = () => localStorage.removeItem(TOKEN_KEY);

function b64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function login(clientId: string) {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(64)).buffer);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  localStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: redirectUri(),
  });
  location.href = 'https://accounts.spotify.com/authorize?' + params;
}

async function tokenRequest(params: Record<string, string>): Promise<Token> {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!r.ok) {
    logout();
    throw new Error(`Spotify login failed (${r.status})`);
  }
  const j = await r.json();
  const token: Token = {
    access: j.access_token,
    refresh: j.refresh_token ?? readToken()?.refresh ?? '',
    expires: Date.now() + (j.expires_in - 60) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return token;
}

/** Finishes the login when Spotify redirects back with ?code=… */
export async function handleSpotifyRedirect() {
  const q = new URLSearchParams(location.search);
  const code = q.get('code');
  if (!code && !q.get('error')) return;
  history.replaceState(null, '', location.pathname + location.hash);
  const verifier = localStorage.getItem(VERIFIER_KEY);
  const clientId = getState().settings.spotifyClientId;
  if (!code || !verifier || !clientId) return;
  localStorage.removeItem(VERIFIER_KEY);
  try {
    await tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    });
  } catch (e) {
    console.error(e);
  }
}

async function accessToken(): Promise<string> {
  let token = readToken();
  if (!token) throw new Error('Not connected');
  if (Date.now() > token.expires) {
    token = await tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: token.refresh,
      client_id: getState().settings.spotifyClientId,
    });
  }
  return token.access;
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T | null> {
  const r = await fetch('https://api.spotify.com/v1' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + (await accessToken()),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) {
    logout();
    throw new Error('Spotify session expired');
  }
  if (!r.ok) {
    let msg = r.statusText;
    try {
      msg = (await r.json()).error?.message ?? msg;
    } catch {
      // Non-JSON error body.
    }
    throw new Error(msg);
  }
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

/** Accepts open.spotify.com links (incl. /intl-xx/ and /embed/) and spotify: URIs. */
export function parseSpotifyLink(input: string): { type: string; id: string } | null {
  const s = input.trim();
  const m =
    s.match(/^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]+)$/i) ??
    s.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/i);
  return m ? { type: m[1].toLowerCase(), id: m[2] } : null;
}
