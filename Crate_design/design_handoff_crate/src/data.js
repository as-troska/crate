// Fake but plausible vinyl collection. All artists/titles invented for this mock.
// Sides + tracks with positions like A1, A2, B1...

const COLLECTION = [
  {
    id: 1, artist: "Marta Lien Kvartett", title: "Norddrag", year: 1974,
    country: "Norge", format: "LP, 180g", labels: ["Sølv & Sand"],
    genres: ["Jazz"], styles: ["Modal", "Post-Bop"], rating: 4.6, ratingCount: 211,
    notes: "Marta Liens andre LP under eige namn. Innspelt på Henie Onstad Kunstsenter, vinteren 1973.",
    palette: ["#1a1f24", "#d4cfc1", "#7a5a3a"], sleeveStyle: "frame",
    tracks: [
      { pos: "A1", title: "Norddrag", dur: "7:42" },
      { pos: "A2", title: "Stille før storm", dur: "5:18" },
      { pos: "A3", title: "Fjordlys", dur: "6:55" },
      { pos: "B1", title: "Vinter i Trøndelag", dur: "9:21" },
      { pos: "B2", title: "Heimreise", dur: "8:04" },
    ],
  },
  {
    id: 2, artist: "Caleb Voss", title: "Slow Furnace", year: 1981,
    country: "USA", format: "LP", labels: ["Brick Sound"],
    genres: ["Rock", "Folk"], styles: ["Singer/Songwriter"], rating: 4.2, ratingCount: 583,
    notes: "Sjølvprodusert i ein konvertert smie i Massachusetts.",
    palette: ["#2b1f17", "#e6dccc", "#b35d3a"], sleeveStyle: "type",
    tracks: [
      { pos: "A1", title: "Slow Furnace", dur: "4:12" },
      { pos: "A2", title: "Tin Roof Sermon", dur: "3:48" },
      { pos: "A3", title: "Sister, Won't You Wait", dur: "5:02" },
      { pos: "A4", title: "Edgewater", dur: "3:34" },
      { pos: "B1", title: "Daughter of the Loom", dur: "4:45" },
      { pos: "B2", title: "Quiet Drag", dur: "3:21" },
      { pos: "B3", title: "Hold the Line", dur: "4:58" },
      { pos: "B4", title: "Last Light Over Lowell", dur: "6:12" },
    ],
  },
  {
    id: 3, artist: "Solveig Aas", title: "Innover", year: 2018,
    country: "Norge", format: "LP, 45 RPM", labels: ["Hubro"],
    genres: ["Electronic", "Folk"], styles: ["Ambient", "Modern Classical"], rating: 4.8, ratingCount: 92,
    notes: "Felt-opptak frå Hardangervidda mikset med modulær synth.",
    palette: ["#0e1418", "#c8d4d8", "#5f8a9f"], sleeveStyle: "circle",
    tracks: [
      { pos: "A1", title: "Innover I", dur: "8:14" },
      { pos: "A2", title: "Innover II", dur: "6:30" },
      { pos: "B1", title: "Snøtak", dur: "11:02" },
      { pos: "B2", title: "Heim, sakte", dur: "7:48" },
    ],
  },
  {
    id: 4, artist: "The Hour Glass Band", title: "Midnight Switchboard", year: 1969,
    country: "UK", format: "LP, Mono", labels: ["Pylon"],
    genres: ["Rock", "Psych"], styles: ["Psychedelic Rock", "Garage"], rating: 3.9, ratingCount: 1432,
    notes: "Ein av tre LP-ar bandet rakk å gje ut før dei vart oppløyst i 1971.",
    palette: ["#1b1118", "#e9b56a", "#a3322a"], sleeveStyle: "burst",
    tracks: [
      { pos: "A1", title: "Switchboard Operator", dur: "2:58" },
      { pos: "A2", title: "Bessie's Coat", dur: "3:14" },
      { pos: "A3", title: "Long Way Down", dur: "4:22" },
      { pos: "A4", title: "Two Pound Note", dur: "2:41" },
      { pos: "B1", title: "Mary, Mary, Mary", dur: "3:08" },
      { pos: "B2", title: "Telephone Box Blues", dur: "5:33" },
      { pos: "B3", title: "Last Call", dur: "3:52" },
    ],
  },
  {
    id: 5, artist: "Akiko Mori Trio", title: "Blue Hour Studies", year: 1977,
    country: "Japan", format: "LP", labels: ["East Wind"],
    genres: ["Jazz"], styles: ["Piano Trio", "Cool Jazz"], rating: 4.7, ratingCount: 318,
    notes: "Direct-to-disc-innspeling. Kun 1500 eksemplar i originalopplaget.",
    palette: ["#10141a", "#d2d7df", "#7a96b8"], sleeveStyle: "split",
    tracks: [
      { pos: "A1", title: "Blue Hour", dur: "6:08" },
      { pos: "A2", title: "Study No. 3", dur: "5:42" },
      { pos: "A3", title: "Window Seat", dur: "4:55" },
      { pos: "B1", title: "Tokyo, 4 AM", dur: "8:18" },
      { pos: "B2", title: "Going Home", dur: "5:36" },
    ],
  },
  {
    id: 6, artist: "Halden / Berge", title: "Andre Etasje", year: 2003,
    country: "Norge", format: "2×LP", labels: ["Rune Grammofon"],
    genres: ["Electronic"], styles: ["Microhouse", "Glitch"], rating: 4.1, ratingCount: 76,
    notes: "Innspelt i ein nedlagd skofabrikk i Halden.",
    palette: ["#0a0c10", "#a0a8b3", "#cf4d4d"], sleeveStyle: "grid",
    tracks: [
      { pos: "A1", title: "Trapp 1", dur: "6:42" },
      { pos: "A2", title: "Trapp 2", dur: "5:55" },
      { pos: "B1", title: "Gang", dur: "9:18" },
      { pos: "B2", title: "Dør", dur: "7:30" },
      { pos: "C1", title: "Vindauge", dur: "8:48" },
      { pos: "C2", title: "Stillheit", dur: "6:14" },
      { pos: "D1", title: "Ned att", dur: "11:52" },
    ],
  },
  {
    id: 7, artist: "Yael Roth", title: "Lantern Songs", year: 1992,
    country: "Israel", format: "LP", labels: ["Sage Records"],
    genres: ["Folk"], styles: ["Acoustic", "World"], rating: 4.4, ratingCount: 154,
    notes: "Innspelt med ein einaste mikrofon i ein gamal kalksteinsbygning utanfor Jerusalem.",
    palette: ["#1f1812", "#e8d8b5", "#a87842"], sleeveStyle: "type",
    tracks: [
      { pos: "A1", title: "Lantern I", dur: "4:22" },
      { pos: "A2", title: "Olive & Salt", dur: "3:55" },
      { pos: "A3", title: "She Sang to the Door", dur: "5:18" },
      { pos: "A4", title: "Lantern II", dur: "4:48" },
      { pos: "B1", title: "Stone, Stone, Bread", dur: "3:30" },
      { pos: "B2", title: "The Long Garden", dur: "6:42" },
      { pos: "B3", title: "Lantern III", dur: "5:08" },
    ],
  },
  {
    id: 8, artist: "Doctor Element", title: "Periodic", year: 1986,
    country: "Tyskland", format: "LP", labels: ["Kontrast"],
    genres: ["Electronic"], styles: ["Synth-pop", "Kosmische"], rating: 3.8, ratingCount: 421,
    notes: "Cover av Karl-Heinz Auerbach.",
    palette: ["#0c0e1a", "#bdc7e8", "#e84d8a"], sleeveStyle: "geometric",
    tracks: [
      { pos: "A1", title: "Hydrogen Heart", dur: "4:18" },
      { pos: "A2", title: "Noble Gas", dur: "3:48" },
      { pos: "A3", title: "Iron, Iron", dur: "5:22" },
      { pos: "A4", title: "Mercury Falls", dur: "4:12" },
      { pos: "B1", title: "Gold (Reprise)", dur: "3:55" },
      { pos: "B2", title: "The Lanthanide Suite", dur: "8:34" },
      { pos: "B3", title: "Lead", dur: "4:45" },
    ],
  },
  {
    id: 9, artist: "Eunice Park & the Continentals", title: "Highway Hi-Fi", year: 1965,
    country: "USA", format: "LP", labels: ["Atlantic Heights"],
    genres: ["Soul", "Pop"], styles: ["Northern Soul", "Vocal"], rating: 4.5, ratingCount: 892,
    notes: "Hennar tredje LP, og siste før ho gjekk over til solo-karriere på Stax.",
    palette: ["#1a0e0e", "#f0d9b0", "#c63e2e"], sleeveStyle: "burst",
    tracks: [
      { pos: "A1", title: "Highway Hi-Fi", dur: "2:48" },
      { pos: "A2", title: "Cruise Control Heart", dur: "3:12" },
      { pos: "A3", title: "Don't Pull Over", dur: "2:35" },
      { pos: "A4", title: "Radio Eunice", dur: "3:55" },
      { pos: "A5", title: "Sunset Mile", dur: "2:42" },
      { pos: "B1", title: "Telephone Pole Romance", dur: "3:18" },
      { pos: "B2", title: "Eastbound", dur: "2:55" },
      { pos: "B3", title: "Diner Booth Goodbye", dur: "3:42" },
      { pos: "B4", title: "Home, Or Close", dur: "4:08" },
    ],
  },
  {
    id: 10, artist: "Tobias Brandt", title: "Streichquartette Nr. 1–3", year: 1979,
    country: "Østerrike", format: "LP", labels: ["Wien Modern"],
    genres: ["Klassisk"], styles: ["Modern Classical", "Chamber"], rating: 4.6, ratingCount: 47,
    notes: "Skrive 1973–77. Framført av Mauer-Quartett.",
    palette: ["#13141a", "#dad6cc", "#8a7a55"], sleeveStyle: "frame",
    tracks: [
      { pos: "A1", title: "Streichquartett Nr. 1 — I. Adagio", dur: "8:42" },
      { pos: "A2", title: "Streichquartett Nr. 1 — II. Allegro", dur: "6:18" },
      { pos: "B1", title: "Streichquartett Nr. 2", dur: "14:33" },
      { pos: "B2", title: "Streichquartett Nr. 3 — Andante con moto", dur: "11:08" },
    ],
  },
  {
    id: 11, artist: "Sonia Aldine", title: "Glass Telephone", year: 1989,
    country: "Frankrike", format: "LP", labels: ["Pavé"],
    genres: ["Pop", "Electronic"], styles: ["Synth-pop", "Chanson"], rating: 4.0, ratingCount: 312,
    notes: "Produsert av Étienne Cassel.",
    palette: ["#0d1218", "#e8cfd5", "#7a5fb5"], sleeveStyle: "split",
    tracks: [
      { pos: "A1", title: "Glass Telephone", dur: "3:48" },
      { pos: "A2", title: "Ne réponds pas", dur: "4:22" },
      { pos: "A3", title: "Static Lover", dur: "3:55" },
      { pos: "A4", title: "Aluminium", dur: "5:08" },
      { pos: "B1", title: "Operator", dur: "4:18" },
      { pos: "B2", title: "Pavillon 12", dur: "3:42" },
      { pos: "B3", title: "Hang Up Slow", dur: "6:12" },
    ],
  },
  {
    id: 12, artist: "Earl Cunningham Quintet", title: "Riverbed Sessions", year: 1962,
    country: "USA", format: "LP, Mono", labels: ["Blue Note"],
    genres: ["Jazz"], styles: ["Hard Bop"], rating: 4.7, ratingCount: 1245,
    notes: "Cunninghams einaste innspeling som leiar.",
    palette: ["#1a1108", "#e8c878", "#a64528"], sleeveStyle: "type",
    tracks: [
      { pos: "A1", title: "Riverbed", dur: "8:42" },
      { pos: "A2", title: "Blues for Eulalie", dur: "6:55" },
      { pos: "A3", title: "Switchback", dur: "5:18" },
      { pos: "B1", title: "Sunday Morning Coming Up", dur: "9:32" },
      { pos: "B2", title: "Goodbye Earl", dur: "7:48" },
    ],
  },
  {
    id: 13, artist: "Heron Architects", title: "Plan, Section, Elevation", year: 2011,
    country: "UK", format: "2×LP", labels: ["Plinth"],
    genres: ["Electronic", "Rock"], styles: ["Post-Rock", "Krautrock"], rating: 4.3, ratingCount: 198,
    notes: "Konseptalbum om bygnaden Barbican Centre.",
    palette: ["#0d0e12", "#c8c4ba", "#d97b3a"], sleeveStyle: "grid",
    tracks: [
      { pos: "A1", title: "Plan", dur: "9:12" },
      { pos: "A2", title: "Lakeside Terrace", dur: "7:48" },
      { pos: "B1", title: "Section", dur: "11:32" },
      { pos: "B2", title: "Conservatory", dur: "6:42" },
      { pos: "C1", title: "Elevation", dur: "13:18" },
      { pos: "D1", title: "Cromwell Tower", dur: "8:55" },
      { pos: "D2", title: "Coda, Brutalist", dur: "5:30" },
    ],
  },
  {
    id: 14, artist: "Vesa Korhonen", title: "Hiljaisuus", year: 1997,
    country: "Finland", format: "LP", labels: ["Aurinkokello"],
    genres: ["Electronic", "Folk"], styles: ["Ambient", "Drone"], rating: 4.5, ratingCount: 89,
    notes: "Innspelt nord for polarsirkelen, januar 1996.",
    palette: ["#0a0e12", "#e0e3e0", "#5a7a6e"], sleeveStyle: "circle",
    tracks: [
      { pos: "A1", title: "Hiljaisuus I", dur: "12:48" },
      { pos: "A2", title: "Hiljaisuus II", dur: "8:18" },
      { pos: "B1", title: "Lumi", dur: "14:32" },
      { pos: "B2", title: "Aamu", dur: "6:55" },
    ],
  },
  {
    id: 15, artist: "Maple & Avenue", title: "Suburban Mornings", year: 1973,
    country: "USA", format: "LP", labels: ["Reprise"],
    genres: ["Folk", "Rock"], styles: ["Soft Rock", "Country Rock"], rating: 4.1, ratingCount: 678,
    notes: "Sett av kritikarar som svaret på Crosby, Stills & Nash, sjølv om dei aldri spelte saman.",
    palette: ["#1a1308", "#f0d8a8", "#8a5530"], sleeveStyle: "type",
    tracks: [
      { pos: "A1", title: "Maple Street", dur: "3:42" },
      { pos: "A2", title: "Backyard Birthday", dur: "4:18" },
      { pos: "A3", title: "Coffee at Six", dur: "3:08" },
      { pos: "A4", title: "Storm Door", dur: "4:55" },
      { pos: "B1", title: "Avenue", dur: "5:22" },
      { pos: "B2", title: "Lawn Chair Anthem", dur: "3:48" },
      { pos: "B3", title: "Goodnight, Eleanor", dur: "4:32" },
    ],
  },
  {
    id: 16, artist: "Kosmische Werkstatt", title: "Werkstatt 2", year: 1976,
    country: "Tyskland", format: "LP", labels: ["Brain"],
    genres: ["Electronic"], styles: ["Kosmische", "Krautrock"], rating: 4.4, ratingCount: 234,
    notes: "Andre LP. Innspelt på fjorten dagar.",
    palette: ["#080a18", "#a8b8e0", "#e85a3a"], sleeveStyle: "geometric",
    tracks: [
      { pos: "A1", title: "Maschinen", dur: "9:48" },
      { pos: "A2", title: "Schaltbild", dur: "7:18" },
      { pos: "B1", title: "Werkstatt II", dur: "18:32" },
    ],
  },
  {
    id: 17, artist: "Lillian Asher", title: "Speak Plainly", year: 1958,
    country: "USA", format: "LP, Mono", labels: ["Verve"],
    genres: ["Jazz", "Pop"], styles: ["Vocal", "Swing"], rating: 4.6, ratingCount: 543,
    notes: "Med Earl Cunningham Quintet som backingband.",
    palette: ["#100a08", "#e8d8b8", "#a85c2a"], sleeveStyle: "frame",
    tracks: [
      { pos: "A1", title: "Speak Plainly", dur: "3:18" },
      { pos: "A2", title: "Don't Sing for Me", dur: "2:55" },
      { pos: "A3", title: "Park Bench Number", dur: "3:42" },
      { pos: "A4", title: "Two-Step Lullaby", dur: "2:48" },
      { pos: "A5", title: "Late, Late, Late", dur: "4:12" },
      { pos: "B1", title: "Old Hat", dur: "3:08" },
      { pos: "B2", title: "Asher Blues", dur: "5:18" },
      { pos: "B3", title: "Goodbye Without Saying", dur: "3:55" },
      { pos: "B4", title: "Sweet By and By", dur: "3:32" },
    ],
  },
  {
    id: 18, artist: "Per Olav Skar", title: "Sval Sommar", year: 2009,
    country: "Norge", format: "LP", labels: ["Sølv & Sand"],
    genres: ["Folk", "Jazz"], styles: ["Nordic Folk", "Acoustic"], rating: 4.3, ratingCount: 67,
    notes: "Hans fjerde solo-LP.",
    palette: ["#0e1418", "#d8d0c0", "#7a8f6a"], sleeveStyle: "type",
    tracks: [
      { pos: "A1", title: "Sval sommar", dur: "5:22" },
      { pos: "A2", title: "Tre dagar i juli", dur: "4:48" },
      { pos: "A3", title: "Trondheim, august", dur: "6:18" },
      { pos: "B1", title: "Heim att", dur: "7:42" },
      { pos: "B2", title: "September, langsamt", dur: "8:55" },
    ],
  },
];

// Add a few more for density
const _extra = [
  ["Tessa Yenn", "Quiet Hours", 1996, "Pop", "burst", ["#1a1018","#f0c8d0","#c84a7a"]],
  ["Black Pine String Band", "Headwaters", 1971, "Folk", "frame", ["#1a1208","#e0c895","#7a4520"]],
  ["Astra Mode", "Replica", 2007, "Electronic", "geometric", ["#0a0e1a","#c0c8e0","#4ac8e8"]],
  ["The Hour Glass Band", "Wax Cylinder", 1970, "Rock", "type", ["#1a0f15","#f0c878","#a8382e"]],
  ["Anika Drobek", "Northern Lights Studies", 2014, "Klassisk", "circle", ["#0a1018","#c8d0e0","#6a8aa8"]],
  ["Earl Cunningham Quintet", "After Hours", 1964, "Jazz", "split", ["#100c08","#e0c878","#9a4828"]],
  ["Solveig Aas", "Etter", 2022, "Electronic", "split", ["#0c1418","#d0d8d8","#7a9aa8"]],
  ["Marta Lien Kvartett", "Vest", 1978, "Jazz", "frame", ["#181a1f","#cfc8b8","#8a6a40"]],
  ["Halden / Berge", "Tredje Etasje", 2008, "Electronic", "grid", ["#0a0c10","#a8b0bc","#c84a4a"]],
  ["Caleb Voss", "Furnace Live", 1983, "Rock", "type", ["#2a1812","#e8d4b8","#b8553a"]],
  ["Yael Roth", "Lantern Two", 1998, "Folk", "circle", ["#1a1410","#e8d4a8","#a87838"]],
  ["Doctor Element", "Halogen", 1988, "Electronic", "geometric", ["#0a0c18","#c8d0e8","#e85a8a"]],
];
_extra.forEach((row, i) => {
  const [artist, title, year, genre, sleeveStyle, palette] = row;
  COLLECTION.push({
    id: 100 + i, artist, title, year,
    country: "Diverse", format: "LP",
    labels: ["Diverse"], genres: [genre], styles: [genre],
    rating: 3.5 + Math.random() * 1.3, ratingCount: 50 + Math.floor(Math.random() * 800),
    notes: "",
    palette, sleeveStyle,
    tracks: [
      { pos: "A1", title: "Side A, kutt 1", dur: "4:32" },
      { pos: "A2", title: "Side A, kutt 2", dur: "5:18" },
      { pos: "A3", title: "Side A, kutt 3", dur: "3:48" },
      { pos: "B1", title: "Side B, kutt 1", dur: "6:42" },
      { pos: "B2", title: "Side B, kutt 2", dur: "4:55" },
    ],
  });
});

window.CRATE_COLLECTION = COLLECTION;

// ─────────────────────────────────────────────────────────────────────────
// Enrich each release with realistic Discogs-style details (deterministic
// pseudo-random per album so the same record always looks the same).

const CATNO_PREFIXES = ["BLP", "SS", "ECM", "ZTT", "BR", "PYL", "EW", "RGM", "HBR", "NTR", "ATP", "VRG", "RM", "WK", "PV", "CTR"];
const ROLE_POOL = ["Producer", "Engineer", "Mixed By", "Remix", "Mastered By", "Arranged By", "Featuring"];
const GUEST_ARTISTS = ["Dobie", "Vibert", "Olav Halvorsen", "Aoife Carr", "Mark Cassidy", "Daniel Ek", "Yelena Stein", "Tomás Bélanger", "Imani Akrofi"];
const VIDEO_QUALIFIERS = ["Official Video", "Live at Café Mono", "Studio Session", "Live, 1979", "Lyric Video", "Single Edit"];

function seededRand(s) {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

COLLECTION.forEach((a) => {
  const rand = seededRand(a.artist + a.title);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const pickN = (arr, n) => {
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return out;
  };

  // ── Artists (with sort)
  a.artists = [{ name: a.artist }];
  a.artistsSort = a.artist.replace(/^The /i, '');

  // ── Labels with catalog numbers
  a.labelsDetailed = a.labels.map((name, i) => ({
    name,
    catno: `${pick(CATNO_PREFIXES)} ${String(1000 + Math.floor(rand() * 8999)).padStart(4, '0')}${i > 0 ? '-' + (i + 1) : ''}`,
  }));

  // ── Formats with descriptions
  const fmtParts = a.format.split(/,\s*/);
  const baseDesc = [
    fmtParts[0]?.includes('2') ? '2×12"' : '12"',
    a.year < 1968 ? 'Mono' : '33 ⅓ RPM',
    ...(fmtParts.slice(1)),
    'Album',
  ].filter(Boolean);
  a.formats = [{
    name: 'Vinyl',
    qty: fmtParts[0]?.startsWith('2') ? '2' : '1',
    descriptions: [...new Set(baseDesc.map(s => s.trim()))],
  }];

  // ── Community stats
  a.community = {
    have: Math.floor(rand() * 1800) + 80,
    want: Math.floor(rand() * 900) + 30,
    rating: { average: a.rating, count: a.ratingCount },
  };

  // ── Videos (0–3 entries)
  const nVids = Math.floor(rand() * 4);
  a.videos = pickN(a.tracks.slice(0, 6), nVids).map((t) => ({
    title: `${a.artist} — '${t.title}' (${pick(VIDEO_QUALIFIERS)})`,
    uri: `https://www.youtube.com/watch?v=${Math.random().toString(36).slice(2, 13)}`,
    duration: t.dur,
  }));

  // ── Identifiers
  a.identifiers = [
    { type: "Barcode", value: String(Math.floor(rand() * 1e12)).padStart(12, '0') },
    { type: "Label Code", value: `LC ${String(Math.floor(rand() * 99999)).padStart(5, '0')}` },
    ...(rand() > 0.5 ? [{ type: "Rights Society", value: ["BIEM", "ASCAP", "TONO", "GEMA", "MCPS"][Math.floor(rand() * 5)] }] : []),
  ];

  // ── Master / marketplace
  a.masterId = 10000 + Math.floor(rand() * 90000);
  a.numForSale = Math.floor(rand() * 24);
  a.lowestPrice = a.numForSale ? +(4 + rand() * 38).toFixed(2) : null;

  // ── Sprinkle extraartists onto a couple of tracks
  a.tracks = a.tracks.map((t, i) => {
    if (rand() < 0.18 && i > 0) {
      return { ...t, extraartists: [{ name: pick(GUEST_ARTISTS), role: pick(ROLE_POOL) }] };
    }
    return t;
  });

  // ── Image count (we render front/back/label procedurally; this is just metadata)
  a.imageCount = 1 + Math.floor(rand() * 3); // 1 primary + 0-2 secondary
  a.dateAdded = `202${Math.floor(rand() * 5)}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`;
});
