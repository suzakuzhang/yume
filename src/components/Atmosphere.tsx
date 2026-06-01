/**
 * The fixed dream-atmosphere layer behind all content.
 * Layers (back → front): night gradient · nebula glows (moon + faint gold) ·
 * two drifting star fields at different depths · ink grain.
 * Pure CSS; respects prefers-reduced-motion via globals.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

function starLayer(size: number, color: string, dur: number, delay = 0): React.CSSProperties {
  return {
    position: "absolute",
    inset: "-10%",
    backgroundImage: `radial-gradient(1px 1px at 50% 50%, ${color}, transparent)`,
    backgroundSize: `${size}px ${size}px`,
    animation: `yume-drift ${dur}s linear ${delay}s infinite alternate, yume-twinkle ${dur / 6}s ease-in-out ${delay}s infinite`,
  };
}

export function Atmosphere() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base depth gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, #1a1730 0%, #12101d 38%, #0b0a12 78%)",
        }}
      />
      {/* moon glow, upper area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 30% at 72% 14%, rgba(179,166,239,0.16), transparent 60%)",
        }}
      />
      {/* faint divinatory gold, lower */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 20% 110%, rgba(201,174,116,0.08), transparent 55%)",
        }}
      />
      {/* drifting star fields — two depths */}
      <div style={{ ...starLayer(168, "rgba(217,211,236,0.85)", 90), opacity: 0.5 }} />
      <div style={{ ...starLayer(233, "rgba(179,166,239,0.7)", 140, 4), opacity: 0.4 }} />
      <div style={{ ...starLayer(311, "rgba(201,174,116,0.6)", 200, 8), opacity: 0.3 }} />
      {/* ink grain */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, opacity: 0.04, mixBlendMode: "overlay" }}
      />
      {/* soft vignette to sink the edges */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 60px rgba(7,6,12,0.9)" }}
      />
    </div>
  );
}
