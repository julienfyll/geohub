"use client";

import React, { useState, useMemo } from "react";
import { FlagColorSlice } from "@/lib/games/flagpie/types";
import { PieChart as PieIcon, Sparkles } from "lucide-react";

interface FlagPieChartProps {
  slices: FlagColorSlice[];
  hidePercentages?: boolean;
}

export const FlagPieChart: React.FC<FlagPieChartProps> = ({
  slices,
  hidePercentages = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cx = 160;
  const cy = 160;
  const radius = 135;
  const innerRadius = 55;

  // Normalize percentages so they sum to exactly 100
  const normalizedSlices = useMemo(() => {
    const rawTotal = slices.reduce((acc, s) => acc + s.percentage, 0);
    if (rawTotal <= 0) {
      return slices.map((s) => ({
        ...s,
        normalizedPercentage: s.percentage,
      }));
    }
    return slices.map((s) => ({
      ...s,
      normalizedPercentage: (s.percentage / rawTotal) * 100,
    }));
  }, [slices]);

  // Compute SVG arc path for each slice
  const renderedSlices = useMemo(() => {
    let currentPct = 0;

    return normalizedSlices.map((slice, index) => {
      const startPct = currentPct;
      const endPct = currentPct + slice.normalizedPercentage;
      currentPct = endPct;

      const isSingleSlice = slice.normalizedPercentage >= 99.9;

      let d = "";
      if (isSingleSlice) {
        d = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy} Z`;
      } else {
        const a1 = (startPct / 100.0) * 2 * mathPi - mathPi / 2;
        const a2 = (endPct / 100.0) * 2 * mathPi - mathPi / 2;

        const x1 = cx + radius * Math.cos(a1);
        const y1 = cy + radius * Math.sin(a1);
        const x2 = cx + radius * Math.cos(a2);
        const y2 = cy + radius * Math.sin(a2);

        const largeArc = slice.normalizedPercentage > 50 ? 1 : 0;
        d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
      }

      return {
        ...slice,
        index,
        path: d,
        displayPct: Math.round(slice.percentage * 10) / 10,
      };
    });
  }, [normalizedSlices]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      {/* SVG Canvas Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 drop-shadow-2xl">
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full transform transition-transform duration-300 hover:scale-[1.02]"
        >
          {/* Subtle Outer Halo Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 4}
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="2"
          />

          {/* Slices */}
          {renderedSlices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <path
                key={slice.index}
                d={slice.path}
                fill={slice.hex}
                stroke="#090d16"
                strokeWidth={isHovered ? 4 : 2.5}
                strokeLinejoin="round"
                className="transition-all duration-200 cursor-pointer"
                style={{
                  filter: isHovered
                    ? "brightness(1.15) drop-shadow(0 0 10px rgba(255,255,255,0.4))"
                    : undefined,
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: isHovered ? "scale(1.03)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {/* Donut Center Cutout (Modern Aesthetic) */}
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius}
            fill="#090d16"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="2"
          />
        </svg>

        {/* Center Cutout Info / Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          {hoveredIndex !== null && renderedSlices[hoveredIndex] ? (
            <div className="text-center animate-fade-in">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300 block">
                {renderedSlices[hoveredIndex].color}
              </span>
              {!hidePercentages && (
                <span className="text-lg font-black font-mono text-white leading-none">
                  {renderedSlices[hoveredIndex].displayPct}%
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-80">
              <PieIcon className="w-5 h-5 text-violet-400 mb-0.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                {slices.length} {slices.length > 1 ? "couleurs" : "couleur"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Color Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-5 w-full px-2">
        {renderedSlices.map((slice) => {
          const isHovered = hoveredIndex === slice.index;
          return (
            <button
              key={slice.index}
              type="button"
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isHovered
                  ? "bg-violet-600/25 border-violet-500/60 text-white shadow-md shadow-violet-500/20 scale-105"
                  : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              {/* Color Pastille with Border for White/Yellow */}
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner shrink-0"
                style={{ backgroundColor: slice.hex }}
              />
              <span className="font-bold">{slice.color}</span>
              {!hidePercentages && (
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {slice.displayPct}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const mathPi = Math.PI;
