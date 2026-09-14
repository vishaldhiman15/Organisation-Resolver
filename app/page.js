'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    orgName: '',
    orgSlug: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setLoading(false);
      return setError('Email and password are required');
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          orgName: formData.orgName,
          orgSlug: formData.orgSlug,
          role: 'head',
        };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error || 'Something went wrong');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', gap: '2rem' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center' }} className="animate-fade-in">
        <h1 style={{ fontSize: '4rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Welcome to <span className="text-gradient">Helpbuddy</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          The premium internal communication platform. Secure, private, and powerful.
          <br />
          <strong style={{ color: 'var(--primary-accent)' }}>We never see your organization's data.</strong>
        </p>
      </div>

      {/* Invite notice for employees */}
      <div
        className="animate-fade-in"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.9rem 1.5rem',
          borderRadius: 'var(--rounded-full)',
          background: 'rgba(0, 210, 255, 0.07)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          animationDelay: '0.1s',
          maxWidth: 600,
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📨</span>
        <span>
          <strong style={{ color: 'var(--secondary-accent)' }}>Joining a team?</strong>{' '}
          Use the invite link your organization head sent you — it goes straight to your workspace.
        </span>
      </div>

      {/* Auth card */}
      <div
        className="glass-panel animate-fade-in"
        style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', animationDelay: '0.2s' }}
      >
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
          {isLogin ? 'Welcome Back' : '🏢 Create Your Organization'}
        </h2>
        {!isLogin && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: 0 }}>
            Register as the head of a new workspace
          </p>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 59, 0.1)', color: 'var(--danger)',
            padding: '0.75rem', borderRadius: 'var(--rounded-sm)',
            marginBottom: '1.5rem', border: '1px solid rgba(255,0,0,0.2)',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {!isLogin && (
            <>
              <div>
                <label className="input-label">Your Full Name</label>
                <input required name="name" type="text" className="input-field"                   placeholder="Vishal" onChange={handleChange} />
              </div>
              <div>
                <label className="input-label">Organization Name</label>
                <input required name="orgName" type="text" className="input-field" placeholder="Acme Corp" onChange={handleChange} />
              </div>
              <div>
                <label className="input-label">
                  Organization Slug{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(unique, e.g. acme)</span>
                </label>
                <input
                  required
                  name="orgSlug"
                  type="text"
                  className="input-field"
                  placeholder="acme"
                  pattern="[a-z0-9\-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label className="input-label">Email Address</label>
            <input required name="email" type="email" className="input-field" placeholder="jane@acme.com" onChange={handleChange} />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input required name="password" type="password" className="input-field" placeholder="••••••••" onChange={handleChange} />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', width: '100%', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading
              ? (isLogin ? 'Signing in…' : 'Creating workspace…')
              : (isLogin ? 'Sign In' : '✓ Launch Workspace')}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            style={{ color: 'var(--primary-accent)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Create a workspace' : 'Sign In'}
          </span>
        </p>
      </div>

    </div>
  );
}
