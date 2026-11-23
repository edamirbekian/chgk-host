# ChGK Host · Что? Где? Когда?

A host's control panel for sport "What? Where? When?" games. Teams answer on paper;
the host marks correct answers, runs the timer and sounds, and projects a scoreboard.
Runs entirely in the browser and is hosted on GitHub Pages.

## Features

- **Score grid**: teams × questions, click a cell to mark a correct answer. Totals per tour,
  overall total, rating and place update live. Questions can be removed ("снять вопрос").
- **Ranking**: by total, then by the standard ChGK rating: a question is worth
  *(teams that missed it + 1)*, and a team's rating is the sum over the questions it took.
  Teams still tied share a place (`2–3`).
- **Timer**: discussion (default 60 s) followed by answer writing (default 20 s), with gong,
  10-seconds-left and time-up signals. **Space** starts/pauses, **← / →** change the question.
- **Scoreboard window** for the projector (*Open scoreboard*): **Live**, **Frozen** (keeps
  the standings at the moment of freezing, for a final reveal) or **Hidden**. Double-click to go fullscreen.
- **Soundboard** for bundled audio (Zarathustra, break music…).
- **Spotify**: an embedded player for any pasted link, plus optional full playback control.
- **Languages**: Русский / English / Հայերեն.
- **Autosave** in the browser; **export** results to CSV (opens in Excel) and PNG.

## Adding sounds

Put audio files into [`sounds/`](sounds/) and push. Each file becomes a button:
`01_Zarathustra.mp3` → "Zarathustra" (the number sets the order).

## Spotify full control (optional)

The embedded player works without any setup (full tracks if you're logged in to Spotify in
that browser, otherwise 30-second previews). For remote control of the Spotify app
(play/pause/skip/playlists on any of your devices; **Spotify Premium required**):

1. Go to <https://developer.spotify.com/dashboard> → **Create app**.
2. Add the redirect URI shown in the app's *Setup* dialog, e.g.
   `https://<user>.github.io/chgk-host/` (and `http://127.0.0.1:5173/` for local dev).
3. Select **Web API**, save, and copy the **Client ID** into *Setup → Spotify Client ID*.
4. Click **Connect Spotify**. In development mode, only Spotify accounts added under
   *User Management* in the dashboard can log in.

## Development

```sh
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # type-check + production build into dist/
```

## Deployment

Every push to `main` builds and deploys via GitHub Actions
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).
One-time setup: **Settings → Pages → Source: GitHub Actions**.
