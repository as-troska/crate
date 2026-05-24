import React, { useState } from "react";
import { API } from "./api";

// ─── Shared auth UI atoms ─────────────────────────────────────────────────

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

const Spinner = ({ size = 12, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: "crate-spin 0.8s linear infinite" }}>
    <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1.5" />
    <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AuthShell = ({ theme, feel, typePair, children }) => (
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
      position: "relative", width: "100%", maxWidth: 420,
      background: theme.surface, border: `0.5px solid ${theme.hairline}`,
      boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)",
      padding: "40px 36px 32px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <Logo size={28} accent={theme.accent} ink={theme.ink} />
        <div>
          <div style={{
            fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
            fontSize: 22, fontWeight: feel.titleSerif ? 500 : 600,
            fontStyle: feel.titleSerif ? "italic" : "normal",
            letterSpacing: feel.titleSerif ? "0.005em" : "-0.01em",
            color: theme.ink, lineHeight: 1,
          }}>Crate</div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.18em",
            color: theme.inkMuted, textTransform: "uppercase", marginTop: 4,
          }}>Vinyl · Scrobbling</div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", error, autoFocus, theme, after, onKeyDown }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span style={{
      fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.14em",
      color: theme.inkMuted, textTransform: "uppercase",
    }}>{label}</span>
    <div style={{
      display: "flex", alignItems: "center",
      background: theme.surface2,
      border: `0.5px solid ${error ? theme.accent : theme.hairlineStrong}`,
      transition: "border-color 120ms",
    }}>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        style={{
          flex: 1, background: "transparent", border: 0, outline: 0,
          padding: "12px 14px", color: theme.ink,
          fontFamily: "var(--ui)", fontSize: 14,
        }}
      />
      {after}
    </div>
    {error && (
      <span style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.06em",
        color: theme.accent, marginTop: 2,
      }}>! {error}</span>
    )}
  </label>
);

const PrimaryBtn = ({ children, onClick, theme, feel, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: "100%", padding: "13px 16px",
      background: disabled ? theme.surface2 : theme.accent,
      color: disabled ? theme.inkDim : theme.accentInk,
      border: 0, cursor: (disabled || loading) ? "default" : "pointer",
      fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
      fontSize: feel.uppercase ? 11 : 13.5,
      letterSpacing: feel.uppercase ? "0.14em" : "0.01em",
      textTransform: feel.uppercase ? "uppercase" : "none",
      fontWeight: 600,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      transition: "opacity 120ms",
    }}
  >
    {loading && <Spinner color={theme.accentInk} size={12} />}
    {children}
  </button>
);

const LinkBtn = ({ children, onClick, theme }) => (
  <button onClick={onClick} style={{
    background: "transparent", border: 0, color: theme.accent,
    cursor: "pointer", fontFamily: "var(--ui)", fontSize: 12.5,
    padding: 0, textDecoration: "underline", textUnderlineOffset: 3,
  }}>
    {children}
  </button>
);

// ─── Privacy overlay ──────────────────────────────────────────────────────

const PrivacyModal = ({ theme, feel, typePair, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 2000,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24, animation: "crate-fadein 200ms ease",
    "--display": typePair.display, "--ui": typePair.ui, "--mono": typePair.mono,
  }} onClick={onClose}>
    <div style={{
      background: theme.surface, border: `0.5px solid ${theme.hairlineStrong}`,
      maxWidth: 520, width: "100%", maxHeight: "80vh",
      overflowY: "auto", padding: "32px 36px",
      boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
      animation: "crate-slideup 280ms cubic-bezier(.2,.7,.2,1)",
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{
          fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
          fontSize: feel.titleSerif ? 26 : 20,
          fontStyle: feel.titleSerif ? "italic" : "normal",
          fontWeight: feel.titleSerif ? 500 : 600, margin: 0, color: theme.ink,
        }}>Privacy &amp; Data</h2>
        <button onClick={onClose} style={{
          background: "transparent", border: 0, color: theme.inkMuted,
          cursor: "pointer", fontSize: 18,
        }}>×</button>
      </div>

      {[
        ["What Crate stores", [
          "Username and password — stored as a one-way scrypt hash. We cannot read your password.",
          "Discogs OAuth token — to fetch your collection. Stored locally on this server.",
          "Last.fm session key — to scrobble tracks. Same local storage.",
          "Your record collection — titles, artists, cover art and tracklists from Discogs, cached locally.",
          "Cover images — fetched from Discogs CDN and cached on disk to avoid repeated downloads.",
        ]],
        ["What Crate never does", [
          "Sends no data to third parties beyond what Discogs and Last.fm integration requires.",
          "Uses no analytics, tracking pixels, or cookies beyond the session token.",
          "Sells, shares, or analyses your data.",
        ]],
      ].map(([heading, items]) => (
        <div key={heading} style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em",
            color: theme.accent, textTransform: "uppercase", marginBottom: 10,
          }}>{heading}</div>
          {items.map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, marginBottom: 8,
              fontFamily: "var(--ui)", fontSize: 13, color: theme.inkMuted, lineHeight: 1.5,
            }}>
              <span style={{ color: theme.inkDim, flexShrink: 0 }}>—</span>
              {item}
            </div>
          ))}
        </div>
      ))}

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
        color: theme.inkDim, marginTop: 20, paddingTop: 16,
        borderTop: `0.5px solid ${theme.hairline}`,
      }}>
        All data is stored in a SQLite database on this server. You can delete your account and all associated data from Settings → Accounts.
      </div>
    </div>
  </div>
);

// ─── Login screen ─────────────────────────────────────────────────────────

function LoginScreen({ t, theme, feel, typePair, onLogin, onSwitchToRegister, onShowPrivacy }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!u || !p) { setErr(t.err_invalid_login); return; }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || t.err_invalid_login); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.userId));
      localStorage.setItem("username", data.username);
      onLogin(data.token, data.userId, data.username);
    } catch {
      setErr("Network error");
    }
    setLoading(false);
  }

  return (
    <AuthShell theme={theme} feel={feel} typePair={typePair}>
      <h1 style={{
        fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
        fontSize: feel.titleSerif ? 30 : 24,
        fontWeight: feel.titleSerif ? 500 : 600,
        fontStyle: feel.titleSerif ? "italic" : "normal",
        margin: "0 0 6px", letterSpacing: feel.titleSerif ? "0.005em" : "-0.015em",
        color: theme.ink, lineHeight: 1.1,
      }}>{t.welcome}</h1>
      <p style={{ color: theme.inkMuted, fontSize: 13, margin: "0 0 24px", lineHeight: 1.5 }}>
        {t.welcome_sub}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={t.username} value={u} onChange={setU} theme={theme} autoFocus
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        <Field label={t.password} value={p} onChange={setP} theme={theme}
          type={show ? "text" : "password"}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          error={err}
          after={
            <button onClick={() => setShow(!show)} style={{
              background: "transparent", border: 0, padding: "0 12px",
              color: theme.inkMuted, cursor: "pointer", fontSize: 14,
            }} title={show ? t.hide_password : t.show_password}>
              {show ? "◉" : "○"}
            </button>
          }
        />
        <div style={{ marginTop: 6 }}>
          <PrimaryBtn onClick={submit} theme={theme} feel={feel} loading={loading}>
            {t.log_in}
          </PrimaryBtn>
        </div>
      </div>

      <div style={{
        marginTop: 22, paddingTop: 18,
        borderTop: `0.5px solid ${theme.hairline}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "var(--ui)", fontSize: 12.5, color: theme.inkMuted,
      }}>
        {t.new_user} <LinkBtn theme={theme} onClick={onSwitchToRegister}>{t.create_account}</LinkBtn>
      </div>

      <div style={{ marginTop: 12, textAlign: "center" }}>
        <LinkBtn theme={theme} onClick={onShowPrivacy}>{t.privacy}</LinkBtn>
      </div>
    </AuthShell>
  );
}

// ─── Register screen ──────────────────────────────────────────────────────

function RegisterScreen({ t, theme, feel, typePair, onRegister, onSwitchToLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    const e = {};
    if (!u) e.u = "Required";
    if (p.length < 8) e.p = t.err_too_short;
    if (p !== c) e.c = t.err_passwords_match;
    setErrs(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const res = await fetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrs({ u: data.error || t.err_username_taken });
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.userId));
      localStorage.setItem("username", data.username);
      onRegister(data.token, data.userId, data.username);
    } catch {
      setErrs({ u: "Network error" });
    }
    setLoading(false);
  }

  return (
    <AuthShell theme={theme} feel={feel} typePair={typePair}>
      <h1 style={{
        fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
        fontSize: feel.titleSerif ? 30 : 24,
        fontWeight: feel.titleSerif ? 500 : 600,
        fontStyle: feel.titleSerif ? "italic" : "normal",
        margin: "0 0 6px", letterSpacing: feel.titleSerif ? "0.005em" : "-0.015em",
        color: theme.ink, lineHeight: 1.1,
      }}>{t.create_account}</h1>
      <p style={{ color: theme.inkMuted, fontSize: 13, margin: "0 0 24px", lineHeight: 1.5 }}>
        {t.welcome_sub}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={t.username} value={u} onChange={setU} theme={theme} autoFocus
          error={errs.u} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <Field label={t.password} value={p} onChange={setP} theme={theme}
          type={show ? "text" : "password"} error={errs.p}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          after={
            <button onClick={() => setShow(!show)} style={{
              background: "transparent", border: 0, padding: "0 12px",
              color: theme.inkMuted, cursor: "pointer", fontSize: 14,
            }}>{show ? "◉" : "○"}</button>
          }
        />
        <Field label={t.confirm_password} value={c} onChange={setC} theme={theme}
          type={show ? "text" : "password"} error={errs.c}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        <div style={{ marginTop: 6 }}>
          <PrimaryBtn onClick={submit} theme={theme} feel={feel} loading={loading}>
            {t.sign_up}
          </PrimaryBtn>
        </div>
      </div>

      <div style={{
        marginTop: 22, paddingTop: 18,
        borderTop: `0.5px solid ${theme.hairline}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "var(--ui)", fontSize: 12.5, color: theme.inkMuted,
      }}>
        {t.have_account} <LinkBtn theme={theme} onClick={onSwitchToLogin}>{t.back_to_login}</LinkBtn>
      </div>
    </AuthShell>
  );
}

// ─── Main export: switches between login and register ─────────────────────

export default function Login({ theme, feel, typePair, t, onLogin }) {
  const [mode, setMode] = useState("login");
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      {showPrivacy && (
        <PrivacyModal theme={theme} feel={feel} typePair={typePair} onClose={() => setShowPrivacy(false)} />
      )}
      {mode === "login" ? (
        <LoginScreen
          t={t} theme={theme} feel={feel} typePair={typePair}
          onLogin={onLogin}
          onSwitchToRegister={() => setMode("register")}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      ) : (
        <RegisterScreen
          t={t} theme={theme} feel={feel} typePair={typePair}
          onRegister={onLogin}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </>
  );
}
