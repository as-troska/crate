import React, { useState } from "react";
import { DIRECTIONS, TYPE_PAIRINGS } from "./themes";
import { API } from "./api";

const DiscogsMark = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.2" />
    <circle cx="11" cy="11" r="5" stroke={color} strokeWidth="1.2" />
    <circle cx="11" cy="11" r="1.5" fill={color} />
  </svg>
);

const LastfmMark = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <path d="M2 14 L7 14 L9 6 L13 16 L17 8 L20 11" stroke={color} strokeWidth="1.4" fill="none" />
  </svg>
);

const SettingsSection = ({ label, children, theme }) => (
  <div style={{ padding: "18px 0", borderBottom: `0.5px solid ${theme.hairline}` }}>
    <div style={{
      fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.18em",
      color: theme.inkMuted, textTransform: "uppercase", marginBottom: 12,
    }}>{label}</div>
    {children}
  </div>
);

const SettingRow = ({ label, children, theme }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 10, marginBottom: 12,
  }}>
    <div style={{ fontFamily: "var(--ui)", fontSize: 13, color: theme.ink }}>{label}</div>
    {children}
  </div>
);

const Seg = ({ options, value, onChange, theme, feel, vertical }) => (
  <div style={{
    display: "flex", flexDirection: vertical ? "column" : "row",
    background: theme.surface2, border: `0.5px solid ${theme.hairline}`,
    padding: 2, gap: vertical ? 0 : 2, width: vertical ? "100%" : "auto",
  }}>
    {options.map((o) => {
      const sel = o.v === value;
      return (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex: 1, padding: vertical ? "10px 12px" : "6px 10px",
          background: sel ? theme.accent : "transparent",
          color: sel ? theme.accentInk : theme.ink,
          border: 0, cursor: "pointer",
          fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
          fontSize: vertical ? 12.5 : (feel.uppercase ? 10 : 11.5),
          letterSpacing: feel.uppercase ? "0.10em" : "0.01em",
          textTransform: vertical ? "none" : (feel.uppercase ? "uppercase" : "none"),
          fontWeight: 500, textAlign: "left",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <span>{o.l}</span>
          {o.sub && (
            <span style={{
              fontSize: 10.5, fontFamily: "var(--mono)", letterSpacing: "0.04em",
              color: sel ? theme.accentInk : theme.inkMuted, opacity: 0.85,
            }}>{o.sub}</span>
          )}
        </button>
      );
    })}
  </div>
);

const Toggle = ({ on, onChange, theme }) => (
  <button onClick={() => onChange(!on)} style={{
    width: 38, height: 22, borderRadius: 11,
    background: on ? theme.accent : theme.hairlineStrong,
    border: 0, cursor: "pointer", position: "relative",
    transition: "background 180ms", flexShrink: 0,
  }}>
    <span style={{
      position: "absolute", top: 2, left: on ? 18 : 2,
      width: 18, height: 18, borderRadius: "50%",
      background: theme.surface, boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      transition: "left 160ms cubic-bezier(.2,.7,.2,1)",
    }} />
  </button>
);

const ModeBtn = ({ active, label, onClick, theme, feel }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "8px 10px",
    border: `0.5px solid ${active ? theme.accent : theme.hairline}`,
    background: active ? theme.accent : "transparent",
    color: active ? theme.accentInk : theme.inkMuted,
    cursor: "pointer",
    fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
    fontSize: feel.uppercase ? 10 : 12,
    letterSpacing: feel.uppercase ? "0.12em" : "0.01em",
    textTransform: feel.uppercase ? "uppercase" : "none",
    fontWeight: 500,
  }}>{label}</button>
);

const ThemeGrid = ({ theme, feel, prefs, setPrefs }) => {
  const keys = ["studio", "vinyl", "vu", "paper", "sodium"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
      {keys.map((k) => {
        const dir = DIRECTIONS[k];
        const variant = prefs.dark ? dir.dark : dir.light;
        const isActive = prefs.direction === k;
        return (
          <button key={k} onClick={() => setPrefs((p) => ({ ...p, direction: k }))} style={{
            border: `1.5px solid ${isActive ? theme.accent : theme.hairlineStrong}`,
            padding: 0, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "stretch",
            background: "transparent",
          }}>
            <div style={{
              aspectRatio: "1/1", background: variant.bg,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", left: 4, top: 4, right: 4, height: 6,
                background: variant.surface,
              }} />
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                width: 16, height: 16, borderRadius: "50%",
                background: variant.accent,
                transform: "translate(-50%, -50%)",
              }} />
              <div style={{
                position: "absolute", left: 6, bottom: 4, right: 6, height: 4,
                background: variant.accent, opacity: 0.4,
              }} />
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: "0.10em",
              color: isActive ? theme.accent : theme.inkMuted,
              textTransform: "uppercase", textAlign: "center",
              padding: "4px 0",
            }}>{dir.name}</div>
          </button>
        );
      })}
    </div>
  );
};

const AccountRow = ({ name, connected, icon, theme, feel, onConnect, connecting }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
    <div style={{ flex: "0 0 auto" }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "var(--ui)", fontSize: 13, color: theme.ink }}>{name}</div>
    </div>
    {connected ? (
      <span style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em",
        color: theme.accent, textTransform: "uppercase",
      }}>● Connected</span>
    ) : (
      <button onClick={onConnect} disabled={connecting} style={{
        padding: "5px 12px", background: theme.accent, color: theme.accentInk,
        border: 0, cursor: connecting ? "default" : "pointer",
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em",
        textTransform: "uppercase", fontWeight: 600, opacity: connecting ? 0.6 : 1,
      }}>{connecting ? "…" : "Connect"}</button>
    )}
  </div>
);

export default function Settings({ theme, feel, typePair, t, prefs, setPrefs, onClose, onLogout, username, discogsOk, lastfmOk, token }) {
  const [connectingDiscogs, setConnectingDiscogs] = useState(false);
  const [connectingLastfm, setConnectingLastfm] = useState(false);

  async function connectDiscogs() {
    setConnectingDiscogs(true);
    try {
      const res = await fetch(API + "/discogs/fetchTokens", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      window.location.href = `https://discogs.com/oauth/authorize?oauth_token=${data.requestToken}`;
    } catch { setConnectingDiscogs(false); }
  }

  async function connectLastfm() {
    setConnectingLastfm(true);
    try {
      const res = await fetch(API + "/lastfm/startAuth", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      window.open(data.authUrl, "_blank");
    } catch { }
    setConnectingLastfm(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
      animation: "crate-fadein 200ms ease",
      display: "flex", justifyContent: "flex-end",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 440, height: "100%",
        background: theme.surface, color: theme.ink,
        boxShadow: "-30px 0 80px rgba(0,0,0,0.5)",
        borderLeft: `0.5px solid ${theme.hairlineStrong}`,
        fontFamily: typePair.ui,
        "--display": typePair.display, "--ui": typePair.ui, "--mono": typePair.mono,
        animation: "crate-slidein-right 280ms cubic-bezier(.2,.7,.2,1)",
        overflowY: "auto", padding: "24px 28px 40px",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
            fontSize: feel.titleSerif ? 26 : 20,
            fontStyle: feel.titleSerif ? "italic" : "normal",
            fontWeight: feel.titleSerif ? 500 : 600, margin: 0,
            color: theme.ink,
          }}>{t.settings}</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 16,
            background: "transparent", border: `0.5px solid ${theme.hairline}`,
            color: theme.inkMuted, cursor: "pointer", fontSize: 14,
          }}>×</button>
        </div>

        <SettingsSection label={t.theme_label} theme={theme}>
          <ThemeGrid theme={theme} feel={feel} prefs={prefs} setPrefs={setPrefs} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <ModeBtn theme={theme} feel={feel} active={!prefs.dark} label={t.light_mode}
              onClick={() => setPrefs((p) => ({ ...p, dark: false }))} />
            <ModeBtn theme={theme} feel={feel} active={prefs.dark} label={t.dark_mode}
              onClick={() => setPrefs((p) => ({ ...p, dark: true }))} />
          </div>
        </SettingsSection>

        <SettingsSection label={t.appearance} theme={theme}>
          <SettingRow label={t.pairing} theme={theme}>
            <Seg theme={theme} feel={feel}
              options={[
                { v: "classic", l: "Classic" },
                { v: "modernist", l: "Modern" },
                { v: "hifi", l: "Hi-Fi" },
              ]}
              value={prefs.typePairing}
              onChange={(v) => setPrefs((p) => ({ ...p, typePairing: v }))} />
          </SettingRow>
          <SettingRow label={t.density_label} theme={theme}>
            <Seg theme={theme} feel={feel}
              options={[
                { v: "tight", l: t.density_tight },
                { v: "comfortable", l: t.density_comfortable },
                { v: "spacious", l: t.density_spacious },
              ]}
              value={prefs.density}
              onChange={(v) => setPrefs((p) => ({ ...p, density: v }))} />
          </SettingRow>
          <SettingRow label={t.reflection_label} theme={theme}>
            <Toggle theme={theme} on={prefs.reflection}
              onChange={(v) => setPrefs((p) => ({ ...p, reflection: v }))} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection label={t.now_playing_label} theme={theme}>
          <Seg vertical theme={theme} feel={feel}
            options={[
              { v: "bar", l: t.np_bar, sub: "Minimal, stays out of the way" },
              { v: "expanded", l: t.np_expanded, sub: "Full screen, animated" },
              { v: "side", l: t.np_side, sub: "Side panel, always visible" },
            ]}
            value={prefs.nowPlayingStyle}
            onChange={(v) => setPrefs((p) => ({ ...p, nowPlayingStyle: v }))} />
        </SettingsSection>

        <SettingsSection label={t.language_label} theme={theme}>
          <Seg theme={theme} feel={feel}
            options={[
              { v: "en", l: "English" },
              { v: "nn", l: "Nynorsk" },
            ]}
            value={prefs.language}
            onChange={(v) => setPrefs((p) => ({ ...p, language: v }))} />
        </SettingsSection>

        <SettingsSection label={t.accounts} theme={theme}>
          <AccountRow name={t.discogs} connected={discogsOk} theme={theme} feel={feel}
            icon={<DiscogsMark color={theme.accent} />}
            onConnect={connectDiscogs} connecting={connectingDiscogs} />
          <AccountRow name={t.lastfm} connected={lastfmOk} theme={theme} feel={feel}
            icon={<LastfmMark color={theme.accent} />}
            onConnect={connectLastfm} connecting={connectingLastfm} />
          <button onClick={onLogout} style={{
            marginTop: 14, width: "100%", padding: "11px 14px",
            background: "transparent", border: `0.5px solid ${theme.hairline}`,
            color: theme.inkMuted, cursor: "pointer",
            fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
            fontSize: feel.uppercase ? 10.5 : 12.5,
            letterSpacing: feel.uppercase ? "0.14em" : "0.01em",
            textTransform: feel.uppercase ? "uppercase" : "none",
          }}>{t.log_out}</button>
        </SettingsSection>
      </div>
    </div>
  );
}
