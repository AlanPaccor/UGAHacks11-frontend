/**
 * SVG store layout based on the retail floor plan.
 * Zones are rendered as labeled rectangles. Products are overlaid
 * on top of this by the StoreCanvas parent.
 *
 * Coordinate system: 0-1000 x 0-700 viewBox (matches aspect ratio of floor plan).
 */

interface Props {
  className?: string;
}

export default function StoreLayout({ className }: Props) {
  return (
    <svg
      viewBox="0 0 1000 700"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="1000" height="700" fill="#f8fafc" rx="8" />

      {/* ─── Outer Walls ─── */}
      <rect
        x="20"
        y="20"
        width="960"
        height="660"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="3"
        rx="4"
      />

      {/* ═══════════ RETAIL FLOOR (main area, left 60%) ═══════════ */}
      <rect
        x="25"
        y="25"
        width="560"
        height="650"
        fill="#f1f5f9"
        rx="2"
      />
      <text
        x="305"
        y="52"
        textAnchor="middle"
        className="fill-slate-400"
        fontSize="13"
        fontWeight="600"
        letterSpacing="2"
      >
        RETAIL FLOOR
      </text>

      {/* Display tables (represented as rounded rects) */}
      {[
        { x: 80, y: 120, w: 80, h: 50 },
        { x: 200, y: 120, w: 80, h: 50 },
        { x: 80, y: 220, w: 80, h: 50 },
        { x: 200, y: 220, w: 80, h: 50 },
        { x: 350, y: 120, w: 80, h: 50 },
        { x: 350, y: 220, w: 80, h: 50 },
        { x: 80, y: 340, w: 80, h: 50 },
        { x: 200, y: 340, w: 80, h: 50 },
        { x: 350, y: 340, w: 80, h: 50 },
        { x: 80, y: 460, w: 80, h: 50 },
        { x: 200, y: 460, w: 80, h: 50 },
        { x: 350, y: 460, w: 80, h: 50 },
        { x: 470, y: 120, w: 60, h: 50 },
        { x: 470, y: 220, w: 60, h: 50 },
      ].map((t, i) => (
        <rect
          key={`table-${i}`}
          x={t.x}
          y={t.y}
          width={t.w}
          height={t.h}
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1"
          rx="6"
        />
      ))}

      {/* Circular display fixtures */}
      {[
        { cx: 160, cy: 580 },
        { cx: 300, cy: 580 },
        { cx: 440, cy: 580 },
      ].map((c, i) => (
        <circle
          key={`circ-${i}`}
          cx={c.cx}
          cy={c.cy}
          r="35"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
      ))}

      {/* ═══════════ DRESSING ROOMS (top center) ═══════════ */}
      <rect
        x="595"
        y="25"
        width="160"
        height="160"
        fill="#fef3c7"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="675"
        y="75"
        textAnchor="middle"
        className="fill-amber-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        DRESSING
      </text>
      <text
        x="675"
        y="90"
        textAnchor="middle"
        className="fill-amber-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        ROOMS
      </text>
      {/* Dressing room stalls */}
      {[0, 1, 2].map((i) => (
        <rect
          key={`stall-${i}`}
          x={610 + i * 45}
          y={100}
          width={35}
          height={70}
          fill="#fde68a"
          stroke="#d97706"
          strokeWidth="0.5"
          rx="3"
        />
      ))}

      {/* ═══════════ ACCESSORIES / PRESSING (top right) ═══════════ */}
      <rect
        x="765"
        y="25"
        width="210"
        height="160"
        fill="#ede9fe"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="870"
        y="75"
        textAnchor="middle"
        className="fill-violet-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        ACCESSORIES
      </text>
      <text
        x="870"
        y="90"
        textAnchor="middle"
        className="fill-violet-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        DISPLAY
      </text>

      {/* ═══════════ STORAGE / BACK ROOM (right side) ═══════════ */}
      <rect
        x="765"
        y="195"
        width="210"
        height="220"
        fill="#dbeafe"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="870"
        y="245"
        textAnchor="middle"
        className="fill-blue-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        BACK STORAGE
      </text>
      {/* Shelving racks */}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={`rack-${i}`}
          x={785}
          y={270 + i * 30}
          width={170}
          height={18}
          fill="#bfdbfe"
          stroke="#93c5fd"
          strokeWidth="0.5"
          rx="2"
        />
      ))}

      {/* ═══════════ BREAK ROOM (center right) ═══════════ */}
      <rect
        x="595"
        y="195"
        width="160"
        height="150"
        fill="#dcfce7"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="675"
        y="240"
        textAnchor="middle"
        className="fill-emerald-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        BREAK ROOM
      </text>
      {/* Break room table */}
      <rect
        x="630"
        y="260"
        width="90"
        height="50"
        fill="#bbf7d0"
        stroke="#86efac"
        strokeWidth="0.5"
        rx="6"
      />

      {/* ═══════════ RESTROOM (bottom right) ═══════════ */}
      <rect
        x="765"
        y="425"
        width="210"
        height="120"
        fill="#fce7f3"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="870"
        y="485"
        textAnchor="middle"
        className="fill-pink-600"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        RESTROOM
      </text>

      {/* ═══════════ SUPPLY CLOSET (center bottom) ═══════════ */}
      <rect
        x="595"
        y="355"
        width="160"
        height="120"
        fill="#f5f5f4"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="675"
        y="415"
        textAnchor="middle"
        className="fill-stone-500"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        SUPPLY
      </text>

      {/* ═══════════ CHECKOUT COUNTER (bottom left) ═══════════ */}
      <rect
        x="595"
        y="490"
        width="160"
        height="80"
        fill="#fef9c3"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="675"
        y="535"
        textAnchor="middle"
        className="fill-yellow-700"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        CHECKOUT
      </text>
      {/* Register */}
      <rect
        x="630"
        y="540"
        width="90"
        height="18"
        fill="#fde047"
        stroke="#eab308"
        strokeWidth="0.5"
        rx="3"
      />

      {/* ═══════════ ENTRANCE ═══════════ */}
      <rect
        x="25"
        y="645"
        width="120"
        height="30"
        fill="#e0f2fe"
        stroke="#0284c7"
        strokeWidth="1.5"
        rx="4"
      />
      <text
        x="85"
        y="665"
        textAnchor="middle"
        className="fill-sky-700"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1"
      >
        ENTRANCE
      </text>

      {/* Emergency Exit */}
      <rect
        x="595"
        y="580"
        width="160"
        height="95"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        rx="2"
      />
      <text
        x="675"
        y="635"
        textAnchor="middle"
        className="fill-red-500"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1"
      >
        EMERGENCY EXIT
      </text>

      {/* Grid lines (subtle) */}
      {[200, 400, 600, 800].map((x) => (
        <line
          key={`gx-${x}`}
          x1={x}
          y1="25"
          x2={x}
          y2="675"
          stroke="#e2e8f0"
          strokeWidth="0.5"
          strokeDasharray="4,6"
        />
      ))}
      {[175, 350, 525].map((y) => (
        <line
          key={`gy-${y}`}
          x1="25"
          y1={y}
          x2="975"
          y2={y}
          stroke="#e2e8f0"
          strokeWidth="0.5"
          strokeDasharray="4,6"
        />
      ))}
    </svg>
  );
}
