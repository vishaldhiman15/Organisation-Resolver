'use client';
import { useState, useEffect } from 'react';

export default function LeaveRequestsPage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ type: 'early_leave', reason: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRequests = async () => {
    const res = await fetch('/api/leave-requests');
    const data = await res.json();
    if (data.success) setRequests(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success) { setUser(d.data); fetchRequests(); }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    
    const res = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setSubmitting(false);
    
    if (data.success) {
      setMessage('Request submitted successfully.');
      setFormData({ type: 'early_leave', reason: '', date: '' });
      fetchRequests();
    } else {
      setMessage(data.error || 'Failed to submit request');
    }
  };

  const handleStatusChange = async (id, status) => {
    const res = await fetch(`/api/leave-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchRequests();
  };

  if (!user || loading) return <div>Loading...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.75rem' }}>📋 Leave & Special Permissions</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Manage requests for remote work or early leave.
        </p>
      </div>

      {user.role === 'employee' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>New Request</h3>
          {message && <p style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }}>{message}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Type</label>
              <select 
                className="input-field" 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="early_leave">Early Leave</option>
                <option value="remote">Remote Work</option>
              </select>
            </div>
            <div>
              <label className="input-label">Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="input-label">Reason</label>
              <textarea 
                className="input-field" 
                rows="3"
                value={formData.reason} 
                onChange={e => setFormData({...formData, reason: e.target.value})}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: '1rem' }}>{user.role === 'head' ? 'Employee Requests' : 'My Requests'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No requests found.</p>
          ) : (
            requests.map(req => (
              <div key={req._id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {user.role === 'head' && <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{req.userId.name}</p>}
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{req.type.replace('_', ' ')}</span> on {req.date}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{req.reason}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '0.2rem 0.6rem', borderRadius: 'var(--rounded-full)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold',
                    background: req.status === 'approved' ? 'rgba(0,255,136,0.1)' : req.status === 'rejected' ? 'rgba(255,59,59,0.1)' : 'rgba(255,255,255,0.05)',
                    color: req.status === 'approved' ? 'var(--success)' : req.status === 'rejected' ? 'var(--danger)' : 'var(--text-muted)'
                  }}>
                    {req.status}
                  </span>
                  
                  {user.role === 'head' && req.status === 'pending' && (
                    <>
                      <button className="btn" style={{ background: 'var(--success)', color: 'black', padding: '0.4rem 0.8rem' }} onClick={() => handleStatusChange(req._id, 'approved')}>Approve</button>
                      <button className="btn" style={{ background: 'var(--danger)', color: 'white', padding: '0.4rem 0.8rem' }} onClick={() => handleStatusChange(req._id, 'rejected')}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
