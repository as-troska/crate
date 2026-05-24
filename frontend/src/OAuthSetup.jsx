import React, { useState, useEffect } from "react";
import { API } from "./api";

const Logo = ({ size = 28, accent, ink }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="15.5" fill="#0a0a0a" stroke={ink} strokeOpacity="0.25" />
    {[10, 8, 6.5].map((r, i) => (
      <circle key={i} cx="16" cy="16" r={r} fill="none" stroke={ink} strokeOpacity="0.15" />
    ))}
    <circle cx="16" cy="16" r="5" fill={accent} />
    <circle cx="16" cy="16" r="1" fill="#0a0a0a" />
  </svg>
);

const Spinner = ({ size = 10, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: "crate-spin 0.8s linear infinite" }}>
    <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1.5" />
    <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DiscogsMark = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.2" />
    <circle cx="11" cy="11" r="5" stroke={color} strokeWidth="1.2" />
    <circle cx="11" cy="11" r="1.5" fill={color} />
  </svg>
);

const LastfmMark = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M2 14 L7 14 L9 6 L13 16 L17 8 L20 11" stroke={color} strokeWidth="1.4" fill="none" />
  </svg>
);

export default function OAuthSetup({ token, theme, feel, typePair, t, onReady }) {
  const [discogs, setDiscogs] = useState("checking");
  const [lastfm, setLastfm] = useState("checking");
  const [lastfmAuthUrl, setLastfmAuthUrl] = useState(null);
  const [discogsConnecting, setDiscogsConnecting] = useState(false);

  function authFetch(url, opts = {}) {
    return fetch(API + url, {
      ...opts,
      headers: { ...opts.headers, "Authorization": "Bearer " + token },
    });
  }

  useEffect(() => { checkStatus(); }, []);

  async function checkStatus() {
    try {
      const [dr, lr] = await Promise.all([
        authFetch("/discogs/hasTokens"),
        authFetch("/lastfm/checkAuthorized"),
      ]);
      const dd = await dr.json();
      const ld = await lr.json();

      const dOk = dd.status === "authorized";
      const lOk = ld.authorized;

      setDiscogs(dOk ? "done" : "idle");
      setLastfm(lOk ? "done" : "idle");

      if (dOk && lOk) { onReady(); return; }

      if (!lOk) {
        authFetch("/lastfm/startAuth")
          .then((r) => r.json())
          .then((d) => setLastfmAuthUrl(d.authUrl))
          .catch(() => {});
      }
    } catch {
      setDiscogs("idle");
      setLastfm("idle");
    }
  }

  async function connectDiscogs() {
    setDiscogsConnecting(true);
    try {
      const res = await authFetch("/discogs/fetchTokens");
      const data = await res.json();
      window.location.href = `https://discogs.com/oauth/authorize?oauth_token=${data.requestToken}`;
    } catch {
      setDiscogsConnecting(false);
    }
  }

  const step = discogs !== "done" ? 1 : 2;

  return (
    <div style={{
      width: "100%", height: "100%", minHeight: "100vh",
      background: theme.bg, color: theme.ink,
      fontFamily: typePair.ui,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", position: "relative",
      "--display": typePair.display, "--ui": typePair.ui, "--mono": typePair.mono,
      overflowY: "auto",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at center, transparent 50%, ${theme.bg} 100%)`,
      }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 460,
        background: theme.surface, border: `0.5px solid ${theme.hairline}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        padding: "40px 36px 32px",
        animation: "crate-slideup 280ms cubic-bezier(.2,.7,.2,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <Logo size={28} accent={theme.accent} ink={theme.ink} />
          <div>
            <div style={{
              fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
              fontSize: 22, fontWeight: feel.titleSerif ? 500 : 600,
              fontStyle: feel.titleSerif ? "italic" : "normal",
              color: theme.ink,
            }}>Crate</div>
          </div>
        </div>

        <h1 style={{
          fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
          fontSize: feel.titleSerif ? 28 : 22,
          fontWeight: feel.titleSerif ? 500 : 600,
          fontStyle: feel.titleSerif ? "italic" : "normal",
          margin: "0 0 6px", color: theme.ink,
        }}>{t.onboard_title}</h1>
        <p style={{ color: theme.inkMuted, fontSize: 13, margin: "0 0 24px", lineHeight: 1.5 }}>
          {t.onboard_sub}
        </p>

        {/* Progress bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 24 }}>
          {[
            { label: t.step_discogs, status: discogs },
            { label: t.step_lastfm, status: lastfm },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                height: 2, width: "100%",
                background: s.status === "done" ? theme.accent : theme.hairlineStrong,
                transition: "background 240ms",
              }} />
              <div style={{
                fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em",
                color: s.status === "done" ? theme.accent : theme.inkMuted,
                textTransform: "uppercase",
              }}>{t.step} {i + 1}</div>
            </div>
          ))}
        </div>

        {/* Discogs */}
        <ServiceRow
          name={t.discogs}
          desc={t.discogs_desc}
          status={discogs === "checking" ? "idle" : discogs}
          connecting={discogsConnecting}
          t={t} theme={theme} feel={feel}
          icon={<DiscogsMark color={theme.accent} />}
          onConnect={connectDiscogs}
        />

        {/* Last.fm — only shown after Discogs done */}
        {discogs === "done" && (
          <ServiceRow
            name={t.lastfm}
            desc={t.lastfm_desc}
            status={lastfm === "checking" ? "idle" : lastfm}
            t={t} theme={theme} feel={feel}
            icon={<LastfmMark color={theme.accent} />}
            href={lastfmAuthUrl}
          />
        )}

        {/* Actions */}
        {discogs === "checking" ? (
          <div style={{
            marginTop: 24, padding: "14px 0",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
            color: theme.inkMuted, textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Spinner color={theme.inkMuted} size={12} /> {t.loading}
          </div>
        ) : (
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button
              onClick={onReady}
              style={{
                flex: "0 0 auto", padding: "13px 14px",
                background: "transparent", border: `0.5px solid ${theme.hairline}`,
                color: theme.inkMuted, cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >{t.skip_for_now}</button>
            <button
              onClick={onReady}
              disabled={discogs !== "done"}
              style={{
                flex: 1, padding: "13px 16px",
                background: discogs !== "done" ? theme.surface2 : theme.accent,
                color: discogs !== "done" ? theme.inkDim : theme.accentInk,
                border: 0, cursor: discogs !== "done" ? "default" : "pointer",
                fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
                fontSize: feel.uppercase ? 11 : 13.5,
                letterSpacing: feel.uppercase ? "0.14em" : "0.01em",
                textTransform: feel.uppercase ? "uppercase" : "none",
                fontWeight: 600,
              }}
            >{t.finish_setup}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceRow({ name, desc, status, t, theme, feel, icon, onConnect, href, connecting }) {
  const isDone = status === "done";
  const isIdle = status === "idle";

  const btnContent = connecting ? (
    <><Spinner color={theme.accentInk} size={10} />{t.waiting_authorize.slice(0, 7)}…</>
  ) : isDone ? (
    <><span>✓</span>{t.connected}</>
  ) : (
    t.connect
  );

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "16px 0", borderTop: `0.5px solid ${theme.hairline}`,
    }}>
      <div style={{
        width: 40, height: 40, flex: "0 0 auto",
        background: theme.surface2,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
          fontSize: 15, fontWeight: 600, marginBottom: 3, color: theme.ink,
        }}>{name}</div>
        <div style={{ fontSize: 12, color: theme.inkMuted, lineHeight: 1.45 }}>{desc}</div>
      </div>
      {href && !isDone ? (
        <a href={href} style={{
          flex: "0 0 auto", padding: "8px 14px",
          background: theme.accent, color: theme.accentInk,
          border: 0, cursor: "pointer",
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
          textTransform: "uppercase", fontWeight: 600,
          textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
        }}>{t.connect}</a>
      ) : (
        <button
          onClick={onConnect}
          disabled={!isIdle || connecting}
          style={{
            flex: "0 0 auto", padding: "8px 14px",
            background: isDone ? "transparent" : theme.accent,
            color: isDone ? theme.accent : theme.accentInk,
            border: isDone ? `0.5px solid ${theme.accent}` : 0,
            cursor: isIdle && !connecting ? "pointer" : "default",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em",
            textTransform: "uppercase", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}
        >{btnContent}</button>
      )}
    </div>
  );
}
