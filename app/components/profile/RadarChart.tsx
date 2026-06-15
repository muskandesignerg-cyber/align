import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { RadarSkill } from '../../types/candidateProfile';

interface RadarChartProps {
  data: RadarSkill[];
  size: number;
}

const NUM_AXES = 6;
const LEVELS = 3;

function getAngle(index: number): number {
  return (index * (2 * Math.PI)) / NUM_AXES - Math.PI / 2;
}

function getPoint(index: number, value: number, radius: number, cx: number, cy: number) {
  const angle = getAngle(index);
  const r = (value / 100) * radius;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function getOuterPoint(index: number, radius: number, cx: number, cy: number) {
  const angle = getAngle(index);
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function getLabelPoint(index: number, radius: number, cx: number, cy: number) {
  const angle = getAngle(index);
  const r = radius + 24;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function getLabelAnchor(index: number): 'middle' | 'start' | 'end' {
  if (index === 0 || index === 3) return 'middle';
  if (index === 1 || index === 2) return 'start';
  return 'end';
}

export default function RadarChart({ data, size }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44;

  // Grid hexagon points for each level
  const gridLevels = Array.from({ length: LEVELS }, (_, lvlIdx) => {
    const lvl = lvlIdx + 1;
    const r = (lvl / LEVELS) * radius;
    const pts = Array.from({ length: 6 }, (__, i) => {
      const angle = getAngle(i);
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    return pts;
  });

  // Candidate polygon
  const polyPoints = data
    .map((d, i) => {
      const pt = getPoint(i, d.value, radius, cx, cy);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Grid hexagons */}
        {gridLevels.map((pts, i) => (
          <Polygon key={`grid-${i}`} points={pts} fill="none" stroke="#E8EAFF" strokeWidth={1} />
        ))}

        {/* Axis lines */}
        {Array.from({ length: NUM_AXES }, (_, i) => {
          const outer = getOuterPoint(i, radius, cx, cy);
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#D0D7FF"
              strokeWidth={1}
            />
          );
        })}

        {/* Candidate polygon */}
        <Polygon
          points={polyPoints}
          fill="rgba(76,89,215,0.15)"
          stroke="#4C59D7"
          strokeWidth={2}
        />

        {/* Axis dot markers */}
        {Array.from({ length: NUM_AXES }, (_, i) => {
          const outer = getOuterPoint(i, radius, cx, cy);
          return <Circle key={`dot-${i}`} cx={outer.x} cy={outer.y} r={3} fill="#4C59D7" />;
        })}

        {/* Axis labels */}
        {data.map((d, i) => {
          const lp = getLabelPoint(i, radius, cx, cy);
          const anchor = getLabelAnchor(i);
          return (
            <SvgText
              key={`label-${i}`}
              x={lp.x}
              y={lp.y + 4}
              fontSize={11}
              fill="#6B7280"
              fontFamily="PlusJakartaSans_400Regular"
              textAnchor={anchor}
            >
              {d.axis}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
