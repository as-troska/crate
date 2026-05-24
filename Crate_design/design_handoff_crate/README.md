# Handoff: Crate — vinyl collection browser + Last.fm scrobbling

## Overview

**Crate** is a multi-user web application for vinyl collectors. Users browse their physical record collection (synced from Discogs), open detailed release info, put a record on the turntable, and manually scrobble plays to Last.fm with correct timestamps.

This is **not** a streaming service. The user always presses "Skrobble" themselves — Crate is a manual scrobbler tied to their real-world listening of physical records.

## About the design files

The files in this bundle are **design references created in HTML/React-via-Babel** — prototypes showing the intended look and behavior. They are **not** production code to copy directly.

Your task is to **recreate these designs in the target stack** (the user has chosen **React + Vite** with **SQLite** for persistence and **OAuth1/OAuth1.0a** for Discogs/Last.fm). Re-use the visual decisions (themes, typography, layout, copy) but implement them using the codebase's patterns (real components, real state management, real fetch calls — not the prototype's mocked timers).

The prototype is interactive: log in with any credentials, click through OAuth onboarding, browse the flip-through, open a record, scrobble. It uses ~30 invented albums with procedurally-generated SVG sleeves — replace these with real Discogs data + real cover images.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, animations, layouts and interaction details are final. Recreate them pixel-perfectly. The only exception is the SVG cover-art placeholders, which exist purely so the prototype has something to show — in production, render real `<img>` tags from Discogs `images[].uri`.

## Files in this bundle

| File | What it is |
|------|------------|
| `Crate.html` | **Design canvas** showing the three theme directions (Studio / Vinyl / VU) side-by-side. For visual comparison and aesthetic reference. |
| `App.html` | **Production-shaped single-app prototype**. Login → OAuth onboarding → Main. Has a dev overlay (bottom-left "PROTOTYPE" button) to jump between screens and force empty/offline states. |
| `src/data.js` | Mock release data + the Discogs-style enrichment shape Crate operates on. |
| `src/themes.js` | All 5 theme directions, light/dark variants, typography pairings, full i18n strings. |
| `src/sleeves.jsx` | Procedural SVG sleeve generator — **delete in production**, use real images. |
| `src/crate-app.jsx` | Header, FlipThrough, GridView (virtualized), RecordModal, NowPlayingBar (three variants), Cover (sleeve↔disc flip), all utility components. |
| `src/screens.jsx` | Login, Register, Onboard (Discogs + Last.fm), Settings, EmptyState. |
| `src/app-main.jsx` | AppShell with router (login/register/onboard/main), preferences state, dev overlay. |
| `design-canvas.jsx`, `tweaks-panel.jsx` | Prototype scaffolding — **not needed in production**. |

## Tech stack the design assumes

- **React 18+** (functional components, hooks)
- **Vite** (fast dev server, ESM)
- **SQLite** (per the user's spec — see plan referenced below)
- **Express.js** backend with the user's existing OAuth1 flow for Discogs and Last.fm
- **No CSS framework chosen** — all styling is inline-object based. You may keep that approach, migrate to **CSS Modules**, **Tailwind**, or **vanilla-extract** — whichever the codebase prefers. The theme tokens are simple flat objects, easy to port to any system.

## Screens / Views

### 1. Login (`screens.jsx → LoginScreen`)

**Purpose**: Sign in with username + password. Tokens are stored in localStorage (user's plan: `Authorization: Bearer <token>`).

**Layout**:
- Vertically centered card (max-width 420px), 40px top padding, 36px horizontal padding, 32px bottom padding
- Card background: `theme.surface`; border: `0.5px solid theme.hairline`; box-shadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)`
- Page background: `theme.bg` with radial-gradient vignette (transparent center → bg at 100%)

**Components**:
- **Brand** (top): 28px Crate logo (circular vinyl mark with concentric grooves + accent-colored label) + "Crate" wordmark (display font, 22px) + "VINYL · SKROBBLING" tagline (mono, 9px, 0.18em letter-spacing, uppercase, inkMuted)
- **Heading**: "Velkomen til Crate" (display font, 24-30px depending on `feel.titleSerif`, 6px bottom margin, line-height 1.1)
- **Subheading**: "Logg inn for å sjå platesamlinga di" (UI font, 13px, inkMuted, 24px bottom margin, line-height 1.5)
- **Username field** + **Password field** with eye-toggle (◉ / ○) at right
  - Field label: mono 9.5px, 0.14em letter-spacing, uppercase, inkMuted
  - Field box: `theme.surface2` background, `0.5px solid theme.hairlineStrong` border, no border-radius
  - Input: 12px vertical padding, 14px horizontal, 14px font, transparent bg
  - Error border: `theme.accent` color + 10px mono error message below
- **Logg inn button** (`PrimaryButton`): full-width, 13px padding, `theme.accent` bg, `theme.accentInk` text, mono or sans depending on `feel.uppercase`, 11-13.5px, 0.01–0.14em letter-spacing, uppercase or normal, 600 weight
- **Footer link**: "Ny brukar? **Lag ny konto**" (UI font, 12.5px, inkMuted; "Lag ny konto" is underlined accent color)

**Interactions**:
- Enter key in any field submits
- Empty fields → set error on password field
- Submit triggers 700ms simulated request, then `onLogin({ username })`
- "Lag ny konto" → switches to Register screen

**Copy** (Nynorsk primary, English fallback):
- nn: "Velkomen til Crate" / "Logg inn for å sjå platesamlinga di"
- en: "Welcome to Crate" / "Sign in to see your record collection"
- Error: "Feil brukarnamn eller passord"

### 2. Register (`screens.jsx → RegisterScreen`)

Same shell as Login. Three fields: Username, Password, Confirm Password. Same eye-toggle on password fields.

**Validation**:
- Username required → `err_invalid_login`
- Password length ≥ 8 → `err_too_short` ("Passordet må vere minst 8 teikn")
- Password matches confirm → `err_passwords_match` ("Passorda er ikkje like")
- Username uniqueness checked server-side → `err_username_taken`

After registration succeeds → onboard screen.

### 3. OAuth Onboarding (`screens.jsx → OnboardScreen`)

**Purpose**: Connect Discogs (required) and Last.fm (optional).

**Layout**: Same auth-shell card.

**Components**:
- **Progress strip**: 2 columns, each with a 2px-tall horizontal bar (filled with accent when that step is done) and a "STEG 1 / STEG 2" mono label
- **Service rows** (one for Discogs, one for Last.fm):
  - 40×40 icon box on left (theme.surface2 background, SVG mark inside)
  - Name + description text in middle (15px display name, 12px inkMuted desc, line-height 1.45)
  - Connect button on right (`theme.accent` bg until connected, then outline-style "Kopla" with ✓)
  - Connecting state shows spinner inline; ~2s simulated wait
- **Skip + Finish buttons** at bottom:
  - "Hopp over for no" (transparent + hairline border, mono uppercase)
  - "Ferdigstill oppsett" (full-width primary, **disabled until Discogs connects**)

**Behavior**:
- Discogs required: `canFinish = discogs === 'done'`
- Last.fm optional: can skip
- In production these buttons open the real OAuth1 popup → request_token → user authorizes → callback → store oauth_token/secret in `user_credentials` table per the user's SQL schema

### 4. Main (`crate-app.jsx → CrateApp`)

#### 4a. Header

Two rows:

**Row 1**:
- Crate wordmark (left)
- Album count "030 PLATER" or "1.2k PLATER" for big collections (mono 10.5px, 0.10em letter-spacing)
- (spacer)
- Sync indicator (right): 6px dot + "SYNKRONISERER MED DISCOGS" / "SYNK FULLFØRT"
  - Dot pulses while syncing (`crate-pulse` animation), shows `box-shadow: 0 0 8px accent`
- Settings gear button (30×30, theme.hairline border, settings cog SVG inside)

**Row 2**:
- Search field (flex 1, theme.surface bg, magnifying glass SVG, 12.5px font)
- Sort segmented control (Artist / Tittel / År) — collapses to `<select>` dropdown on narrow widths
- View segmented control (flip / grid icons only)

**Narrow (< 720px width)**: Row 2 wraps; album count + sync text disappear; sort becomes select dropdown.

#### 4b. Flip-through (Cover Flow style)

**Behavior**: focused sleeve is upright in the center; off-axis sleeves are rotated 55° around Y, scaled 0.92, with X-offset proportional to distance from focus. Only ±6 sleeves rendered (culled). 360ms cubic-bezier transition on transform.

**Density**: tight=260px / comfortable=300px / spacious=340px sleeves. Narrow forces max 220px.

**Navigation**:
- Mouse wheel scrolls horizontally through albums (accumulates 30px deltas)
- Left/Right arrow keys navigate; Enter opens focused
- Click side-of-focus sleeve → it becomes focused
- Click focused sleeve → open modal
- Side nav arrows (44×44 circles with chevron SVG) at left/right edges

**Top metadata strip** (absolute, centered, top: 16):
- Mono: "● 009 / 030" (accent dot + position, with " / total" in inkDim)
- Display: "Riverbed Sessions" (single line, white-space: nowrap)
- UI: "Earl Cunningham Quintet · 1962 · Jazz" (mono dots between)

**Bottom hint** (centered, bottom 18): "← → blar · klikk for å opne" (mono 9.5px, 0.18em letter-spacing, uppercase, inkDim)

**Reflection** (off by default — user explicitly dislikes it): when `prefs.reflection === true`, a mirrored copy of the sleeve renders below each, faded into the bg.

#### 4c. Grid view (`GridView` — **virtualized**)

**Required**: must perform with 1–20 000 records.

**Implementation**:
- ResizeObserver tracks container width
- Compute cols = `floor((width - 44 + gap) / (minSleeve + gap))`
- Compute cellW = `(width - padding*2 - gap*(cols-1)) / cols`
- rowH = cellW + 36 (sleeve square + 2-line label below)
- Track scrollTop on scroll, render only rows from `floor(scrollTop / rowH) - 4` to `ceil((scrollTop + viewport) / rowH) + 4` (4-row overscan buffer)
- Total scroll height: `rowCount * rowH` placeholder div, items absolute-positioned inside

**Cell**:
- Square sleeve (cellW × cellW) with `box-shadow: 0 6px 14px rgba(0,0,0,0.4)`
- Hover: `transform: translateY(-2px)`, 200ms transition
- Below: title (UI 11.5px, ellipsed) + artist (mono 9.5px uppercase ellipsed)

Density sizing: tight 96px / comfortable 125px / spacious 160px minimum cell width.

#### 4d. Record Detail Modal (`RecordModal`)

**Trigger**: click focused sleeve in flip OR any sleeve in grid. ESC to close.

**Layout (desktop ≥ 720px)**:
- Full-screen overlay: `rgba(0,0,0,0.62) + backdrop-filter: blur(8px)`
- 30px margin all around (100px bottom to leave space for now-playing bar), max-width 1180px
- Two columns:
  - **Left** (`flex: 0 0 46%`, theme.bg background, 36px padding):
    - 1:1 sleeve carousel with three positions: `front` (Sleeve), `back` (BackSleeve — pseudo printed back cover), `label` (LabelSleeve — vinyl record label)
    - Carousel dots below (6px height, active is 18px wide accent)
    - "Oppdater platedata" button at bottom (outline mono uppercase)
  - **Right** (flex 1, scrollable, 32-36px padding):
    - Close × button absolutely positioned top-right
    - **Meta line** (accent mono 10px uppercase): `{label name} · {catno} · {format descriptions} · {year}`
    - **H1 title** (display font, 34-44px, line-height 1.05) + artist (UI 16px inkMuted)
    - **Meta grid** (2 col, 10×24px gap, hairline border top+bottom): Country, Have/Want (have / want with accent on want), Genres, Rating (X.XX accent + "/5 · N vurderingar"), Styles, "Til Sal" with count + lowest €price
    - **Notes blockquote** (italic, 2px accent left border, 14px left padding, inkMuted)
    - **Tracklist by side**:
      - Each side has header: "SIDE A" (mono 11px uppercase 600 weight) + "▶ SKROBBLE SIDE A" outline button
      - Each track row: `grid-template-columns: 36px 1fr auto auto` (position / title+extraartists / duration / play icon)
      - Hover: row bg becomes theme.surface2
      - Extraartists shown below title in mono 9.5px: "Featuring: Daniel Ek"
    - **Skrobble heile albumet** primary button (accent bg, 12px padding, play icon + text)
    - **Videos list** (only if `videos.length > 0`): YouTube-style mark + count + linked rows (▶ icon, title, duration)
    - **Identifiers footer** (mono 9.5px, 0.08em letter-spacing): Barcode, Label Code, Rights Society, Master ID

**Layout (narrow < 720px)**: Modal goes full-screen, no margin. Sleeve carousel becomes a horizontal row at top (sleeve 40% width, dots + update button stacked beside). Right pane becomes a vertical scroll below.

#### 4e. Now Playing — three styles, user-selectable

##### `bar` (default — "Diskret botn-bar")
- Fixed bottom strip, 64px tall, theme.surface bg, 0.5px top border
- Left: 48×48 cover (sleeve, clickable to flip to spinning disc)
- Middle: track position + "NO SPELAR" (accent mono 9.5px) / track title / artist — album
- Controls: prev / play-pause (accent circle) / next
- Waveform indicator (60 deterministic-pseudo-random bars, accent-colored up to progress)
- Time display: `1:23 / 3:45` (mono 10.5px, current in ink, total in inkDim)
- × close button

##### `expanded` (Spinning plate)
- Full-app overlay
- Center: 360×360 spinning record (vinyl grooves + accent-colored label with album title/artist/RPM info/catno), CSS `crate-spin 4s linear infinite`
- Tonearm at top-right rotates 20°→38° as track progresses
- **Click cover** → flips between disc and sleeve (320ms cross-fade); tonearm hides when sleeve shown
- Right column: meta + waveform (90 bars) + elapsed/remaining + transport controls (big 56px play-pause circle) + scrollable tracklist below

##### `side` (Sidepanel)
- 320px-wide right-anchored panel, theme.surface bg
- Top: header with accent dot + "NO SPELAR" + × close
- Big sleeve (284px, clickable to flip to disc)
- Track info, waveform (50 bars), time, controls
- Scrollable tracklist for current side (current track highlighted accent)

**Behavior** (all styles):
- Track auto-advances when elapsed >= duration (1Hz setInterval)
- After last track on side, auto-pause
- Manual track click in tracklist jumps + resets elapsed
- Click cover/disc toggles between Sleeve and SpinningDisc views (320ms cross-fade)
- On narrow screens, all styles fall back to `bar`

#### 4f. Settings overlay (`screens.jsx → SettingsScreen`)

**Trigger**: gear icon in header.

**Layout**: Right-anchored 440px-max panel, full height, theme.surface bg, slide-in-from-right animation, `rgba(0,0,0,0.6) + backdrop-filter: blur(10px)` backdrop.

**Sections** (each separated by 0.5px hairline):
1. **Tema**: 5-column theme grid (Studio / Vinyl / VU / Paper / Sodium). Each card is a 1:1 preview — top hairline showing surface, accent circle in middle, accent strip at bottom. Active card has 1.5px accent border. Below: 2-button Lys/Mørkt toggle.
2. **Utsjånad**:
   - Typografi paring (Klassisk / Modernist / Hi-Fi) segmented
   - Tettleik (Tett / Komf. / Luftig) segmented
   - Spegelrefleks toggle
3. **No-spelar**: vertical 3-row segmented (Botn-bar / Spinnande plate / Sidepanel) with subtitle text under each
4. **Språk**: segmented Nynorsk / English
5. **Kontoar**: list with Discogs + Last.fm rows showing connected username, + Logg ut button at bottom

#### 4g. Empty / error states (`EmptyState`)

Three states centered in collection area:
- **Empty collection** (`forceState === 'empty'`): crate icon + "Samlinga er tom" + "Crate les samlinga di frå Discogs. Ho dukkar opp her når synkronisering er ferdig."
- **No search results** (search returns 0): magnifier + "Ingen treff" + "Prøv eit anna søkeord, eller fjern filteret."
- **Offline** (`forceState === 'offline'`): circle-with-slash + "Ikkje på nett" + "Kunne ikkje nå Discogs. Sjekk nettsambandet og prøv på nytt." + Prøv på nytt button

---

## Interactions & Behavior

### Navigation flow
```
Login ─→ (on success) ─→ Onboard ─→ (on done) ─→ Main
  ↑              ↑                      │
  └── Lag ny ────┘                     Logout
                                         ↓
                                       Login
```

### Keyboard shortcuts
- **Esc** — close modal / close settings
- **←/→** — flip-through navigation
- **Enter** in flip — open focused record's modal
- **Enter** in any auth field — submit form

### Animations
| Name | Where | Properties |
|------|-------|------------|
| `crate-pulse` | sync dot | 1.4s ease-in-out infinite — scale 1→0.7 + opacity 1→0.3 |
| `crate-fadein` | modal/settings backdrop | 200ms ease-out — opacity 0→1 |
| `crate-slideup` | modal | 280ms cubic-bezier(.2,.7,.2,1) — opacity + translateY(20px → 0) |
| `crate-slidein-right` | settings panel | 260-280ms cubic-bezier(.2,.7,.2,1) — opacity + translateX(40px → 0) |
| `crate-spin` | vinyl disc + spinners | linear infinite — 4s for disc, 0.8s for small spinner |

### Performance
- **Flip-through**: cull all sleeves outside ±6 of focus (≤13 DOM nodes regardless of collection size)
- **Grid**: window rows (overscan 4); ResizeObserver to adapt column count to width changes
- **Search/sort**: useMemo with `[search, sort, albums]` deps — fast even for 20k items

---

## State Management

```ts
// App-level
type Screen = 'login' | 'register' | 'onboard' | 'main';

type Prefs = {
  direction: 'studio' | 'vinyl' | 'vu' | 'paper' | 'sodium';
  dark: boolean;
  language: 'nn' | 'en';
  density: 'tight' | 'comfortable' | 'spacious';
  typePairing: 'classic' | 'modernist' | 'hifi';
  nowPlayingStyle: 'bar' | 'expanded' | 'side';
  reflection: boolean;
};

type User = { id: number; username: string };

// Within CrateApp
type CrateState = {
  view: 'flip' | 'grid';
  sort: 'artist' | 'title' | 'year';
  search: string;
  focused: number;         // index in filtered list
  open: Album | null;      // modal album
  playing: PlayingState | null;
  syncing: boolean;
};

type PlayingState = {
  album: Album;
  sideTracks: Track[];     // tracks for the side currently playing
  startIdx: number;        // index of track to start at
};
```

### Persistence
- `Prefs` → localStorage key `crate.prefs` (sync on every change)
- `User` session token → localStorage key `crate.token` (per the user's plan: `Authorization: Bearer <token>`)

### Data fetching
The user's plan covers backend endpoints in detail. Frontend should call:
- `POST /auth/login` / `POST /auth/register` / `POST /auth/logout` / `GET /auth/me`
- `GET /discogs/authStatus`, `POST /discogs/authorize` (returns OAuth URL), `GET /discogs/callback?oauth_token=...&oauth_verifier=...`
- `GET /lastfm/authStatus`, `POST /lastfm/authorize`, callback
- `GET /collection` (paginated; supports cursor + filter for 20k records)
- `GET /releases/:id` (uses server cache, falls through to Discogs if missing)
- `POST /releases/:id/refresh` (force re-fetch and overwrite cache)
- `GET /syncStatus` → `{ total, done, errors, running }` — polled every 3s while running
- `POST /lastfm/scrobble`, `POST /lastfm/nowPlaying`

---

## Design Tokens

### Themes — 5 directions, each with dark + light variants (10 total)

Located in `src/themes.js → DIRECTIONS`. Each direction has:
- `bg` — base background
- `surface` — primary card surface
- `surface2` — input/hover surface
- `ink` — primary text
- `inkMuted` — secondary text
- `inkDim` — tertiary text / placeholders
- `hairline` — subtle borders
- `hairlineStrong` — stronger borders / focus
- `accent` — brand accent (varies per direction)
- `accentInk` — text on accent
- `grain` — film-grain overlay opacity 0–0.08

| Theme | Accent (dark) | Accent (light) | Personality |
|-------|---------------|----------------|-------------|
| `studio` | `#19D1F8` cyan | `#0288A6` | brushed chrome, electric — default |
| `vinyl` | `#C73E3A` oxblood | `#A8302C` | warm paper, editorial |
| `vu` | `#7FE389` phosphor | `#1F8A4B` | matte instrument panel |
| `paper` | `#D4A24A` ochre | `#A8782A` | liner-notes editorial |
| `sodium` | `#F5A623` amber | `#B8762A` | tungsten lamp |

Each direction also has a `feel`:
- `uppercase` (boolean) — buttons/labels render uppercase mono
- `letterSpacing` (string) — letter-spacing for uppercase metadata
- `titleSerif` (boolean) — H1s use display serif italic vs sans bold

### Typography — three pairings

```js
TYPE_PAIRINGS = {
  classic:    { display: 'Cormorant Garamond', ui: 'Inter Tight',    mono: 'JetBrains Mono' },
  modernist:  { display: 'Inter Tight',         ui: 'Inter Tight',    mono: 'JetBrains Mono' },
  hifi:       { display: 'Fraunces',            ui: 'IBM Plex Sans',  mono: 'IBM Plex Mono' },
};
```

Loaded from Google Fonts. Define CSS variables `--display`, `--ui`, `--mono` on the app root so component code reads `fontFamily: 'var(--display)'`.

### Spacing scale (used inline; not formalized, but consistent)
- 2, 4, 6, 8, 10, 14, 18, 22, 28, 36 px — these are the values that appear in the code

### Type scale
- 9 / 9.5 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 15 / 16 / 18 / 20 / 22 / 24 / 28 / 30 / 34 / 40 / 44 px
- All `letter-spacing` values: -0.02, -0.015, -0.01, 0.005, 0.01, 0.04, 0.05, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18 em

### Borders / shadows
- Most borders are `0.5px solid theme.hairline` (modern hairlines)
- No border-radius on UI chrome (intentionally sharp — audiophile vocabulary)
- Buttons + nav arrows: small `border-radius: 4px` for hit targets, but `border-radius: 50%` for transport controls
- Modal shadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)`
- Card hover: `transform: translateY(-2px)` 200ms

---

## Data shape (Discogs-style)

Per release in `data.js` after enrichment:

```ts
type Album = {
  id: number;                // collection instance_id maps here
  artist: string;            // primary artist display name
  artists: { name: string }[];
  artistsSort: string;       // for alphabetical sort, "The" stripped
  title: string;
  year: number;
  country: string;
  format: string;            // e.g. "LP, 180g"
  formats: {                 // Discogs-style
    name: 'Vinyl';
    qty: '1' | '2';
    descriptions: string[];  // ['12"', '33 ⅓ RPM', 'Album']
  }[];
  labels: string[];          // names
  labelsDetailed: {
    name: string;
    catno: string;           // e.g. "BLP 1234"
  }[];
  genres: string[];
  styles: string[];
  rating: number;            // 0–5
  ratingCount: number;
  community: {
    have: number;
    want: number;
    rating: { average: number; count: number };
  };
  notes: string;
  videos: { title: string; uri: string; duration: string }[];
  identifiers: { type: 'Barcode' | 'Label Code' | 'Rights Society'; value: string }[];
  masterId: number;
  numForSale: number;
  lowestPrice: number | null;
  imageCount: number;
  dateAdded: string;         // ISO date
  palette: [bg: string, ink: string, accent: string];  // only for procedural sleeves — remove in production
  sleeveStyle: string;       // same — remove in production
  tracks: Track[];
};

type Track = {
  pos: string;               // "A1", "B3", "C2", "D1"...
  title: string;
  dur: string;               // "3:45" — may be missing for some tracks
  extraartists?: { name: string; role: string }[];
};
```

---

## Internationalization

All UI strings are in `src/themes.js → I18N`. Two locales: `nn` (Nynorsk — default) and `en`.

Switching is reactive — `prefs.language` updates the whole app immediately. No page reload.

In production, lift these to a real i18n library (e.g. `react-intl` or `i18next`) but keep the same string keys. Strings are organized by section (auth / onboarding / settings / empty-states / main).

---

## Responsive behavior

The CrateApp uses ResizeObserver on its own root, not `window.matchMedia`, so it adapts to whatever container it lives in (sidebar layouts, split panes, etc.).

| Breakpoint | Behavior |
|---|---|
| **≥ 720px** | Full chrome: count visible, sync label visible, sort segmented, settings ⚙ button; modal as floating card; now-playing follows `prefs.nowPlayingStyle` |
| **< 720px (narrow)** | Album count + sync label hide; sort becomes select; header rows stack; flip sleeves cap at 220px; modal goes full-screen with horizontal sleeve row + vertical info pane; now-playing always falls back to `bar` |
| **< 480px (very narrow)** | Reserved for further mobile-specific work — currently uses narrow rules |

Auth/Onboard/Settings screens use their own responsive: the auth card is `max-width: 420px` and naturally fits mobile with 24px page padding.

---

## Edge cases the design handles

- **Track without duration** → default 3:30 (`parseDur` returns 210s)
- **Album without notes** → blockquote omitted
- **Album without videos** → Videos section omitted
- **Album without identifiers and no masterId** → footer omitted
- **Search with no results** → NoResults empty state
- **Track with extraartists** → secondary line under track title showing `Role: Name`
- **Big collections (20k+)** → grid virtualizes; flip culls; sort/search useMemo'd

---

## Assets

**Fonts**: Loaded from Google Fonts (Cormorant Garamond, Inter Tight, JetBrains Mono, Fraunces, IBM Plex Sans, IBM Plex Mono). All open-licensed. In production, self-host with `next/font` or `@fontsource/*` packages.

**Icons**: All inline SVG (search, gear, play, pause, prev, next, chevron, grid, flip, vinyl logo, video glyph). No external icon library — easier to color-tween with the theme.

**Cover art** (production): use `images[0].uri` from Discogs response. The user's plan mentions images are served through their backend at `/img?u=<url>` (CORS proxy). Use that. Lazy-load with `loading="lazy"` and `decoding="async"`.

**Procedural sleeve generator** (`src/sleeves.jsx`): exists **only** for the prototype, so it has visuals without real Discogs data. **Delete in production** and render real `<img>` elements.

---

## What to do first

1. **Read the user's plan** (the multi-user vinyl/scrobbling spec they pasted earlier — it covers backend, DB schema, OAuth flow, scrobble signing). The frontend in this handoff is designed to consume those endpoints exactly.
2. **Set up Vite + React + react-router-dom** (or your preferred router).
3. **Port `themes.js`** verbatim — it's a flat data structure.
4. **Build the AppShell** routing skeleton, then drop in the screens one at a time.
5. **Start with Login / Register / Onboard** (matches plan steps 2–4).
6. **Build CrateApp shell + Header**, wire to `/collection` and `/syncStatus` endpoints.
7. **Build FlipThrough + GridView** (start with grid — easier; flip is the cherry on top).
8. **Build RecordModal**, wire to `/releases/:id`.
9. **Build NowPlayingBar** (all three variants), wire scrobble logic.
10. **Build Settings**, wire prefs to localStorage.

---

## Notes & gotchas

- **`forceState` prop** on CrateApp is a dev hook used in the prototype dev nav. Remove it; in production, derive empty/offline from real backend state (`/collection` returning `[]` → empty; fetch rejection → offline).
- **`accentOverride`** prop is a hold-over from the canvas exploration; not needed in production.
- **DevNav** (`app-main.jsx`) is prototype-only. Strip it from the build.
- The Tweaks panel on `Crate.html` is for design review only — the production app uses `SettingsScreen` instead.
- Inline-style approach was chosen for prototype readability; in production migrate to your codebase's CSS pattern. The values (colors, spacing, font sizes) are all listed above.
- **Strict-mode safe**: All components are pure; useEffect cleanups handle the timers and observers.
- **Accessibility** (not fully implemented in prototype, please add): keyboard-trap modal, focus return after close, `aria-label`s on icon-only buttons, `role="search"` on header search, `aria-live` on sync status + empty states.
