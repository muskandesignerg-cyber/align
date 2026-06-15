/**
 * AppIcons — Custom vector-style icons drawn with React Native Views.
 * No emoji. Matches the TALENT.LOGIC color palette (#4C59D7, #849CFF, #D0D7FF).
 * All icons accept size and color props.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

// ─── Bell Icon ────────────────────────────────────────────────────────────────

export function BellIcon({ size = 24, color = '#1A1A2E', dot = false }: {
  size?: number; color?: string; dot?: boolean;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </Svg>
      {dot && (
        <View style={{
          position: 'absolute',
          top: 2,
          right: 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#EF4444',
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
        }} />
      )}
    </View>
  );
}

// ─── Heart Icon ──────────────────────────────────────────────────────────────

export function HeartIcon({ size = 24, color = '#1A1A2E' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </Svg>
    </View>
  );
}

// ─── Lightning Bolt Icon ──────────────────────────────────────────────────────

export function LightningIcon({ size = 20, color = '#4C59D7' }: {
  size?: number; color?: string;
}) {
  return (
    <View style={{ width: size * 0.65, height: size, alignItems: 'center' }}>
      {/* Top bar (angled right) */}
      <View style={{
        width: size * 0.55,
        height: size * 0.1,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '30deg' }],
        marginLeft: size * 0.1,
      }} />
      {/* Middle diagonal body */}
      <View style={{
        width: size * 0.08,
        height: size * 0.45,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '-15deg' }],
        marginTop: -size * 0.05,
        alignSelf: 'center',
      }} />
      {/* Bottom bar (angled right) */}
      <View style={{
        width: size * 0.55,
        height: size * 0.1,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '30deg' }],
        marginTop: -size * 0.05,
        marginRight: size * 0.1,
      }} />
    </View>
  );
}

// ─── Filter / Sliders Icon ────────────────────────────────────────────────────

export function FilterIcon({ size = 20, color = '#1A1A2E' }: {
  size?: number; color?: string;
}) {
  const barH = size * 0.08;
  const gap = size * 0.22;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', gap: gap }}>
      {/* Top bar - full width with left knob */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.1 }}>
        <View style={{ width: size * 0.28, height: barH, backgroundColor: color, borderRadius: barH }} />
        <View style={{ flex: 1, height: barH, backgroundColor: color, borderRadius: barH }} />
      </View>
      {/* Middle bar - centered knob */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.1 }}>
        <View style={{ flex: 1, height: barH, backgroundColor: color, borderRadius: barH }} />
        <View style={{ width: size * 0.28, height: barH, backgroundColor: color, borderRadius: barH }} />
        <View style={{ flex: 0.4, height: barH, backgroundColor: color, borderRadius: barH }} />
      </View>
      {/* Bottom bar - right knob */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.1 }}>
        <View style={{ flex: 0.5, height: barH, backgroundColor: color, borderRadius: barH }} />
        <View style={{ width: size * 0.28, height: barH, backgroundColor: color, borderRadius: barH }} />
        <View style={{ flex: 1, height: barH, backgroundColor: color, borderRadius: barH }} />
      </View>
    </View>
  );
}

// ─── Check Circle Icon ────────────────────────────────────────────────────────

export function CheckCircleIcon({ size = 24, color = '#4C59D7' }: {
  size?: number; color?: string;
}) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: size * 0.09, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Check left leg */}
      <View style={{
        position: 'absolute',
        width: size * 0.22,
        height: size * 0.08,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
        left: size * 0.12,
        top: size * 0.44,
      }} />
      {/* Check right leg */}
      <View style={{
        position: 'absolute',
        width: size * 0.4,
        height: size * 0.08,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '-50deg' }],
        right: size * 0.1,
        top: size * 0.28,
      }} />
    </View>
  );
}

// ─── Isometric Box Illustration (No Applications) ────────────────────────────

export function IsometricBox({ size = 180 }: { size?: number }) {
  const s = size / 180;
  // 3D open box using geometric shapes
  return (
    <View style={{ width: size, height: size * 0.85, alignItems: 'center', justifyContent: 'center' }}>
      {/* Shadow/base ellipse */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        width: size * 0.7,
        height: size * 0.12,
        borderRadius: size * 0.06,
        backgroundColor: 'rgba(76,89,215,0.08)',
      }} />

      {/* Box - back left face (darkest) */}
      <View style={{
        position: 'absolute',
        width: size * 0.45,
        height: size * 0.52,
        backgroundColor: '#849CFF',
        borderRadius: 4 * s,
        transform: [
          { skewX: '-20deg' },
          { translateX: -size * 0.22 },
          { translateY: -size * 0.05 },
        ],
      }} />

      {/* Box - back right face (medium) */}
      <View style={{
        position: 'absolute',
        width: size * 0.45,
        height: size * 0.52,
        backgroundColor: '#7B8CDE',
        borderRadius: 4 * s,
        transform: [
          { skewX: '20deg' },
          { translateX: size * 0.22 },
          { translateY: -size * 0.05 },
        ],
      }} />

      {/* Box - top face (lightest) */}
      <View style={{
        position: 'absolute',
        width: size * 0.5,
        height: size * 0.22,
        backgroundColor: '#B8C4FF',
        borderRadius: 4 * s,
        transform: [
          { scaleX: 1.4 },
          { rotate: '0deg' },
          { translateY: -size * 0.28 },
        ],
      }} />

      {/* Inner opening (white) */}
      <View style={{
        position: 'absolute',
        width: size * 0.38,
        height: size * 0.3,
        backgroundColor: '#FFFFFF',
        borderRadius: 4 * s,
        transform: [{ translateY: -size * 0.08 }],
      }} />

      {/* Open flap top-left */}
      <View style={{
        position: 'absolute',
        width: size * 0.34,
        height: size * 0.2,
        backgroundColor: '#6B7AE8',
        borderRadius: 4 * s,
        transform: [
          { rotate: '-25deg' },
          { translateX: -size * 0.14 },
          { translateY: -size * 0.35 },
        ],
      }} />
    </View>
  );
}

// ─── Orbital Atom Illustration (Empty Feed) ───────────────────────────────────

export function OrbitalAtom({ size = 180 }: { size?: number }) {
  const orbitStyle = (rotate: string, scaleX: number): ViewStyle => ({
    position: 'absolute',
    width: size * 0.88,
    height: size * 0.5,
    borderRadius: size * 0.25,
    borderWidth: 2,
    borderColor: '#849CFF',
    transform: [{ rotate }, { scaleX }],
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={orbitStyle('0deg', 1)} />
      <View style={orbitStyle('60deg', 0.8)} />
      <View style={orbitStyle('120deg', 0.8)} />
      <View style={orbitStyle('160deg', 0.6)} />
      {/* Center dot */}
      <View style={{
        position: 'absolute',
        width: size * 0.12,
        height: size * 0.12,
        borderRadius: size * 0.06,
        backgroundColor: '#4C59D7',
      }} />
      {/* Orbiting small dot */}
      <View style={{
        position: 'absolute',
        width: size * 0.07,
        height: size * 0.07,
        borderRadius: size * 0.035,
        backgroundColor: '#4C59D7',
        top: size * 0.08,
        right: size * 0.16,
      }} />
    </View>
  );
}

// ─── Chat Bubbles Illustration (Empty Messages) ───────────────────────────────

export function ChatBubbles({ size = 160 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.75, alignItems: 'center', justifyContent: 'center' }}>
      {/* Back bubble (lighter) */}
      <View style={{
        position: 'absolute',
        right: size * 0.02,
        bottom: 0,
        width: size * 0.6,
        height: size * 0.6,
        borderRadius: size * 0.3,
        backgroundColor: '#C7CCFF',
      }}>
        {/* Tail */}
        <View style={{
          position: 'absolute',
          bottom: -size * 0.06,
          left: size * 0.08,
          width: size * 0.15,
          height: size * 0.15,
          backgroundColor: '#C7CCFF',
          borderBottomLeftRadius: size * 0.15,
        }} />
      </View>
      {/* Front bubble (darker) */}
      <View style={{
        position: 'absolute',
        left: size * 0.02,
        top: 0,
        width: size * 0.62,
        height: size * 0.62,
        borderRadius: size * 0.31,
        backgroundColor: '#6B7AE8',
      }}>
        {/* Tail */}
        <View style={{
          position: 'absolute',
          bottom: -size * 0.06,
          right: size * 0.1,
          width: size * 0.15,
          height: size * 0.15,
          backgroundColor: '#6B7AE8',
          borderBottomRightRadius: size * 0.15,
        }} />
      </View>
    </View>
  );
}

// ─── Wavy Offline Illustration ────────────────────────────────────────────────

export function WavyOffline({ size = 220 }: { size?: number }) {
  // Creates concentric arc rings + wave fills to suggest offline/no signal
  const rings = Array.from({ length: 5 });
  return (
    <View style={{
      width: size,
      height: size * 0.75,
      borderRadius: 20,
      backgroundColor: '#F5F6FF',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Bottom-left cluster */}
      {[0,1,2,3,4].map((i) => (
        <View key={`bl-${i}`} style={{
          position: 'absolute',
          bottom: -size * 0.05 * i,
          left: -size * 0.05 * i,
          width: size * (0.35 + i * 0.12),
          height: size * (0.35 + i * 0.12),
          borderRadius: size * (0.35 + i * 0.12) / 2,
          borderWidth: 2.5,
          borderColor: i % 2 === 0 ? '#849CFF' : '#B8C4FF',
          backgroundColor: 'transparent',
        }} />
      ))}
      {/* Top-right wave cluster */}
      {[0,1,2,3].map((i) => (
        <View key={`tr-${i}`} style={{
          position: 'absolute',
          top: -size * 0.08 * i,
          right: -size * 0.08 * i,
          width: size * (0.4 + i * 0.15),
          height: size * (0.4 + i * 0.15),
          borderRadius: size * (0.4 + i * 0.15) / 2,
          borderWidth: 2.5,
          borderColor: i % 2 === 0 ? '#6B7AE8' : '#C7CCFF',
          backgroundColor: 'transparent',
        }} />
      ))}
      {/* Center small circle */}
      {[0,1,2].map((i) => (
        <View key={`c-${i}`} style={{
          position: 'absolute',
          width: size * (0.2 + i * 0.18),
          height: size * (0.2 + i * 0.18),
          borderRadius: size * (0.2 + i * 0.18) / 2,
          borderWidth: 2.5,
          borderColor: i === 0 ? '#4C59D7' : i === 1 ? '#849CFF' : '#D0D7FF',
          backgroundColor: 'transparent',
          top: size * 0.22 + i * (-size * 0.09),
          left: size * 0.32 + i * (-size * 0.09),
        }} />
      ))}
    </View>
  );
}

// ─── Dashed Error Circle ──────────────────────────────────────────────────────

export function ErrorCircleIcon({ size = 160 }: { size?: number }) {
  // Simulates a dashed circle using many short arc segments
  const dashCount = 14;
  const radius = size * 0.38;
  const dashLen = (2 * Math.PI * radius) / (dashCount * 2);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft red background circle */}
      <View style={{
        position: 'absolute',
        width: size * 0.88,
        height: size * 0.88,
        borderRadius: size * 0.44,
        backgroundColor: '#FEF2F2',
      }} />

      {/* Dashed circle using rotated short bars */}
      {Array.from({ length: dashCount }).map((_, i) => {
        const angle = (i / dashCount) * 360;
        const arcLength = (2 * Math.PI * radius * 0.85) / (dashCount * 1.65);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: arcLength,
              height: size * 0.038,
              backgroundColor: '#EF4444',
              borderRadius: size * 0.02,
              transform: [
                { rotate: `${angle}deg` },
                { translateX: radius * 0.78 },
              ],
              transformOrigin: 'left center' as any,
            }}
          />
        );
      })}

      {/* Exclamation mark */}
      <View style={{ alignItems: 'center', gap: size * 0.04 }}>
        {/* Exclamation bar */}
        <View style={{
          width: size * 0.065,
          height: size * 0.3,
          backgroundColor: '#EF4444',
          borderRadius: size * 0.04,
          marginBottom: size * 0.02,
        }} />
        {/* Exclamation dot */}
        <View style={{
          width: size * 0.07,
          height: size * 0.07,
          borderRadius: size * 0.035,
          backgroundColor: '#EF4444',
        }} />
      </View>
    </View>
  );
}

// ─── SVG Icons for Profile Sections ──────────────────────────────────────────

export function BriefcaseIcon({ size = 20, color = '#1A1A2E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Svg>
  );
}

export function LinkIcon({ size = 20, color = '#1A1A2E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

export function GlobeIcon({ size = 20, color = '#1A1A2E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="2" y1="12" x2="22" y2="12" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

export function CodeIcon({ size = 20, color = '#1A1A2E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="16 18 22 12 16 6" />
      <Polyline points="8 6 2 12 8 18" />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function VerifiedBadgeIcon({ size = 24, color = '#4C59D7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l2.4 2.4 3.4-.7.7 3.4 2.4 2.4-2.4 2.4-.7 3.4-3.4-.7L12 22l-2.4-2.4-3.4.7-.7-3.4-2.4-2.4 2.4-2.4.7-3.4 3.4.7L12 2z" />
      <Path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
    </Svg>
  );
}
