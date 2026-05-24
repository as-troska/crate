import React, { useState, useEffect } from "react";
import { API } from "./api";
import { DIRECTIONS, TYPE_PAIRINGS, I18N, DEFAULT_PREFS } from "./themes";
import Login from "./Login";
import OAuthSetup from "./OAuthSetup";
import Collection from "./Collection";
import Settings from "./Settings";

function loadPrefs() {
  try {
    const saved = localStorage.getItem("crate.prefs");
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PREFS;
}

function savePrefs(prefs) {
  try { localStorage.setItem("crate.prefs", JSON.stringify(prefs)); } catch {}
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [screen, setScreen] = useState("login"); // 'login' | 'onboard' | 'main'
  const [oauthChecked, setOauthChecked] = useState(false);
  const [discogsOk, setDiscogsOk] = useState(false);
  const [lastfmOk, setLastfmOk] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefsState] = useState(loadPrefs);

  function setPrefs(updater) {
    setPrefsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      savePrefs(next);
      return next;
    });
  }

  // Compute theme for non-collection screens
  const dirSpec = DIRECTIONS[prefs.direction] || DIRECTIONS.paper;
  const theme = prefs.dark ? dirSpec.dark : dirSpec.light;
  const feel = dirSpec.feel;
  const t = I18N[prefs.language] || I18N.en;
  const typePair = TYPE_PAIRINGS[prefs.typePairing] || TYPE_PAIRINGS.classic;

  // On mount: check if we already have a valid token + oauth
  useEffect(() => {
    if (!token) { setScreen("login"); setOauthChecked(true); return; }
    checkOAuth();
  }, [token]);

  async function checkOAuth() {
    try {
      const [dr, lr] = await Promise.all([
        fetch(API + "/discogs/hasTokens", { headers: { Authorization: "Bearer " + token } }),
        fetch(API + "/lastfm/checkAuthorized", { headers: { Authorization: "Bearer " + token } }),
      ]);
      const dd = await dr.json();
      const ld = await lr.json();
      const dOk = dd.status === "authorized";
      const lOk = ld.authorized;
      setDiscogsOk(dOk);
      setLastfmOk(lOk);
      setScreen(dOk ? "main" : "onboard");
    } catch {
      setScreen("onboard");
    }
    setOauthChecked(true);
  }

  function handleLogin(newToken, newUserId, newUsername) {
    setToken(newToken);
    setUsername(newUsername || "");
    setOauthChecked(false);
    setDiscogsOk(false);
    setLastfmOk(false);
  }

  function handleLogout() {
    if (token) {
      fetch(API + "/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      }).catch(() => {});
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken(null);
    setUsername("");
    setScreen("login");
    setOauthChecked(true);
    setDiscogsOk(false);
    setLastfmOk(false);
    setSettingsOpen(false);
  }

  function handleOAuthReady() {
    checkOAuth();
  }

  // Loading state (checking oauth)
  if (token && !oauthChecked) {
    return (
      <div style={{
        width: "100%", height: "100%",
        background: theme.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: typePair.ui,
        "--display": typePair.display, "--ui": typePair.ui, "--mono": typePair.mono,
      }}>
        <svg width="28" height="28" viewBox="0 0 16 16" style={{ animation: "crate-spin 0.8s linear infinite" }}>
          <circle cx="8" cy="8" r="6" fill="none" stroke={theme.accent} strokeOpacity="0.3" strokeWidth="1.5" />
          <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!token || screen === "login") {
    return (
      <Login
        t={t} theme={theme} feel={feel} typePair={typePair}
        onLogin={handleLogin}
      />
    );
  }

  if (screen === "onboard") {
    return (
      <OAuthSetup
        token={token}
        t={t} theme={theme} feel={feel} typePair={typePair}
        onReady={handleOAuthReady}
      />
    );
  }

  // Main app
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Collection
        token={token}
        prefs={prefs}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {settingsOpen && (
        <Settings
          theme={theme} feel={feel} typePair={typePair} t={t}
          prefs={prefs} setPrefs={setPrefs}
          username={username}
          discogsOk={discogsOk}
          lastfmOk={lastfmOk}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
