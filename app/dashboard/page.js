'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'public';
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userSpecialization, setUserSpecialization] = useState('General');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'foryou'

  // New Issue Form
  const [formData, setFormData] = useState({ title: '', description: '', category: 'General' });

  const fetchIssues = async () => {
    setLoading(true);
    // Fetch user details to get specialization
    const userRes = await fetch('/api/auth/me');
    const userData = await userRes.json();
    if(userData.success) {
      setUserSpecialization(userData.data.specialization || 'General');
    }

    const res = await fetch(`/api/issues?view=${view}`);
    const data = await res.json();
    if (data.success) {
      setIssues(data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, [view]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('visibility', view); // creates a private or public depending on current view
    payload.append('category', formData.category);

    const res = await fetch('/api/issues', {
      method: 'POST',
      body: payload
    });

    if (res.ok) {
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'General' });
      fetchIssues();
    }
  };

  const displayedIssues = activeTab === 'foryou' 
    ? issues.filter(issue => issue.category === userSpecialization)
    : issues;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>{view === 'public' ? 'Public Feed' : 'Private Inbox'}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {view === 'public' 
              ? 'Company-wide updates, network issues, and general requests.' 
              : 'Secure, private communication with management.'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'none' }} className="md-btn-show">
          <style>{`@media (min-width: 768px) { .md-btn-show { display: inline-flex !important; } }`}</style>
          + New {view === 'public' ? 'Public Post' : 'Private Request'}
        </button>
      </div>

      {view === 'public' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
          <button 
            style={{ background: 'none', border: 'none', color: activeTab === 'all' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontWeight: activeTab === 'all' ? 'bold' : 'normal', cursor: 'pointer', paddingBottom: '0.25rem', borderBottom: activeTab === 'all' ? '2px solid var(--primary-accent)' : 'none' }}
            onClick={() => setActiveTab('all')}
          >
            All Issues
          </button>
          <button 
            style={{ background: 'none', border: 'none', color: activeTab === 'foryou' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontWeight: activeTab === 'foryou' ? 'bold' : 'normal', cursor: 'pointer', paddingBottom: '0.25rem', borderBottom: activeTab === 'foryou' ? '2px solid var(--primary-accent)' : 'none' }}
            onClick={() => setActiveTab('foryou')}
          >
            For You ({userSpecialization})
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedIssues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--rounded-md)' }}>
              No issues found in this view.
            </div>
          ) : (
            displayedIssues.map(issue => (
              <div 
                key={issue._id} 
                onClick={() => router.push(`/dashboard/issue/${issue._id}`)}
                className="glass-panel" 
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-accent)' }}>{issue.title}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                      Category: {issue.category || 'General'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {view === 'public' && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          fetch(`/api/issues/${issue._id}/upvote`, { method: 'POST' }).then(() => fetchIssues());
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', borderRadius: 'var(--rounded-md)', 
                          backgroundColor: 'rgba(107, 76, 255, 0.1)', color: 'var(--primary-accent)',
                          fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', transition: 'var(--transition)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(107, 76, 255, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(107, 76, 255, 0.1)'}
                      >
                        ▲ {issue.upvoteCount || 0}
                      </div>
                    )}
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--rounded-full)', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: issue.status === 'resolved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 184, 0, 0.1)',
                      color: issue.status === 'resolved' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {issue.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', marginTop: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {issue.description}
                </p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Posted by {issue.authorId?.name} • {new Date(issue.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Mobile FAB */}
      <button className="mobile-fab" onClick={() => setShowModal(true)}>
        +
      </button>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Create New {view === 'public' ? 'Public Post' : 'Private Request'}</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Title</label>
                <input required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Category / Specialized Role needed</label>
                <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="General">General</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="IT Support">IT Support</option>
                </select>
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea required className="input-field" rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading view...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
