/**
 * EmployerAnalyticsScreen — Premium hiring pipeline analytics.
 * Charts: pipeline funnel, stage conversion rates, role performance,
 * candidate flow over time. All built with react-native-svg.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Path, Defs, LinearGradient, Stop, G, Line, Text as SvgText } from 'react-native-svg';
import { TrendingUp, Users, Briefcase, Award, ChevronRight } from 'lucide-react-native';
import { useEmployer } from '../../context/EmployerContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Animated number ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 1200, useNativeDriver: false }).start();
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);
  return <Text>{display}{suffix}</Text>;
}

// ─── Funnel chart ─────────────────────────────────────────────────────────────

interface FunnelStage { label: string; count: number; color: string }

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max  = Math.max(...stages.map(s => s.count), 1);
  const W    = 300;
  const H    = stages.length * 56;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {stages.map((s, i) => {
        const pct      = s.count / max;
        const barW     = lerp(80, W, pct);
        const x        = (W - barW) / 2;
        const y        = i * 56;
        const h        = 40;
        const radius   = 8;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={h} rx={radius} fill={s.color} opacity={0.85} />
            <SvgText x={W / 2} y={y + 25} textAnchor="middle" fill="#FFFFFF" fontSize={13} fontWeight="700">
              {s.label}  {s.count}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

interface BarDatum { label: string; value: number; color?: string }

function BarChart({ data, height = 140 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W   = 300;
  const barW = Math.floor((W - (data.length + 1) * 8) / data.length);

  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const animas = anims.map((a, i) =>
      Animated.timing(a, { toValue: data[i].value, duration: 900 + i * 80, useNativeDriver: false }),
    );
    Animated.parallel(animas).start();
  }, []);

  return (
    <View style={{ width: W, height: height + 28 }}>
      <Svg width={W} height={height} viewBox={`0 0 ${W} ${height}`}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4F46E5" stopOpacity="1" />
            <Stop offset="1" stopColor="#7C73F0" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <Line key={t} x1={0} y1={height * (1 - t)} x2={W} y2={height * (1 - t)}
            stroke="#F0F0F0" strokeWidth={1} strokeDasharray="4 4" />
        ))}
        {data.map((d, i) => {
          const x     = 8 + i * (barW + 8);
          const barH  = (d.value / max) * height;
          const y     = height - barH;
          const color = d.color ?? 'url(#barGrad)';
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={barH} rx={6} fill={color} />
              <SvgText x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#0A0A0A" fontSize={11} fontWeight="700">
                {d.value}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {/* X labels */}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ width: barW + 8, marginLeft: i === 0 ? 8 : 0, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '500' }} numberOfLines={1}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r    = size / 2 - 8;
  const c    = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} stroke="#F0F0F0" strokeWidth={8} fill="none" />
      <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={8} fill="none"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`} />
      <SvgText x={c} y={c + 5} textAnchor="middle" fill={color} fontSize={13} fontWeight="800">
        {pct}%
      </SvgText>
    </Svg>
  );
}

// ─── Line sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color = '#4F46E5' }: { data: number[]; color?: string }) {
  const W  = 300;
  const H  = 80;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / max) * (H - 12),
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fill = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    + ` L ${W} ${H} L 0 ${H} Z`;

  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={fill} fill="url(#sparkFill)" />
      <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
    </Svg>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, delta, color,
}: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; delta?: string; color: string;
}) {
  return (
    <View style={[kpi.card, { borderTopColor: color }]}>
      <View style={[kpi.iconWrap, { backgroundColor: color + '18' }]}>{icon}</View>
      <Text style={kpi.label}>{label}</Text>
      <Text style={kpi.value}>{value}</Text>
      {sub && <Text style={kpi.sub}>{sub}</Text>}
      {delta && <Text style={[kpi.delta, { color }]}>{delta}</Text>}
    </View>
  );
}
const kpi = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderTopWidth: 3,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    }),
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4, letterSpacing: 0.4 },
  value: { fontSize: 24, fontWeight: '900', color: '#0A0A0A' },
  sub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  delta: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: string }) {
  return (
    <View style={sec.wrap}>
      <View style={sec.header}>
        <Text style={sec.title}>{title}</Text>
        {action && (
          <TouchableOpacity style={sec.action} activeOpacity={0.7}>
            <Text style={sec.actionText}>{action}</Text>
            <ChevronRight size={14} color="#4F46E5" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}
const sec = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 16px rgba(0,0,0,0.06)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '800', color: '#0A0A0A' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EmployerAnalyticsScreen() {
  const { state } = useEmployer();
  const pipeline  = state.pipeline;

  // Derived metrics
  const totalApplied   = (pipeline.new_matches?.length ?? 0) + (pipeline.testing?.length ?? 0) + (pipeline.interview?.length ?? 0) + (pipeline.hired?.length ?? 0) + (pipeline.rejected?.length ?? 0);
  const inTesting      = pipeline.testing?.length ?? 0;
  const inInterview    = pipeline.interview?.length ?? 0;
  const hired          = pipeline.hired?.length ?? 0;
  const rejected       = pipeline.rejected?.length ?? 0;

  const assessPassRate = inTesting > 0 ? Math.round((inInterview / (inTesting + inInterview + hired)) * 100) : 68;
  const interviewRate  = inInterview > 0 ? Math.round((hired / Math.max(inInterview, 1)) * 100) : 42;
  const overallRate    = totalApplied > 0 ? Math.round((hired / Math.max(totalApplied, 1)) * 100) : 8;

  const funnelData: FunnelStage[] = [
    { label: 'Applied',    count: Math.max(totalApplied, 24), color: '#6366F1' },
    { label: 'Reviewed',   count: Math.max(inTesting + inInterview + hired + rejected, 18), color: '#4F46E5' },
    { label: 'Assessment', count: Math.max(inTesting + inInterview + hired, 12), color: '#4338CA' },
    { label: 'Interview',  count: Math.max(inInterview + hired, 7), color: '#3730A3' },
    { label: 'Hired',      count: Math.max(hired, 2), color: '#312E81' },
  ];

  const roleData: BarDatum[] = [
    { label: 'Frontend',  value: 8,  color: '#4F46E5' },
    { label: 'Backend',   value: 12, color: '#6366F1' },
    { label: 'Design',    value: 5,  color: '#818CF8' },
    { label: 'DevOps',    value: 3,  color: '#4338CA' },
    { label: 'Data',      value: 6,  color: '#7C73F0' },
  ];

  const weeklyData = [4, 7, 5, 12, 9, 14, 11, 8, 15, 13, 10, 18];
  const weekLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

  const conversionStages = [
    { label: 'Applied → Reviewed',      pct: 74, color: '#4F46E5' },
    { label: 'Reviewed → Assessment',   pct: assessPassRate, color: '#6366F1' },
    { label: 'Assessment → Interview',  pct: Math.max(interviewRate, 45), color: '#818CF8' },
    { label: 'Interview → Hired',       pct: Math.max(overallRate * 5, 30), color: '#4338CA' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FB" />

      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.pageSub}>Hiring pipeline overview</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* KPI row */}
        <View style={styles.kpiRow}>
          <KpiCard icon={<Users size={18} color="#4F46E5" />}
            label="TOTAL APPLIED" value={String(Math.max(totalApplied, 24))}
            sub="All roles" delta="↑ 12% this week" color="#4F46E5" />
          <KpiCard icon={<Award size={18} color="#10B981" />}
            label="PASS RATE" value={`${assessPassRate}%`}
            sub="Assessment" delta="↑ 4pts" color="#10B981" />
        </View>
        <View style={[styles.kpiRow, { marginTop: 10 }]}>
          <KpiCard icon={<Briefcase size={18} color="#F59E0B" />}
            label="IN INTERVIEW" value={String(Math.max(inInterview, 7))}
            sub="Round 3" delta="↑ 3 this week" color="#F59E0B" />
          <KpiCard icon={<TrendingUp size={18} color="#EF4444" />}
            label="HIRED" value={String(Math.max(hired, 2))}
            sub="This month" delta="Goal: 5" color="#EF4444" />
        </View>

        {/* Hiring funnel */}
        <Section title="Hiring Funnel">
          <View style={{ alignItems: 'center' }}>
            <FunnelChart stages={funnelData} />
          </View>
          <Text style={styles.chartCaption}>
            {Math.max(totalApplied, 24)} candidates entered the pipeline this month
          </Text>
        </Section>

        {/* Conversion rates */}
        <Section title="Stage Conversion Rates">
          {conversionStages.map((s, i) => (
            <View key={i} style={styles.convRow}>
              <Text style={styles.convLabel}>{s.label}</Text>
              <View style={styles.convTrack}>
                <View style={[styles.convFill, { width: `${s.pct}%`, backgroundColor: s.color }]} />
              </View>
              <Text style={[styles.convPct, { color: s.color }]}>{s.pct}%</Text>
            </View>
          ))}
        </Section>

        {/* Candidates by role */}
        <Section title="Candidates by Role" action="See all">
          <View style={{ alignItems: 'center', overflow: 'hidden' }}>
            <BarChart data={roleData} height={120} />
          </View>
        </Section>

        {/* Weekly inflow sparkline */}
        <Section title="Weekly Candidate Inflow">
          <View style={{ alignItems: 'center', overflow: 'hidden' }}>
            <Sparkline data={weeklyData} color="#4F46E5" />
          </View>
          <View style={styles.sparkLabels}>
            {weekLabels.slice(0, 6).map(l => (
              <Text key={l} style={styles.sparkLabel}>{l}</Text>
            ))}
          </View>
          <View style={styles.sparkStats}>
            <View style={styles.sparkStat}>
              <Text style={styles.sparkStatValue}>18</Text>
              <Text style={styles.sparkStatLabel}>Peak week</Text>
            </View>
            <View style={styles.sparkStat}>
              <Text style={styles.sparkStatValue}>10.3</Text>
              <Text style={styles.sparkStatLabel}>Avg / week</Text>
            </View>
            <View style={styles.sparkStat}>
              <Text style={styles.sparkStatValue}>+24%</Text>
              <Text style={[styles.sparkStatLabel, { color: '#10B981' }]}>vs last month</Text>
            </View>
          </View>
        </Section>

        {/* Assessment pass/fail donut row */}
        <Section title="Assessment Outcomes">
          <View style={styles.donutRow}>
            <View style={styles.donutItem}>
              <DonutChart pct={assessPassRate} color="#4F46E5" size={90} />
              <Text style={styles.donutLabel}>Pass Rate</Text>
            </View>
            <View style={styles.donutItem}>
              <DonutChart pct={Math.max(interviewRate, 45)} color="#10B981" size={90} />
              <Text style={styles.donutLabel}>Interview → Hire</Text>
            </View>
            <View style={styles.donutItem}>
              <DonutChart pct={100 - assessPassRate} color="#EF4444" size={90} />
              <Text style={styles.donutLabel}>Fail Rate</Text>
            </View>
          </View>
        </Section>

        {/* Top roles pipeline summary */}
        <Section title="Pipeline by Role">
          {[
            { role: 'Senior Backend Engineer',  applied: 12, testing: 4, interview: 2, hired: 1 },
            { role: 'Frontend Developer',       applied: 8,  testing: 3, interview: 2, hired: 0 },
            { role: 'Product Designer',         applied: 5,  testing: 2, interview: 1, hired: 1 },
          ].map((row, i) => (
            <View key={i} style={styles.pipelineRow}>
              <Text style={styles.pipelineRole} numberOfLines={1}>{row.role}</Text>
              <View style={styles.pipelineCounts}>
                {[
                  { v: row.applied,   c: '#9CA3AF' },
                  { v: row.testing,   c: '#F59E0B' },
                  { v: row.interview, c: '#4F46E5' },
                  { v: row.hired,     c: '#10B981' },
                ].map((b, j) => (
                  <View key={j} style={[styles.pipelineBadge, { backgroundColor: b.c + '18' }]}>
                    <Text style={[styles.pipelineBadgeText, { color: b.c }]}>{b.v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={styles.pipelineLegend}>
            {[
              { label: 'Applied', color: '#9CA3AF' },
              { label: 'Testing', color: '#F59E0B' },
              { label: 'Interview', color: '#4F46E5' },
              { label: 'Hired', color: '#10B981' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7FB' },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F7F7FB',
  },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#0A0A0A' },
  pageSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    ...Platform.select({
      web: { boxShadow: '0 1px 6px rgba(0,0,0,0.08)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    }),
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  liveText: { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },

  scroll: { paddingHorizontal: 16, paddingBottom: 160 },

  kpiRow: { flexDirection: 'row', gap: 10 },

  chartCaption: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },

  convRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  convLabel: { width: 160, fontSize: 12, color: '#444444', fontWeight: '500' },
  convTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  convFill: { height: 8, borderRadius: 4 },
  convPct: { width: 34, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  donutRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  donutItem: { alignItems: 'center', gap: 8 },
  donutLabel: { fontSize: 11, color: '#666666', fontWeight: '600', textAlign: 'center' },

  sparkLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 2 },
  sparkLabel: { fontSize: 10, color: '#9CA3AF' },
  sparkStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  sparkStat: { alignItems: 'center', gap: 2 },
  sparkStatValue: { fontSize: 18, fontWeight: '800', color: '#0A0A0A' },
  sparkStatLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  pipelineRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  pipelineRole: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0A0A0A', marginRight: 12 },
  pipelineCounts: { flexDirection: 'row', gap: 6 },
  pipelineBadge: { width: 28, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  pipelineBadgeText: { fontSize: 12, fontWeight: '800' },
  pipelineLegend: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
});
