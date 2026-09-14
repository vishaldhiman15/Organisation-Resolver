'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Tiny sparkline SVG ──────────────────────────────────────────────────────
function Sparkline({ data, color = '#6b4cff', height = 60 }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 300;
  const pad = 4;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((max - d.count) / max) * (height - pad * 2);
    return `${x},${y}`;
  });

  const area = [
    `${pad},${height - pad}`,
    ...points,
    `${width - pad},${height - pad}`,
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={area}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Donut ring chart ────────────────────────────────────────────────────────
function DonutChart({ open, inProgress, resolved }) {
  const total = open + inProgress + resolved;
  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
        <p style={{ color: 'var(--text-muted)' }}>No data</p>
      </div>
    );
  }

  const r = 50;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: open, color: '#ffb800', label: 'Open' },
    { value: inProgress, color: '#00d2ff', label: 'In Progress' },
    { value: resolved, color: '#00ff88', label: 'Resolved' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total;
    const dashArray = fraction * circumference;
    const dashOffset = -offset * circumference;
    offset += fraction;
    return { ...seg, dashArray, dashOffset };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="18"
            strokeDasharray={`${arc.dashArray} ${circumference - arc.dashArray}`}
            strokeDashoffset={arc.dashOffset}
            style={{ transition: 'stroke-dasharray 0.8s ease', transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#a0a0b0" fontSize="10">total</text>
      </svg>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {segments.map((seg) => (
          <li key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'white', paddingLeft: '1rem' }}>{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div
      className="glass-panel"
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`
      }} />
      <span style={{ fontSize: '1.75rem' }}>{icon}</span>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: accent, margin: 0 }}>{value}</p>
      {sub && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    open: { color: 'var(--warning)', bg: 'rgba(255,184,0,0.12)', label: 'OPEN' },
    'in-progress': { color: 'var(--secondary-accent)', bg: 'rgba(0,210,255,0.12)', label: 'IN PROGRESS' },
    resolved: { color: 'var(--success)', bg: 'rgba(0,255,136,0.12)', label: 'RESOLVED' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{
      padding: '0.2rem 0.6rem', borderRadius: 'var(--rounded-full)',
      fontSize: '0.7rem', fontWeight: 700,
      color: s.color, backgroundColor: s.bg,
    }}>
      {s.label}
    </span>
  );
}

// ─── Main analytics page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || 'Failed to load analytics');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--glass-border)',
          borderTopColor: 'var(--primary-accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading analytics…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>
        <p style={{ fontSize: '2rem' }}>⚠️</p>
        <p>{error}</p>
        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => router.push('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const { stats, topUpvotedIssues, recentActivity, trend, recentReports } = data;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.75rem' }}>
          📊 <span className="text-gradient-primary">Organization Analytics</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
          Insights into your team's issue activity and resolution health.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <StatCard icon="📋" label="Total Issues" value={stats.totalIssues} sub="All time" accent="#6b4cff" />
        <StatCard icon="🟡" label="Open" value={stats.openIssues} sub="Needs attention" accent="#ffb800" />
        <StatCard icon="🔵" label="In Progress" value={stats.inProgressIssues} sub="Being worked on" accent="#00d2ff" />
        <StatCard icon="✅" label="Resolved" value={stats.resolvedIssues} sub="Closed issues" accent="#00ff88" />
        <StatCard icon="👥" label="Members" value={stats.memberCount} sub="In your org" accent="#ff416c" />
        <StatCard
          icon="🎯"
          label="Resolution Rate"
          value={`${stats.resolutionRate}%`}
          sub={stats.resolutionRate >= 70 ? 'Excellent 🔥' : stats.resolutionRate >= 40 ? 'Good' : 'Needs work'}
          accent="#00ff88"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Donut chart */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status Breakdown
          </h3>
          <DonutChart
            open={stats.openIssues}
            inProgress={stats.inProgressIssues}
            resolved={stats.resolvedIssues}
          />
        </div>

        {/* 30-day trend sparkline */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              30-Day Issue Trend
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {trend.reduce((s, d) => s + d.count, 0)} issues
            </span>
          </div>
          <Sparkline data={trend} color="#6b4cff" height={80} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>{trend[0]?.date.slice(5)}</span>
            <span>{trend[trend.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top upvoted issues */}
        {topUpvotedIssues.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.75rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔥 Top Upvoted Issues
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topUpvotedIssues.map((issue, idx) => (
                <div
                  key={issue._id}
                  onClick={() => router.push(`/dashboard/issue/${issue._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--rounded-sm)',
                    background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    border: '1px solid var(--glass-border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(107,76,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'rgba(107,76,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-accent)', flexShrink: 0
                  }}>{idx + 1}</span>
                  <p style={{ flex: 1, margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>{issue.title}</p>
                  <StatusBadge status={issue.status} />
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                  }}>
                    ▲ {issue.upvoteCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.75rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⏱ Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {recentActivity.map((issue, idx) => (
                <div
                  key={issue._id}
                  onClick={() => router.push(`/dashboard/issue/${issue._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.85rem 0',
                    borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: issue.visibility === 'public' ? 'var(--secondary-accent)' : '#ff416c'
                  }} />
                  <p style={{ flex: 1, margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{issue.title}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    by {issue.authorId?.name}
                  </span>
                  <StatusBadge status={issue.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Employee Reports */}
      {recentReports && recentReports.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📝 Recent Employee Task Reports
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {recentReports.map(task => (
              <div key={task._id} style={{ 
                padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)',
                display: 'flex', flexDirection: 'column', gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-accent)' }}>{task.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(task.updatedAt).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  By: <strong style={{ color: 'var(--text-primary)' }}>{task.assigneeId?.name || 'Unknown'}</strong> ({task.assigneeId?.branch || 'General'})
                </p>
                <div style={{ 
                  marginTop: '0.75rem', padding: '1rem', background: 'rgba(0, 210, 255, 0.05)', borderRadius: 'var(--rounded-sm)', 
                  borderLeft: '4px solid var(--secondary-accent)', color: 'var(--text-primary)', fontSize: '0.9rem', fontStyle: 'italic'
                }}>
                  "{task.report}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
