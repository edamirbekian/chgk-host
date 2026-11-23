import { useEffect, useState } from 'preact/hooks';
import { dicts } from '../i18n';
import { api, isConnected, login, logout, parseSpotifyLink } from '../spotify';
import { update, useAppState } from '../state';

interface Device {
  id: string;
  name: string;
  is_active: boolean;
  volume_percent: number | null;
}
interface Playlist {
  name: string;
  uri: string;
}
interface Player {
  is_playing: boolean;
  item: { name: string; artists?: { name: string }[] } | null;
  device: Device;
}

function Embed() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const link = parseSpotifyLink(s.settings.spotifyEmbed);

  const submit = (e: Event) => {
    e.preventDefault();
    if (!parseSpotifyLink(input)) return setError(true);
    update((x) => (x.settings.spotifyEmbed = input.trim()));
    setInput('');
    setError(false);
  };

  return (
    <div class="stack">
      {link && (
        <iframe
          class="spotify-embed"
          src={`https://open.spotify.com/embed/${link.type}/${link.id}?theme=0`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      )}
      <form class="row" onSubmit={submit}>
        <input
          class="grow"
          value={input}
          placeholder={t.embedPlaceholder}
          onInput={(e) => {
            setInput(e.currentTarget.value);
            setError(false);
          }}
        />
        <button type="submit" disabled={!input.trim()}>
          {t.load}
        </button>
        {link && (
          <button type="button" class="ghost" onClick={() => update((x) => (x.settings.spotifyEmbed = ''))}>
            {t.clear}
          </button>
        )}
      </form>
      {error && <p class="error small-text">{t.invalidLink}</p>}
    </div>
  );
}

function Remote() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const clientId = s.settings.spotifyClientId.trim();
  const [connected, setConnected] = useState(isConnected());
  const [player, setPlayer] = useState<Player | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [playlist, setPlaylist] = useState('');
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError('');
      await fn();
    } catch (e) {
      setError((e as Error).message);
      setConnected(isConnected());
    }
  };

  const refresh = () =>
    run(async () => {
      const [p, d] = await Promise.all([api<Player>('GET', '/me/player'), api<{ devices: Device[] }>('GET', '/me/player/devices')]);
      setPlayer(p);
      setDevices(d?.devices ?? []);
      const active = p?.device?.id ?? d?.devices.find((x) => x.is_active)?.id;
      setDeviceId((cur) => cur || active || d?.devices[0]?.id || '');
    });

  useEffect(() => {
    if (!connected) return;
    void run(async () => {
      const r = await api<{ items: (Playlist | null)[] }>('GET', '/me/playlists?limit=50');
      setPlaylists((r?.items ?? []).filter((x): x is Playlist => !!x));
    });
    void refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [connected]);

  if (!clientId) return <p class="muted small-text">{t.spotifyNeedsClientId}</p>;
  if (!connected)
    return (
      <button class="spotify-btn" onClick={() => login(clientId)}>
        {t.spotifyConnect}
      </button>
    );

  const dev = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  const act = (method: string, path: string, body?: unknown) =>
    run(async () => {
      await api(method, path, body);
      setTimeout(refresh, 400);
    });

  return (
    <div class="stack">
      <div class="now-playing">
        {player?.item ? (
          <>
            <b>{player.item.name}</b>
            <span class="muted">{player.item.artists?.map((a) => a.name).join(', ')}</span>
          </>
        ) : (
          <span class="muted">{t.nothingPlaying}</span>
        )}
      </div>
      <div class="row transport">
        <button class="icon" onClick={() => act('POST', '/me/player/previous' + dev)}>
          ⏮
        </button>
        <button
          class="icon primary"
          onClick={() => (player?.is_playing ? act('PUT', '/me/player/pause' + dev) : act('PUT', '/me/player/play' + dev))}
        >
          {player?.is_playing ? '❚❚' : '▶'}
        </button>
        <button class="icon" onClick={() => act('POST', '/me/player/next' + dev)}>
          ⏭
        </button>
        {player?.device?.volume_percent != null && (
          <input
            class="grow"
            type="range"
            min={0}
            max={100}
            value={player.device.volume_percent}
            aria-label={t.volume}
            onChange={(e) => act('PUT', `/me/player/volume?volume_percent=${e.currentTarget.value}${dev.replace('?', '&')}`)}
          />
        )}
      </div>
      <label class="field">
        <span>{t.device}</span>
        {devices.length ? (
          <select
            value={deviceId}
            onChange={(e) => {
              const id = e.currentTarget.value;
              setDeviceId(id);
              void act('PUT', '/me/player', { device_ids: [id], play: !!player?.is_playing });
            }}
          >
            {devices.map((d) => (
              <option value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span class="muted small-text">{t.noDevices}</span>
        )}
      </label>
      <div class="row">
        <select class="grow" value={playlist} onChange={(e) => setPlaylist(e.currentTarget.value)} aria-label={t.playlists}>
          <option value="">{t.playlists}…</option>
          {playlists.map((p) => (
            <option value={p.uri}>{p.name}</option>
          ))}
        </select>
        <button disabled={!playlist} onClick={() => act('PUT', '/me/player/play' + dev, { context_uri: playlist })}>
          {t.play}
        </button>
      </div>
      <div class="row">
        <button class="ghost small" onClick={refresh}>
          {t.refresh}
        </button>
        <button
          class="ghost small"
          onClick={() => {
            logout();
            setConnected(false);
          }}
        >
          {t.spotifyDisconnect}
        </button>
      </div>
      {error && <p class="error small-text">{error}</p>}
    </div>
  );
}

export function Spotify() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  return (
    <div class="card">
      <div class="card-title">{t.spotify}</div>
      <Embed />
      <hr />
      <Remote />
    </div>
  );
}
