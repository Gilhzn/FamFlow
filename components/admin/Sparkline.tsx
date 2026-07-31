"use client";

/** Tiny axis-free sparkline — 2px non-scaling stroke + soft area fill. */
export default function Sparkline({
  data,
  color,
  className = "h-9 w-full",
}: {
  data: number[];
  color: string;
  className?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 96 - (v / max) * 88; // 4px padding top & bottom in viewBox units
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polygon points={`0,100 ${line} 100,100`} fill={color} opacity={0.08} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />
    </svg>
  );
}
