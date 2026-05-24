// main.jsx — wires CrateApp instances into design_canvas with shared Tweaks

const { useState: useStateMain } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "language": "nn",
  "dark": true,
  "density": "comfortable",
  "typePairing": "classic",
  "nowPlayingStyle": "bar",
  "accentMode": "signature",
  "reflection": false
}/*EDITMODE-END*/;

// Accent override palettes when user picks one (overrides each direction's signature accent)
const ACCENT_PALETTES = {
  signature: { label: "Signatur (kvar retning)", color: null },
  cyan:      { label: "Elektrisk cyan",          color: "#19D1F8" },
  oxblood:   { label: "Okseblød",              color: "#C73E3A" },
  phosphor:  { label: "Fosforgrøn",            color: "#7FE389" },
  amber:     { label: "Tungsten-rav",            color: "#F5A623" },
};

function CrateCanvas() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const accentOverride = ACCENT_PALETTES[tw.accentMode]?.color || null;

  const appProps = (direction) => ({
    direction,
    dark: tw.dark,
    language: tw.language,
    density: tw.density,
    typePairing: tw.typePairing,
    nowPlayingStyle: tw.nowPlayingStyle,
    accentOverride,
    reflection: tw.reflection,
  });

  const triggerScript = (direction) => {
    // Open the focused album in the modal so the user sees the detail screen too,
    // wired via global event so the artboard's CrateApp picks it up.
  };

  return (
    <React.Fragment>
      <DesignCanvas>
        <DCSection
          id="audiophile"
          title="Crate · tre retningar"
          subtitle="Same skjermar, tre takingar på noir + audiofil. Klikk og bla i kvar prototype."
        >
          <DCArtboard id="studio" label="STUDIO · brushed chrome + cyan" width={1280} height={820}>
            <CrateApp {...appProps('studio')} />
          </DCArtboard>
          <DCArtboard id="vinyl" label="VINYL · cream paper + oxblood" width={1280} height={820}>
            <CrateApp {...appProps('vinyl')} />
          </DCArtboard>
          <DCArtboard id="vu" label="VU · matte black + phosphor" width={1280} height={820}>
            <CrateApp {...appProps('vu')} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Crate · Tweaks">
        <TweakSection label="Innhald" />
        <TweakRadio label="Språk" value={tw.language}
          options={[{value:'nn',label:'Nynorsk'},{value:'en',label:'English'}]}
          onChange={(v) => setTweak('language', v)} />

        <TweakSection label="Tone" />
        <TweakToggle label="Mørkt tema" value={tw.dark}
          onChange={(v) => setTweak('dark', v)} />
        <TweakSelect label="Aksent (alle retningar)"
          value={tw.accentMode}
          options={Object.entries(ACCENT_PALETTES).map(([k,v])=>({value:k,label:v.label}))}
          onChange={(v) => setTweak('accentMode', v)} />

        <TweakSection label="Typografi" />
        <TweakSelect label="Paring" value={tw.typePairing}
          options={[
            {value:'classic',label:'Klassisk — Cormorant + Inter'},
            {value:'modernist',label:'Modernistisk — Inter only'},
            {value:'hifi',label:'Hi-Fi — Fraunces + IBM Plex'},
          ]}
          onChange={(v) => setTweak('typePairing', v)} />

        <TweakSection label="Layout" />
        <TweakRadio label="Tettleik" value={tw.density}
          options={[
            {value:'tight',label:'Tett'},
            {value:'comfortable',label:'Komf.'},
            {value:'spacious',label:'Luftig'},
          ]}
          onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="Spegelrefleks" value={tw.reflection}
          onChange={(v) => setTweak('reflection', v)} />
        <TweakSelect label="No-spelar-bar"
          value={tw.nowPlayingStyle}
          options={[
            {value:'bar',label:'Diskret botn-bar'},
            {value:'expanded',label:'Spinnande plate (full)'},
            {value:'side',label:'Sidepanel'},
          ]}
          onChange={(v) => setTweak('nowPlayingStyle', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CrateCanvas />);
