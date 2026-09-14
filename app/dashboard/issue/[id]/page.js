'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function IssueDetail({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;
  
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [issueRes, commentsRes] = await Promise.all([
      fetch(`/api/issues/${id}`),
      fetch(`/api/issues/${id}/comments`)
    ]);

    if (issueRes.ok) {
      const issueData = await issueRes.json();
      setIssue(issueData.data);
    } else {
      router.push('/dashboard');
    }

    if (commentsRes.ok) {
      const commentsData = await commentsRes.json();
      setComments(commentsData.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.success) setCurrentUser(d.data); });
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    const res = await fetch(`/api/issues/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setIssue(prev => ({ ...prev, status: newStatus }));
    }
    setStatusUpdating(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const payload = new FormData();
    payload.append('content', commentContent);

    const res = await fetch(`/api/issues/${id}/comments`, {
      method: 'POST',
      body: payload
    });

    if (res.ok) {
      setCommentContent('');
      fetchData(); // Refresh comments
    }
  };

  const handleApproval = async (newApprovalStatus) => {
    setStatusUpdating(true);
    const res = await fetch(`/api/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: newApprovalStatus }),
    });
    if (res.ok) {
      setIssue(prev => ({ ...prev, approvalStatus: newApprovalStatus }));
    }
    setStatusUpdating(false);
  };

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    if (res.ok) setEmployees(data.employees || []);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setStatusUpdating(true);
    // Create Task
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Fix Issue: ${issue.title}`,
        description: `Please resolve this issue: ${issue.description}`,
        assigneeId: selectedEmployee
      })
    });

    if (res.ok) {
      // Update Issue Status to in-progress
      await fetch(`/api/issues/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress' }),
      });
      setIssue(prev => ({ ...prev, status: 'in-progress' }));
      setShowAssignModal(false);
    } else {
      const errorData = await res.json();
      alert(`Error: ${errorData.error}`);
    }
    setStatusUpdating(false);
  };

  const branches = ['All', ...new Set(employees.map(e => e.branch || 'General'))];
  const filteredEmployees = selectedBranch === 'All' 
    ? employees 
    : employees.filter(e => (e.branch || 'General') === selectedBranch);

  if (loading) return <div>Loading issue...</div>;
  if (!issue) return null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <button onClick={() => router.back()} className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
        ← Back
      </button>

      <div style={{ flex: '0 0 auto', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary-accent)', marginBottom: '0.5rem', flex: 1 }}>{issue.title}</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
            {/* Status badge / changer */}
            {currentUser?.role === 'head' ? (
              <select
                value={issue.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--rounded-full)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.3)',
                  color:
                    issue.status === 'resolved' ? 'var(--success)'
                    : issue.status === 'in-progress' ? 'var(--secondary-accent)'
                    : 'var(--warning)',
                  cursor: 'pointer',
                  appearance: 'none',
                  paddingRight: '1.5rem',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a0a0b0'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  transition: 'var(--transition)',
                  opacity: statusUpdating ? 0.5 : 1,
                }}
              >
                <option value="open" style={{ color: 'black' }}>🟡 OPEN</option>
                <option value="in-progress" style={{ color: 'black' }}>🔵 IN PROGRESS</option>
                <option value="resolved" style={{ color: 'black' }}>✅ RESOLVED</option>
              </select>
            ) : (
              <span style={{ 
                padding: '0.35rem 1rem', 
                borderRadius: 'var(--rounded-full)', 
                fontSize: '0.85rem', 
                fontWeight: 'bold',
                backgroundColor: issue.status === 'resolved' ? 'rgba(0, 255, 136, 0.1)' : issue.status === 'in-progress' ? 'rgba(0,210,255,0.1)' : 'rgba(255, 184, 0, 0.1)',
                color: issue.status === 'resolved' ? 'var(--success)' : issue.status === 'in-progress' ? 'var(--secondary-accent)' : 'var(--warning)'
              }}>
                {issue.status.toUpperCase()}
              </span>
            )}
            <span style={{ 
              padding: '0.35rem 1rem', 
              borderRadius: 'var(--rounded-full)', 
              fontSize: '0.85rem', 
              fontWeight: 'bold',
              backgroundColor: issue.visibility === 'public' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255, 65, 108, 0.1)',
              color: issue.visibility === 'public' ? 'var(--secondary-accent)' : '#ff416c'
            }}>
              {issue.visibility.toUpperCase()}
            </span>
            {issue.visibility === 'private' && (
              <span style={{ 
                padding: '0.35rem 1rem', 
                borderRadius: 'var(--rounded-full)', 
                fontSize: '0.85rem', 
                fontWeight: 'bold',
                backgroundColor: issue.approvalStatus === 'approved' ? 'rgba(0, 255, 136, 0.1)' : issue.approvalStatus === 'rejected' ? 'rgba(255, 65, 108, 0.1)' : 'rgba(255, 184, 0, 0.1)',
                color: issue.approvalStatus === 'approved' ? 'var(--success)' : issue.approvalStatus === 'rejected' ? '#ff416c' : 'var(--warning)'
              }}>
                {issue.approvalStatus?.toUpperCase() || 'PENDING'}
              </span>
            )}
          </div>
        </div>
        
        {/* Admin Approval & Actions */}
        {currentUser?.role === 'head' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {issue.visibility === 'private' && issue.approvalStatus === 'pending' && (
              <>
                <button 
                  onClick={() => handleApproval('approved')}
                  disabled={statusUpdating}
                  className="btn btn-success"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
                >
                  ✓ Approve Request
                </button>
                <button 
                  onClick={() => handleApproval('rejected')}
                  disabled={statusUpdating}
                  className="btn btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
                >
                  ✕ Reject Request
                </button>
              </>
            )}
            
            {issue.status !== 'resolved' && (
              <button
                onClick={() => {
                  fetchEmployees();
                  setShowAssignModal(true);
                }}
                disabled={statusUpdating}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
              >
                + Assign Task to Team
              </button>
            )}
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {issue.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {issue.authorId?.name.charAt(0)}
          </div>
          <span>Posted by <strong style={{ color: 'var(--text-primary)' }}>{issue.authorId?.name}</strong> on {new Date(issue.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ flex: '1 1 auto', overflowY: 'auto', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Discussion</h3>
        
        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No comments yet. Start the discussion!</p>
        ) : (
          comments.map(c => (
            <div key={c._id} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {c.authorId?.name.charAt(0)}
                </div>
                <div>
                  <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>{c.authorId?.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <p style={{ margin: 0 }}>{c.content}</p>
            </div>
          ))
        )}
      </div>

      <div style={{ flex: '0 0 auto', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
        <form onSubmit={handleComment} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Type your message..." 
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Reply</button>
        </form>
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 500, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Assign Task</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Select a team member to assign this issue to. It will appear in their tasks queue.</p>
            
            <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Filter by Branch</label>
                <select 
                  className="input-field" 
                  value={selectedBranch} 
                  onChange={e => setSelectedBranch(e.target.value)}
                >
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="input-label">Select Employee</label>
                <select 
                  className="input-field" 
                  required
                  value={selectedEmployee} 
                  onChange={e => setSelectedEmployee(e.target.value)}
                >
                  <option value="" disabled>-- Choose an employee --</option>
                  {filteredEmployees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name || emp.email} ({emp.workStatus || 'offline'}) - {emp.branch || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={statusUpdating || !selectedEmployee} className="btn btn-primary">
                  {statusUpdating ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
