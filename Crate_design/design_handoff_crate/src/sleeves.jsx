// Procedural SVG sleeve generator. Each album has a sleeveStyle + palette.
// Produces a clearly-stylized "placeholder" sleeve (not real art).

const Sleeve = ({ album, size = 240 }) => {
  const [bg, ink, accent] = album.palette;
  const s = size;
  const style = album.sleeveStyle || "type";
  // Stable hash from artist+title for seeded variations
  let h = 0;
  for (const ch of (album.artist + album.title)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = (n) => ((h = (h * 1664525 + 1013904223) >>> 0) % n);

  const titleFont = "Cormorant Garamond, 'Times New Roman', serif";
  const monoFont = "'JetBrains Mono', 'Courier New', monospace";

  const renderBody = () => {
    switch (style) {
      case "type": {
        // Big serif title centered, artist small in upper-left
        const lines = album.title.split(" ");
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            <text x={s * 0.08} y={s * 0.13} fill={ink} opacity={0.7}
              fontFamily={monoFont} fontSize={s * 0.038} letterSpacing={s * 0.004}
              style={{ textTransform: 'uppercase' }}>
              {album.artist.toUpperCase()}
            </text>
            <text x={s * 0.5} y={s * 0.58} fill={ink} textAnchor="middle"
              fontFamily={titleFont} fontSize={s * 0.16} fontStyle="italic"
              fontWeight="400">
              {album.title}
            </text>
            <line x1={s * 0.3} y1={s * 0.68} x2={s * 0.7} y2={s * 0.68} stroke={accent} strokeWidth={s * 0.004} />
            <text x={s * 0.5} y={s * 0.78} fill={accent} textAnchor="middle"
              fontFamily={monoFont} fontSize={s * 0.032} letterSpacing={s * 0.01}>
              {album.year}
            </text>
          </g>
        );
      }
      case "circle": {
        // Off-center large circle with thin ring around
        const cx = s * (0.35 + rand(20) / 100);
        const cy = s * (0.4 + rand(20) / 100);
        const r = s * 0.32;
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            <circle cx={cx} cy={cy} r={r} fill={accent} opacity={0.85} />
            <circle cx={cx} cy={cy} r={r + s * 0.04} fill="none" stroke={ink} strokeWidth={s * 0.003} opacity={0.6} />
            <circle cx={cx} cy={cy} r={s * 0.04} fill={bg} />
            <text x={s * 0.08} y={s * 0.9} fill={ink}
              fontFamily={titleFont} fontSize={s * 0.085} fontWeight="500">
              {album.title}
            </text>
            <text x={s * 0.08} y={s * 0.95} fill={ink} opacity={0.6}
              fontFamily={monoFont} fontSize={s * 0.03} letterSpacing={s * 0.004}>
              {album.artist.toUpperCase()}
            </text>
          </g>
        );
      }
      case "split": {
        // Diagonal color block split
        const angle = 20 + rand(40);
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            <polygon points={`0,0 ${s},0 ${s},${s * 0.6} 0,${s * 0.9}`} fill={accent} opacity={0.8} />
            <text x={s * 0.08} y={s * 0.18} fill={bg}
              fontFamily={monoFont} fontSize={s * 0.032} opacity={0.85}
              letterSpacing={s * 0.005}>
              {album.artist.toUpperCase()}
            </text>
            <text x={s * 0.08} y={s * 0.94} fill={ink}
              fontFamily={titleFont} fontSize={s * 0.105} fontWeight="500">
              {album.title}
            </text>
          </g>
        );
      }
      case "burst": {
        // Radial burst lines (vintage soul/psych feel)
        const cx = s * 0.5, cy = s * 0.42;
        const lines = [];
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const r1 = s * 0.1;
          const r2 = s * (0.32 + (i % 3) * 0.04);
          lines.push(
            <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
              stroke={accent} strokeWidth={s * 0.006} opacity={0.7} />
          );
        }
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            {lines}
            <circle cx={cx} cy={cy} r={s * 0.08} fill={accent} />
            <text x={s * 0.5} y={s * 0.78} fill={ink} textAnchor="middle"
              fontFamily={titleFont} fontSize={s * 0.085} fontWeight="500">
              {album.title}
            </text>
            <text x={s * 0.5} y={s * 0.88} fill={ink} textAnchor="middle" opacity={0.7}
              fontFamily={monoFont} fontSize={s * 0.028} letterSpacing={s * 0.005}>
              {album.artist.toUpperCase()}
            </text>
          </g>
        );
      }
      case "grid": {
        // Tight grid of squares with one accent cell
        const cells = 8;
        const cellSize = s / cells;
        const accentCell = [rand(cells), rand(cells)];
        const blocks = [];
        for (let y = 0; y < cells; y++) {
          for (let x = 0; x < cells; x++) {
            const isAccent = x === accentCell[0] && y === accentCell[1];
            const op = (x + y * 3) % 7 < 3 ? 0.12 : 0;
            blocks.push(
              <rect key={`${x}-${y}`}
                x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize}
                fill={isAccent ? accent : ink} opacity={isAccent ? 0.9 : op} />
            );
          }
        }
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            {blocks}
            <rect x={s * 0.06} y={s * 0.76} width={s * 0.88} height={s * 0.18} fill={bg} opacity={0.85} />
            <text x={s * 0.08} y={s * 0.85} fill={ink}
              fontFamily={titleFont} fontSize={s * 0.075} fontWeight="500">
              {album.title}
            </text>
            <text x={s * 0.08} y={s * 0.91} fill={ink} opacity={0.65}
              fontFamily={monoFont} fontSize={s * 0.028} letterSpacing={s * 0.005}>
              {album.artist.toUpperCase()}
            </text>
          </g>
        );
      }
      case "geometric": {
        // Triangle + circle composition
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            <polygon points={`${s * 0.5},${s * 0.18} ${s * 0.85},${s * 0.6} ${s * 0.15},${s * 0.6}`}
              fill="none" stroke={accent} strokeWidth={s * 0.008} />
            <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.13} fill={accent} opacity={0.9} />
            <line x1={0} y1={s * 0.7} x2={s} y2={s * 0.7} stroke={ink} strokeWidth={s * 0.003} opacity={0.4} />
            <text x={s * 0.5} y={s * 0.82} fill={ink} textAnchor="middle"
              fontFamily={titleFont} fontSize={s * 0.085} fontWeight="500">
              {album.title}
            </text>
            <text x={s * 0.5} y={s * 0.92} fill={ink} textAnchor="middle" opacity={0.65}
              fontFamily={monoFont} fontSize={s * 0.028} letterSpacing={s * 0.005}>
              {album.artist.toUpperCase()}
            </text>
          </g>
        );
      }
      case "frame":
      default: {
        // Inset frame with title inside, label-style
        return (
          <g>
            <rect width={s} height={s} fill={bg} />
            <rect x={s * 0.08} y={s * 0.08} width={s * 0.84} height={s * 0.84}
              fill="none" stroke={ink} strokeWidth={s * 0.003} opacity={0.45} />
            <rect x={s * 0.12} y={s * 0.12} width={s * 0.76} height={s * 0.06}
              fill={accent} opacity={0.85} />
            <text x={s * 0.5} y={s * 0.165} fill={bg} textAnchor="middle"
              fontFamily={monoFont} fontSize={s * 0.025} letterSpacing={s * 0.008}>
              {album.labels[0]?.toUpperCase() || "LP"}
            </text>
            <text x={s * 0.5} y={s * 0.5} fill={ink} textAnchor="middle"
              fontFamily={titleFont} fontSize={s * 0.115} fontWeight="500"
              fontStyle="italic">
              {album.title}
            </text>
            <line x1={s * 0.35} y1={s * 0.6} x2={s * 0.65} y2={s * 0.6}
              stroke={ink} strokeWidth={s * 0.003} opacity={0.4} />
            <text x={s * 0.5} y={s * 0.7} fill={ink} textAnchor="middle" opacity={0.75}
              fontFamily={monoFont} fontSize={s * 0.03} letterSpacing={s * 0.008}>
              {album.artist.toUpperCase()}
            </text>
            <text x={s * 0.5} y={s * 0.84} fill={ink} textAnchor="middle" opacity={0.55}
              fontFamily={monoFont} fontSize={s * 0.025} letterSpacing={s * 0.01}>
              {album.year}
            </text>
          </g>
        );
      }
    }
  };

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {renderBody()}
      {/* subtle vignette */}
      <defs>
        <radialGradient id={`vg-${album.id}`} cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <rect width={s} height={s} fill={`url(#vg-${album.id})`} pointerEvents="none" />
    </svg>
  );
};

window.Sleeve = Sleeve;
