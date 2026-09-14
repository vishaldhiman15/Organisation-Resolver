'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.id) {
      fetchEmployeeData();
    }
  }, [params?.id]);

  const fetchEmployeeData = async () => {
    try {
      const res = await fetch(`/api/employees/${params.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch employee details');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading employee data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data?.employee) return <div className="p-8">Employee not found.</div>;

  const { employee, tasks, attendance } = data;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={() => router.back()} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
            &larr; Back
          </button>
          <h1 className="text-3xl font-bold m-0 text-gradient-primary">{employee.name || employee.email}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {employee.email} &bull; Branch: <span style={{ color: 'var(--secondary-accent)' }}>{employee.branch || 'General'}</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Performance Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>{employee.performanceScore || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Details & Attendance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Current Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                height: '16px', width: '16px', borderRadius: '50%',
                background: employee.workStatus === 'working' ? 'var(--warning)' : employee.workStatus === 'free' ? 'var(--success)' : 'gray',
                boxShadow: `0 0 10px ${employee.workStatus === 'working' ? 'var(--warning)' : employee.workStatus === 'free' ? 'var(--success)' : 'gray'}`
              }}></span>
              <span style={{ fontSize: '1.25rem', textTransform: 'capitalize', fontWeight: 600 }}>{employee.workStatus || 'Offline'}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem', marginBottom: 0, fontSize: '0.9rem' }}>
              Account Approved: <strong style={{ color: employee.isApproved ? 'var(--success)' : 'var(--danger)' }}>{employee.isApproved ? 'Yes' : 'No'}</strong>
            </p>
          </div>

          {/* Recent Attendance */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Recent Attendance</h3>
            {attendance && attendance.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {attendance.slice(0, 5).map(record => (
                  <li key={record._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{new Date(record.date).toLocaleDateString()}</span>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', borderRadius: 'var(--rounded-full)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                      background: record.status === 'present' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 65, 108, 0.1)',
                      color: record.status === 'present' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {record.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No attendance records found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', gridColumn: 'span 2' }}>
          <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Assigned Tasks</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks && tasks.length > 0 ? tasks.map(task => (
                <div key={task._id} style={{ 
                  padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)',
                  display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between'
                }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--primary-accent)' }}>{task.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{task.description}</p>
                    {task.report && (
                      <div style={{ 
                        marginTop: '1rem', padding: '1rem', background: 'rgba(0, 210, 255, 0.05)', borderRadius: 'var(--rounded-sm)', 
                        borderLeft: '4px solid var(--secondary-accent)', color: 'var(--text-primary)', fontSize: '0.9rem' 
                      }}>
                        <strong style={{ color: 'var(--secondary-accent)' }}>Employee Report:</strong> {task.report}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', flexShrink: 0 }}>
                    <span style={{ 
                      padding: '0.35rem 1rem', borderRadius: 'var(--rounded-full)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem',
                      background: task.status === 'completed' ? 'rgba(0, 255, 136, 0.1)' : task.status === 'assigned' ? 'rgba(255, 184, 0, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: task.status === 'completed' ? 'var(--success)' : task.status === 'assigned' ? 'var(--warning)' : 'var(--text-muted)'
                    }}>
                      {task.status}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No tasks assigned to this employee.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
