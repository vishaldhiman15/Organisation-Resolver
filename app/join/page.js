'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | valid | invalid | success
  const [inviteInfo, setInviteInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No invite token found in this link. Please ask for a new invite.');
      setStatus('invalid');
      return;
    }

    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInviteInfo(data.data);
          setStatus('valid');
        } else {
          setErrorMsg(data.error || 'Invalid invite link.');
          setStatus('invalid');
        }
      })
      .catch(() => {
        setErrorMsg('Network error. Please try again.');
        setStatus('invalid');
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email || !formData.password) {
      return setFormError('All fields are required.');
    }

    if (formData.password.length < 6) {
      return setFormError('Password must be at least 6 characters.');
    }

    setSubmitting(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'employee',
        inviteToken: token,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1800);
    } else {
      setFormError(data.error || 'Registration failed.');
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={centerStyle}>
        <div style={spinnerStyle} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Validating your invite…</p>
        <style>{spinKeyframes}</style>
      </div>
    );
  }

  // ── Invalid / Expired ────────────────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <div style={centerStyle}>
        <div className="glass-panel animate-fade-in" style={{ maxWidth: 480, width: '100%', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>Invalid Invite</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{errorMsg}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/')}>
            ← Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={centerStyle}>
        <div className="glass-panel animate-fade-in" style={{ maxWidth: 480, width: '100%', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>Welcome aboard!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            You've joined <strong style={{ color: 'var(--text-primary)' }}>{inviteInfo?.organizationName}</strong>.
            <br />Redirecting you to the dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── Valid — Show Form ────────────────────────────────────────────────────────
  const daysLeft = Math.ceil((new Date(inviteInfo.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div style={centerStyle}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Org badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 1.25rem', borderRadius: 'var(--rounded-full)',
            background: 'rgba(107,76,255,0.12)', border: '1px solid rgba(107,76,255,0.3)',
            marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🏢</span>
            <span style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{inviteInfo.organizationName}</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            You're invited to join
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create your account below. This link expires in{' '}
            <strong style={{ color: 'var(--warning)' }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
          </p>
        </div>

        {/* Form card */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          {formError && (
            <div style={{
              backgroundColor: 'rgba(255, 59, 59, 0.1)', color: 'var(--danger)',
              padding: '0.75rem', borderRadius: 'var(--rounded-sm)',
              marginBottom: '1.5rem', border: '1px solid rgba(255,0,0,0.2)',
              fontSize: '0.9rem',
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Org — locked */}
            <div>
              <label className="input-label">Organization</label>
              <div style={{
                width: '100%', padding: '0.75rem 1rem',
                background: 'rgba(107,76,255,0.08)',
                border: '1px solid rgba(107,76,255,0.3)',
                borderRadius: 'var(--rounded-sm)',
                color: 'var(--primary-accent)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span>🏢</span> {inviteInfo.organizationName}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  Auto-assigned
                </span>
              </div>
            </div>

            <div>
              <label className="input-label">Full Name</label>
              <input
                required
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="input-label">Work Email</label>
              <input
                required
                type="email"
                className="input-field"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                required
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', width: '100%', opacity: submitting ? 0.7 : 1 }}
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : '✓ Join Organization'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <span
            style={{ color: 'var(--primary-accent)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => router.push('/')}
          >
            Sign in instead
          </span>
        </p>

      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
};

const spinnerStyle = {
  width: 44,
  height: 44,
  border: '3px solid rgba(255,255,255,0.1)',
  borderTopColor: 'var(--primary-accent)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;

export default function JoinPage() {
  return (
    <Suspense fallback={<div style={centerStyle}><div style={spinnerStyle} /><style>{spinKeyframes}</style></div>}>
      <JoinContent />
    </Suspense>
  );
}
