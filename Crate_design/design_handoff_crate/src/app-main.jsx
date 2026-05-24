// app-main.jsx — production-shaped single-app shell with router

const { useState: useAS, useEffect: useAE, useMemo: useAM } = React;

// Persist prefs across the prototype session
const DEFAULT_PREFS = {
  direction: 'studio',
  dark: true,
  language: 'nn',
  density: 'comfortable',
  typePairing: 'classic',
  nowPlayingStyle: 'bar',
  reflection: false,
};

// Inflate a base collection to arbitrary length by repeating, for stress-testing
function inflate(base, n) {
  if (n <= base.length) return base.slice(0, n);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const src = base[i % base.length];
    out[i] = { ...src, id: i + 1, _displayTitle: i < base.length ? src.title : `${src.title} (${Math.floor(i / base.length) + 1})` };
  }
  // We don't replace title — the duplicate looks identical, which is the point of stress-testing layout, not data
  return out;
}

function AppShell() {
  const [screen, setScreen] = useAS('login'); // 'login' | 'register' | 'onboard' | 'main'
  const [user, setUser] = useAS(null);
  const [prefs, setPrefs] = useAS(DEFAULT_PREFS);
  const [settingsOpen, setSettingsOpen] = useAS(false);
  const [stateMode, setStateMode] = useAS('normal'); // 'normal' | 'empty' | 'offline'
  const [collectionSize, setCollectionSize] = useAS(null); // null = real (~30)

  const dirSpec = DIRECTIONS[prefs.direction] || DIRECTIONS.studio;
  const themeColors = prefs.dark ? dirSpec.dark : dirSpec.light;
  const feel = dirSpec.feel;
  const t = I18N[prefs.language] || I18N.nn;
  const typePair = TYPE_PAIRINGS[prefs.typePairing] || TYPE_PAIRINGS.classic;

  const albums = useAM(() => {
    if (collectionSize == null) return CRATE_COLLECTION;
    return inflate(CRATE_COLLECTION, collectionSize);
  }, [collectionSize]);

  // ── Dev nav (top-right) — only visible in prototype, removed in production
  const devNav = (
    <DevNav theme={themeColors} prefs={prefs} setPrefs={setPrefs}
      screen={screen} setScreen={setScreen}
      stateMode={stateMode} setStateMode={setStateMode}
      collectionSize={collectionSize} setCollectionSize={setCollectionSize}
      onLogout={() => { setUser(null); setScreen('login'); }}
    />
  );

  if (screen === 'login') {
    return (
      <>
        <LoginScreen t={t} theme={themeColors} feel={feel} typePair={typePair}
          onLogin={(u) => { setUser(u); setScreen('onboard'); }}
          onSwitchToRegister={() => setScreen('register')}
        />
        {devNav}
      </>
    );
  }

  if (screen === 'register') {
    return (
      <>
        <RegisterScreen t={t} theme={themeColors} feel={feel} typePair={typePair}
          onRegister={(u) => { setUser(u); setScreen('onboard'); }}
          onSwitchToLogin={() => setScreen('login')}
        />
        {devNav}
      </>
    );
  }

  if (screen === 'onboard') {
    return (
      <>
        <OnboardScreen t={t} theme={themeColors} feel={feel} typePair={typePair}
          onDone={() => setScreen('main')}
        />
        {devNav}
      </>
    );
  }

  // Main app
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <CrateApp
          direction={prefs.direction}
          dark={prefs.dark}
          language={prefs.language}
          density={prefs.density}
          typePairing={prefs.typePairing}
          nowPlayingStyle={prefs.nowPlayingStyle}
          reflection={prefs.reflection}
          albums={albums}
          onOpenSettings={() => setSettingsOpen(true)}
          forceState={stateMode === 'normal' ? null : stateMode}
        />
      </div>

      {settingsOpen && (
        <SettingsScreen
          t={t} theme={themeColors} feel={feel} typePair={typePair}
          prefs={prefs} setPrefs={setPrefs}
          user={user}
          onClose={() => setSettingsOpen(false)}
          onLogout={() => { setUser(null); setSettingsOpen(false); setScreen('login'); }}
        />
      )}

      {devNav}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Dev nav — small floating panel for jumping between screens and states.
// Hidden in production (control via env / build flag).
function DevNav({ theme, prefs, setPrefs, screen, setScreen, stateMode, setStateMode, collectionSize, setCollectionSize, onLogout }) {
  const [open, setOpen] = useAS(false);

  return (
    <div style={{
      position: 'fixed', bottom: 10, left: 10, zIndex: 2147483645,
      fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
      fontSize: 10, letterSpacing: '0.06em',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: '6px 10px',
        background: 'rgba(20,20,20,0.85)', color: '#dadada', border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: '#19D1F8' }}>●</span> PROTOTYPE
      </button>
      {open && (
        <div style={{
          marginBottom: 6, position: 'absolute', bottom: '100%', left: 0,
          padding: 12,
          background: 'rgba(15,15,15,0.94)', color: '#dadada',
          border: '1px solid rgba(255,255,255,0.15)',
          width: 220, backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <DevSection label="Skjerm">
            <DevSeg value={screen} onChange={setScreen} options={[
              { v: 'login', l: 'Login' },
              { v: 'register', l: 'Reg' },
              { v: 'onboard', l: 'OAuth' },
              { v: 'main', l: 'Main' },
            ]} />
          </DevSection>
          <DevSection label="Tilstand">
            <DevSeg value={stateMode} onChange={setStateMode} options={[
              { v: 'normal', l: 'Normal' },
              { v: 'empty', l: 'Tom' },
              { v: 'offline', l: 'Offline' },
            ]} />
          </DevSection>
          <DevSection label="Mengd plater">
            <DevSeg value={collectionSize ?? 0} onChange={(v) => setCollectionSize(v === 0 ? null : v)} options={[
              { v: 0, l: '~30' },
              { v: 200, l: '200' },
              { v: 2000, l: '2k' },
              { v: 20000, l: '20k' },
            ]} />
          </DevSection>
          <div style={{ fontSize: 9, color: '#666', lineHeight: 1.5, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            Dev-overlay. Gøymt i produksjon.
          </div>
        </div>
      )}
    </div>
  );
}

function DevSection({ label, children }) {
  return (
    <div>
      <div style={{ color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function DevSeg({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex: 1, padding: '4px 6px', border: 0,
          background: o.v === value ? '#19D1F8' : 'rgba(255,255,255,0.06)',
          color: o.v === value ? '#001016' : '#dadada',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 9.5,
          letterSpacing: '0.05em',
        }}>{o.l}</button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppShell />);
