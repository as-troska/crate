// Auth + onboarding + settings + empty/error states.

const { useState: useStateS, useEffect: useEffectS } = React;

// ─────────────────────────────────────────────────────────────────────────
// Common atomic UI

const AuthShell = ({ theme, feel, typePair, language, children }) => (
  <div style={{
    width: '100%', height: '100%',
    minHeight: '100vh',
    background: theme.bg, color: theme.ink,
    fontFamily: typePair.ui,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 24px',
    position: 'relative',
    ['--display']: typePair.display,
    ['--ui']: typePair.ui,
    ['--mono']: typePair.mono,
  }}>
    {/* Subtle vignette */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, transparent 50%, ${theme.bg} 100%)`,
    }} />
    {/* Centered card */}
    <div style={{
      position: 'relative',
      width: '100%', maxWidth: 420,
      background: theme.surface,
      border: `0.5px solid ${theme.hairline}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)',
      padding: '40px 36px 32px',
    }}>
      <Brand theme={theme} feel={feel} />
      {children}
    </div>
  </div>
);

const Brand = ({ theme, feel, mark = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 28,
  }}>
    <Logo size={28} accent={theme.accent} ink={theme.ink} />
    <div>
      <div style={{
        fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
        fontSize: 22, fontWeight: feel.titleSerif ? 500 : 600,
        fontStyle: feel.titleSerif ? 'italic' : 'normal',
        letterSpacing: feel.titleSerif ? '0.005em' : '-0.01em',
        color: theme.ink, lineHeight: 1,
      }}>Crate</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
        color: theme.inkMuted, textTransform: 'uppercase', marginTop: 4,
      }}>Vinyl · Skrobbling</div>
    </div>
  </div>
);

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

const Field = ({ label, value, onChange, type = 'text', error, autoFocus, placeholder, theme, after, onKeyDown }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em',
      color: theme.inkMuted, textTransform: 'uppercase',
    }}>{label}</span>
    <div style={{
      display: 'flex', alignItems: 'center',
      background: theme.surface2,
      border: `0.5px solid ${error ? theme.accent : theme.hairlineStrong}`,
      transition: 'border-color 120ms',
    }}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1, background: 'transparent', border: 0, outline: 0,
          padding: '12px 14px',
          color: theme.ink, fontFamily: 'var(--ui)', fontSize: 14,
        }}
      />
      {after}
    </div>
    {error && (
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em',
        color: theme.accent, marginTop: 2,
      }}>! {error}</span>
    )}
  </label>
);

const PrimaryButton = ({ children, onClick, theme, feel, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%', padding: '13px 16px',
      background: disabled ? theme.surface2 : theme.accent,
      color: disabled ? theme.inkDim : theme.accentInk,
      border: 0, cursor: (disabled || loading) ? 'default' : 'pointer',
      fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
      fontSize: feel.uppercase ? 11 : 13.5,
      letterSpacing: feel.uppercase ? '0.14em' : '0.01em',
      textTransform: feel.uppercase ? 'uppercase' : 'none',
      fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      transition: 'opacity 120ms',
    }}>
    {loading && <Spinner color={theme.accentInk} size={12} />}
    {children}
  </button>
);

const Spinner = ({ size = 12, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{
    animation: 'crate-spin 0.8s linear infinite',
  }}>
    <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1.5" />
    <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LinkBtn = ({ children, onClick, theme }) => (
  <button onClick={onClick} style={{
    background: 'transparent', border: 0, color: theme.accent,
    cursor: 'pointer', fontFamily: 'var(--ui)', fontSize: 12.5,
    padding: 0, textDecoration: 'underline', textUnderlineOffset: 3,
    textDecorationColor: 'currentColor',
  }}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────
// Login

const LoginScreen = ({ t, theme, feel, typePair, onLogin, onSwitchToRegister }) => {
  const [u, setU] = useStateS('');
  const [p, setP] = useStateS('');
  const [show, setShow] = useStateS(false);
  const [err, setErr] = useStateS(null);
  const [loading, setLoading] = useStateS(false);

  const submit = () => {
    if (!u || !p) { setErr(t.err_invalid_login); return; }
    setLoading(true);
    setErr(null);
    // Simulate request
    setTimeout(() => {
      // Accept any non-empty creds in this mock
      setLoading(false);
      onLogin({ username: u });
    }, 700);
  };

  return (
    <AuthShell theme={theme} feel={feel} typePair={typePair}>
      <h1 style={{
        fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
        fontSize: feel.titleSerif ? 30 : 24,
        fontWeight: feel.titleSerif ? 500 : 600,
        fontStyle: feel.titleSerif ? 'italic' : 'normal',
        margin: '0 0 6px', letterSpacing: feel.titleSerif ? '0.005em' : '-0.015em',
        lineHeight: 1.1,
      }}>{t.welcome}</h1>
      <p style={{
        color: theme.inkMuted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.5,
      }}>{t.welcome_sub}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label={t.username} value={u} onChange={setU} theme={theme} autoFocus
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <Field label={t.password} value={p} onChange={setP} theme={theme}
          type={show ? 'text' : 'password'}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          error={err}
          after={
            <button onClick={() => setShow(!show)} style={{
              background: 'transparent', border: 0, padding: '0 12px',
              color: theme.inkMuted, cursor: 'pointer', fontSize: 14,
            }} title={show ? t.hide_password : t.show_password}>
              {show ? '◉' : '○'}
            </button>
          }
        />
        <div style={{ marginTop: 6 }}>
          <PrimaryButton onClick={submit} theme={theme} feel={feel} loading={loading}>
            {t.log_in}
          </PrimaryButton>
        </div>
      </div>

      <div style={{
        marginTop: 22, paddingTop: 18,
        borderTop: `0.5px solid ${theme.hairline}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--ui)', fontSize: 12.5, color: theme.inkMuted,
      }}>
        {t.new_user} <LinkBtn theme={theme} onClick={onSwitchToRegister}>{t.create_account}</LinkBtn>
      </div>
    </AuthShell>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Register

const RegisterScreen = ({ t, theme, feel, typePair, onRegister, onSwitchToLogin }) => {
  const [u, setU] = useStateS('');
  const [p, setP] = useStateS('');
  const [c, setC] = useStateS('');
  const [show, setShow] = useStateS(false);
  const [errs, setErrs] = useStateS({});
  const [loading, setLoading] = useStateS(false);

  const submit = () => {
    const e = {};
    if (!u) e.u = t.err_invalid_login;
    if (p.length < 8) e.p = t.err_too_short;
    if (p !== c) e.c = t.err_passwords_match;
    setErrs(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onRegister({ username: u });
    }, 800);
  };

  return (
    <AuthShell theme={theme} feel={feel} typePair={typePair}>
      <h1 style={{
        fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
        fontSize: feel.titleSerif ? 30 : 24,
        fontWeight: feel.titleSerif ? 500 : 600,
        fontStyle: feel.titleSerif ? 'italic' : 'normal',
        margin: '0 0 6px', letterSpacing: feel.titleSerif ? '0.005em' : '-0.015em',
        lineHeight: 1.1,
      }}>{t.create_account}</h1>
      <p style={{
        color: theme.inkMuted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.5,
      }}>{t.welcome_sub}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label={t.username} value={u} onChange={setU} theme={theme} autoFocus
          error={errs.u} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <Field label={t.password} value={p} onChange={setP} theme={theme}
          type={show ? 'text' : 'password'} error={errs.p}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          after={
            <button onClick={() => setShow(!show)} style={{
              background: 'transparent', border: 0, padding: '0 12px',
              color: theme.inkMuted, cursor: 'pointer', fontSize: 14,
            }}>{show ? '◉' : '○'}</button>
          } />
        <Field label={t.confirm_password} value={c} onChange={setC} theme={theme}
          type={show ? 'text' : 'password'} error={errs.c}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <div style={{ marginTop: 6 }}>
          <PrimaryButton onClick={submit} theme={theme} feel={feel} loading={loading}>
            {t.sign_up}
          </PrimaryButton>
        </div>
      </div>

      <div style={{
        marginTop: 22, paddingTop: 18,
        borderTop: `0.5px solid ${theme.hairline}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--ui)', fontSize: 12.5, color: theme.inkMuted,
      }}>
        {t.have_account} <LinkBtn theme={theme} onClick={onSwitchToLogin}>{t.back_to_login}</LinkBtn>
      </div>
    </AuthShell>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// OAuth Onboarding

const OnboardScreen = ({ t, theme, feel, typePair, onDone }) => {
  const [discogs, setDiscogs] = useStateS('idle'); // 'idle' | 'connecting' | 'done'
  const [lastfm, setLastfm] = useStateS('idle');

  const connect = (which) => {
    if (which === 'discogs') {
      setDiscogs('connecting');
      setTimeout(() => setDiscogs('done'), 2000);
    } else {
      setLastfm('connecting');
      setTimeout(() => setLastfm('done'), 1600);
    }
  };

  const step = discogs !== 'done' ? 1 : lastfm !== 'done' ? 2 : 3;
  const canFinish = discogs === 'done'; // last.fm optional

  return (
    <AuthShell theme={theme} feel={feel} typePair={typePair}>
      <h1 style={{
        fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
        fontSize: feel.titleSerif ? 28 : 22,
        fontWeight: feel.titleSerif ? 500 : 600,
        fontStyle: feel.titleSerif ? 'italic' : 'normal',
        margin: '0 0 6px', letterSpacing: feel.titleSerif ? '0.005em' : '-0.015em',
        lineHeight: 1.1,
      }}>{t.onboard_title}</h1>
      <p style={{ color: theme.inkMuted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.5 }}>
        {t.onboard_sub}
      </p>

      {/* Progress */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
        marginBottom: 24,
      }}>
        {[
          { label: t.step_discogs, status: discogs },
          { label: t.step_lastfm, status: lastfm },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{
              height: 2, width: '100%',
              background: s.status === 'done' ? theme.accent : theme.hairlineStrong,
              transition: 'background 240ms',
            }} />
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
              color: s.status === 'done' ? theme.accent : theme.inkMuted,
              textTransform: 'uppercase',
            }}>{t.step} {i + 1}</div>
          </div>
        ))}
      </div>

      <ServiceRow
        name={t.discogs} desc={t.discogs_desc}
        status={discogs} t={t} theme={theme} feel={feel}
        onConnect={() => connect('discogs')}
        icon={<DiscogsMark color={theme.accent} />}
      />
      <ServiceRow
        name={t.lastfm} desc={t.lastfm_desc}
        status={lastfm} t={t} theme={theme} feel={feel}
        onConnect={() => connect('lastfm')}
        icon={<LastfmMark color={theme.accent} />}
      />

      <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
        <button onClick={() => onDone({ skipped: true })} style={{
          flex: '0 0 auto', padding: '13px 14px',
          background: 'transparent', border: `0.5px solid ${theme.hairline}`,
          color: theme.inkMuted, cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}>{t.skip_for_now}</button>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={() => onDone({ skipped: false })} theme={theme} feel={feel}
            disabled={!canFinish}>
            {t.finish_setup}
          </PrimaryButton>
        </div>
      </div>
    </AuthShell>
  );
};

const ServiceRow = ({ name, desc, status, icon, t, theme, feel, onConnect }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '16px 0',
    borderTop: `0.5px solid ${theme.hairline}`,
  }}>
    <div style={{
      width: 40, height: 40, flex: '0 0 auto',
      background: theme.surface2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
        fontSize: 15, fontWeight: 600, marginBottom: 3,
      }}>{name}</div>
      <div style={{ fontSize: 12, color: theme.inkMuted, lineHeight: 1.45 }}>{desc}</div>
    </div>
    <button onClick={onConnect}
      disabled={status !== 'idle'}
      style={{
        flex: '0 0 auto', padding: '8px 14px',
        background: status === 'done' ? 'transparent' : theme.accent,
        color: status === 'done' ? theme.accent : theme.accentInk,
        border: status === 'done' ? `0.5px solid ${theme.accent}` : 0,
        cursor: status === 'idle' ? 'pointer' : 'default',
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
      {status === 'connecting' && <Spinner color={theme.accentInk} size={10} />}
      {status === 'done' && <span>✓</span>}
      {status === 'idle' ? t.connect : status === 'connecting' ? t.waiting_authorize.slice(0, 8) + '…' : t.connected}
    </button>
  </div>
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

// ─────────────────────────────────────────────────────────────────────────
// Settings overlay

const SettingsScreen = ({ t, theme, feel, typePair, prefs, setPrefs, onClose, onLogout, user }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
      animation: 'crate-fadein 200ms ease',
      display: 'flex', justifyContent: 'flex-end',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 440, height: '100%',
        background: theme.surface, color: theme.ink,
        boxShadow: '-30px 0 80px rgba(0,0,0,0.5)',
        borderLeft: `0.5px solid ${theme.hairlineStrong}`,
        fontFamily: typePair.ui,
        ['--display']: typePair.display,
        ['--ui']: typePair.ui,
        ['--mono']: typePair.mono,
        animation: 'crate-slidein-right 280ms cubic-bezier(.2,.7,.2,1)',
        overflowY: 'auto',
        padding: '24px 28px 40px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
            fontSize: feel.titleSerif ? 26 : 20,
            fontStyle: feel.titleSerif ? 'italic' : 'normal',
            fontWeight: feel.titleSerif ? 500 : 600, margin: 0,
            letterSpacing: feel.titleSerif ? '0.005em' : '-0.015em',
          }}>{t.settings}</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 16,
            background: 'transparent', border: `0.5px solid ${theme.hairline}`,
            color: theme.inkMuted, cursor: 'pointer', fontSize: 14,
          }}>×</button>
        </div>

        <SettingsSection label={t.theme_label} theme={theme}>
          <ThemeGrid theme={theme} feel={feel} prefs={prefs} setPrefs={setPrefs} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
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
                { v: 'classic', l: 'Klassisk' },
                { v: 'modernist', l: 'Modernist' },
                { v: 'hifi', l: 'Hi-Fi' },
              ]}
              value={prefs.typePairing}
              onChange={(v) => setPrefs((p) => ({ ...p, typePairing: v }))} />
          </SettingRow>
          <SettingRow label={t.density_label} theme={theme}>
            <Seg theme={theme} feel={feel}
              options={[
                { v: 'tight', l: t.density_tight },
                { v: 'comfortable', l: t.density_comfortable },
                { v: 'spacious', l: t.density_spacious },
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
              { v: 'bar', l: t.np_bar, sub: 'Diskret, tek lite plass' },
              { v: 'expanded', l: t.np_expanded, sub: 'Heile skjermen, animert' },
              { v: 'side', l: t.np_side, sub: 'Til høgre, alltid synleg' },
            ]}
            value={prefs.nowPlayingStyle}
            onChange={(v) => setPrefs((p) => ({ ...p, nowPlayingStyle: v }))} />
        </SettingsSection>

        <SettingsSection label={t.language_label} theme={theme}>
          <Seg theme={theme} feel={feel}
            options={[
              { v: 'nn', l: 'Nynorsk' },
              { v: 'en', l: 'English' },
            ]}
            value={prefs.language}
            onChange={(v) => setPrefs((p) => ({ ...p, language: v }))} />
        </SettingsSection>

        <SettingsSection label={t.accounts} theme={theme}>
          <AccountRow name={t.discogs} username={user?.username + '-discogs'} theme={theme} feel={feel}
            icon={<DiscogsMark color={theme.accent} />} />
          <AccountRow name={t.lastfm} username={user?.username} theme={theme} feel={feel}
            icon={<LastfmMark color={theme.accent} />} />
          <button onClick={onLogout} style={{
            marginTop: 14, width: '100%', padding: '11px 14px',
            background: 'transparent', border: `0.5px solid ${theme.hairline}`,
            color: theme.inkMuted, cursor: 'pointer',
            fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
            fontSize: feel.uppercase ? 10.5 : 12.5,
            letterSpacing: feel.uppercase ? '0.14em' : '0.01em',
            textTransform: feel.uppercase ? 'uppercase' : 'none',
          }}>{t.log_out}</button>
        </SettingsSection>
      </div>
    </div>
  );
};

const SettingsSection = ({ label, children, theme }) => (
  <div style={{
    padding: '18px 0',
    borderBottom: `0.5px solid ${theme.hairline}`,
  }}>
    <div style={{
      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
      color: theme.inkMuted, textTransform: 'uppercase', marginBottom: 12,
    }}>{label}</div>
    {children}
  </div>
);

const SettingRow = ({ label, children, theme }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, marginBottom: 12,
  }}>
    <div style={{ fontFamily: 'var(--ui)', fontSize: 13, color: theme.ink }}>{label}</div>
    {children}
  </div>
);

const ThemeGrid = ({ theme, feel, prefs, setPrefs }) => {
  const themeKeys = ['studio', 'vinyl', 'vu', 'paper', 'sodium'];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
    }}>
      {themeKeys.map((k) => {
        const dir = DIRECTIONS[k];
        const variant = prefs.dark ? dir.dark : dir.light;
        const isActive = prefs.direction === k;
        return (
          <button key={k} onClick={() => setPrefs((p) => ({ ...p, direction: k }))}
            style={{
              border: `1.5px solid ${isActive ? theme.accent : theme.hairlineStrong}`,
              padding: 0, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'stretch',
              background: 'transparent',
            }}>
            <div style={{
              aspectRatio: '1/1',
              background: variant.bg,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 4, top: 4, right: 4, height: 6,
                background: variant.surface,
              }} />
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 16, height: 16, borderRadius: '50%',
                background: variant.accent,
                transform: 'translate(-50%, -50%)',
              }} />
              <div style={{
                position: 'absolute', left: 6, bottom: 4, right: 6, height: 4,
                background: variant.accent, opacity: 0.4,
              }} />
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.10em',
              color: isActive ? theme.accent : theme.inkMuted,
              textTransform: 'uppercase', textAlign: 'center',
              padding: '4px 0',
            }}>{dir.name}</div>
          </button>
        );
      })}
    </div>
  );
};

const ModeBtn = ({ active, label, onClick, theme, feel }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: '8px 10px',
    border: `0.5px solid ${active ? theme.accent : theme.hairline}`,
    background: active ? theme.accent : 'transparent',
    color: active ? theme.accentInk : theme.inkMuted,
    cursor: 'pointer',
    fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
    fontSize: feel.uppercase ? 10 : 12,
    letterSpacing: feel.uppercase ? '0.12em' : '0.01em',
    textTransform: feel.uppercase ? 'uppercase' : 'none',
    fontWeight: 500,
  }}>{label}</button>
);

const Seg = ({ options, value, onChange, theme, feel, vertical }) => (
  <div style={{
    display: 'flex', flexDirection: vertical ? 'column' : 'row',
    background: theme.surface2,
    border: `0.5px solid ${theme.hairline}`,
    padding: 2,
    gap: vertical ? 0 : 2, width: vertical ? '100%' : 'auto',
  }}>
    {options.map((o) => {
      const sel = o.v === value;
      return (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex: 1, padding: vertical ? '10px 12px' : '6px 10px',
          background: sel ? theme.accent : 'transparent',
          color: sel ? theme.accentInk : theme.ink,
          border: 0, cursor: 'pointer',
          fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
          fontSize: vertical ? 12.5 : (feel.uppercase ? 10 : 11.5),
          letterSpacing: feel.uppercase ? '0.10em' : '0.01em',
          textTransform: vertical ? 'none' : (feel.uppercase ? 'uppercase' : 'none'),
          fontWeight: 500, textAlign: 'left',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <span>{o.l}</span>
          {o.sub && <span style={{
            fontSize: 10.5, fontFamily: 'var(--mono)', letterSpacing: '0.04em',
            color: sel ? theme.accentInk : theme.inkMuted, opacity: 0.85,
          }}>{o.sub}</span>}
        </button>
      );
    })}
  </div>
);

const Toggle = ({ on, onChange, theme }) => (
  <button onClick={() => onChange(!on)} style={{
    width: 38, height: 22, borderRadius: 11,
    background: on ? theme.accent : theme.hairlineStrong,
    border: 0, cursor: 'pointer', position: 'relative',
    transition: 'background 180ms',
  }}>
    <span style={{
      position: 'absolute', top: 2, left: on ? 18 : 2,
      width: 18, height: 18, borderRadius: '50%',
      background: theme.surface,
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      transition: 'left 160ms cubic-bezier(.2,.7,.2,1)',
    }} />
  </button>
);

const AccountRow = ({ name, username, icon, theme, feel }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 0',
  }}>
    <div style={{ flex: '0 0 auto' }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--ui)', fontSize: 13, color: theme.ink }}>{name}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: theme.inkMuted, letterSpacing: '0.04em' }}>
        @{username}
      </div>
    </div>
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
      color: theme.accent, textTransform: 'uppercase',
    }}>● Kopla</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Empty + error state cards

const EmptyState = ({ icon, title, sub, theme, feel, action }) => (
  <div style={{
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 40, textAlign: 'center', gap: 14,
  }}>
    <div style={{ color: theme.inkDim, fontSize: 64, lineHeight: 1 }}>{icon}</div>
    <h3 style={{
      fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
      fontSize: feel.titleSerif ? 28 : 20,
      fontStyle: feel.titleSerif ? 'italic' : 'normal',
      fontWeight: feel.titleSerif ? 500 : 600,
      margin: 0, color: theme.ink, letterSpacing: feel.titleSerif ? '0.005em' : '-0.01em',
    }}>{title}</h3>
    <p style={{
      maxWidth: 380, color: theme.inkMuted, fontSize: 13.5, margin: 0, lineHeight: 1.5,
    }}>{sub}</p>
    {action}
  </div>
);

window.LoginScreen = LoginScreen;
window.RegisterScreen = RegisterScreen;
window.OnboardScreen = OnboardScreen;
window.SettingsScreen = SettingsScreen;
window.EmptyState = EmptyState;
window.AppLogo = Logo;
