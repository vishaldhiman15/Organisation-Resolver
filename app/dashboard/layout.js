'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ─── Invite Management Modal ─────────────────────────────────────────────────
function InviteModal({ onClose }) {
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState('');

  const fetchInvites = useCallback(async () => {
    setLoadingInvites(true);
    const res = await fetch('/api/invites');
    const data = await res.json();
    if (data.success) setInvites(data.data);
    setLoadingInvites(false);
  }, []);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    setNewLink('');
    const res = await fetch('/api/invites', { method: 'POST' });
    const data = await res.json();
    setGenerating(false);
    if (data.success) {
      setNewLink(data.data.joinUrl);
      fetchInvites();
    } else {
      setGenError(data.error || 'Failed to generate invite');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusStyle = (status) => ({
    used: { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', icon: '✓' },
    expired: { color: 'var(--danger)', bg: 'rgba(255,59,59,0.08)', icon: '✕' },
    pending: { color: 'var(--success)', bg: 'rgba(0,255,136,0.08)', icon: '●' },
  }[status] || {});

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: 580, padding: '2rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        maxHeight: '85vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🔗 Invite Members</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Generate one-time invite links for your team
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-muted)',
              width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕
          </button>
        </div>

        {/* Generate button + new link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
            style={{ opacity: generating ? 0.7 : 1 }}
          >
            {generating ? 'Generating…' : '+ Generate Invite Link'}
          </button>

          {genError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>{genError}</p>
          )}

          {newLink && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0,255,136,0.06)',
              border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 'var(--rounded-sm)',
            }}>
              <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {newLink}
              </span>
              <button
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', flexShrink: 0 }}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Invite history */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Invite History
          </p>

          {loadingInvites ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
          ) : invites.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No invites yet. Generate your first one above.</p>
          ) : (
            invites.map((inv) => {
              const s = statusStyle(inv.status);
              const expDate = new Date(inv.expiresAt).toLocaleDateString();
              return (
                <div key={inv._id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--rounded-sm)',
                  background: s.bg,
                  border: '1px solid var(--glass-border)',
                }}>
                  <span style={{ color: s.color, fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      …{inv.token.slice(-20)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {inv.status === 'used'
                        ? `Used by ${inv.usedBy?.name || 'someone'}`
                        : inv.status === 'expired'
                        ? `Expired ${expDate}`
                        : `Expires ${expDate}`}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 'var(--rounded-full)',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: s.color, background: s.bg, border: `1px solid ${s.color}44`,
                    flexShrink: 0, textTransform: 'uppercase',
                  }}>
                    {inv.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
          // Fetch notifications count
          fetch('/api/notifications')
            .then(res => res.json())
            .then(notifData => {
              if (notifData.success) setUnreadNotifications(notifData.unreadCount);
            });
        } else {
          // Token is invalid, clear it so middleware doesn't redirect back to dashboard
          fetch('/api/auth/logout', { method: 'POST' }).finally(() => router.push('/'));
        }
      })
      .catch(() => {
        fetch('/api/auth/logout', { method: 'POST' }).finally(() => router.push('/'));
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="dashboard-container">

      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}

      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div>
          <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.25rem' }}>Helpbuddy</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{user?.organizationId?.name || 'Organization'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="notification-bell" onClick={() => router.push('/dashboard/notifications')}>
            🔔
            {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
          </button>
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
        </div>
      </div>

      {/* Desktop Sidebar / Mobile Slide-out */}
      <aside className={`glass-panel dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="text-gradient" style={{ margin: 0 }}>Helpbuddy</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {user?.organizationId?.name || 'Organization'}
            </p>
          </div>
          <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
        </div>

        <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-secondary"
            style={{
              width: '100%', justifyContent: 'flex-start',
              background: pathname === '/dashboard' && !pathname.includes('analytics') ? 'rgba(107,76,255,0.15)' : undefined,
              borderColor: pathname === '/dashboard' && !pathname.includes('analytics') ? 'var(--primary-accent)' : undefined,
            }}
          >
            🌐 Public Feed
          </button>
          <button
            onClick={() => router.push('/dashboard?view=private')}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            🔒 Private Inbox
          </button>
          <button
            onClick={() => router.push('/dashboard/attendance')}
            className="btn btn-secondary"
            style={{
              width: '100%', justifyContent: 'flex-start',
              background: pathname?.includes('/attendance') ? 'rgba(107,76,255,0.15)' : undefined,
              borderColor: pathname?.includes('/attendance') ? 'var(--primary-accent)' : undefined,
            }}
          >
            📅 Attendance
          </button>
          <button
            onClick={() => router.push('/dashboard/leave-requests')}
            className="btn btn-secondary"
            style={{
              width: '100%', justifyContent: 'flex-start',
              background: pathname?.includes('/leave-requests') ? 'rgba(107,76,255,0.15)' : undefined,
              borderColor: pathname?.includes('/leave-requests') ? 'var(--primary-accent)' : undefined,
            }}
          >
            📋 Leave Requests
          </button>
          {user.role === 'employee' && (
            <button
              onClick={() => router.push('/dashboard/tasks')}
              className="btn btn-secondary"
              style={{
                width: '100%', justifyContent: 'flex-start',
                background: pathname?.includes('/tasks') ? 'rgba(107,76,255,0.15)' : undefined,
                borderColor: pathname?.includes('/tasks') ? 'var(--primary-accent)' : undefined,
              }}
            >
              📝 My Tasks
            </button>
          )}
          {user.role === 'head' && (
            <>
              <button
                onClick={() => router.push('/dashboard/branches')}
                className="btn btn-secondary"
                style={{
                  width: '100%', justifyContent: 'flex-start',
                  background: pathname?.includes('/branches') ? 'rgba(107,76,255,0.15)' : undefined,
                  borderColor: pathname?.includes('/branches') ? 'var(--primary-accent)' : undefined,
                }}
              >
                🏢 Branches & Teams
              </button>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="btn btn-secondary"
                style={{
                  width: '100%', justifyContent: 'flex-start',
                  background: pathname?.includes('analytics') ? 'rgba(107,76,255,0.15)' : undefined,
                  borderColor: pathname?.includes('analytics') ? 'var(--primary-accent)' : undefined,
                }}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                🔗 Invite Members
              </button>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="btn btn-secondary"
                style={{
                  width: '100%', justifyContent: 'flex-start',
                  background: pathname?.includes('/settings') ? 'rgba(107,76,255,0.15)' : undefined,
                  borderColor: pathname?.includes('/settings') ? 'var(--primary-accent)' : undefined,
                }}
              >
                ⚙️ Settings
              </button>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <button 
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
            onClick={() => router.push('/dashboard/notifications')}
          >
            🔔 Notifications {unreadNotifications > 0 && <span style={{ background: 'var(--danger)', color: 'white', padding: '0 6px', borderRadius: '10px' }}>{unreadNotifications}</span>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: '600', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', textTransform: 'capitalize' }}>{user?.specialization || user?.role || 'Member'}</p>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="glass-panel" style={{ height: '100%', padding: '2rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </div>
  );
}
