'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BranchesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setEmployees(data.employees || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const branches = ['All', ...new Set(employees.map(e => e.branch || 'General'))];
  
  const filteredEmployees = selectedBranch === 'All' 
    ? employees 
    : employees.filter(e => (e.branch || 'General') === selectedBranch);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (!res.ok) throw new Error('Failed to create task');
      
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assigneeId: '' });
      fetchEmployees(); // Refresh to update workStatus
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading employees...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Manage Branches & Teams</h1>
      
      {/* Branch Selector */}
      <div className="mb-8 flex space-x-4 flex-wrap gap-y-4">
        {branches.map(branch => (
          <button
            key={branch}
            onClick={() => setSelectedBranch(branch)}
            className={`btn ${selectedBranch === branch ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.25rem' }}
          >
            {branch}
          </button>
        ))}
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => (
          <div key={emp._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold cursor-pointer text-gradient-primary hover:opacity-80 transition" onClick={() => router.push(`/dashboard/employees/${emp._id}`)}>
                {emp.name || emp.email}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                emp.workStatus === 'working' ? 'bg-orange-100 text-orange-700' :
                emp.workStatus === 'free' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`} style={{ 
                background: emp.workStatus === 'working' ? 'rgba(255, 184, 0, 0.1)' : emp.workStatus === 'free' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.1)',
                color: emp.workStatus === 'working' ? 'var(--warning)' : emp.workStatus === 'free' ? 'var(--success)' : 'var(--text-muted)'
              }}>
                {emp.workStatus || 'offline'}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{emp.email}</p>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Branch: <span style={{ color: 'var(--secondary-accent)' }}>{emp.branch || 'General'}</span></p>
            
            <div className="mt-auto flex space-x-3">
              <button
                onClick={() => router.push(`/dashboard/employees/${emp._id}`)}
                className="btn btn-secondary flex-1"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                View Profile
              </button>
              <button
                onClick={() => {
                  setNewTask({ ...newTask, assigneeId: emp._id });
                  setShowTaskModal(true);
                }}
                className="btn btn-primary flex-1"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Assign Task
              </button>
            </div>
          </div>
        ))}
        
        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No employees found in this branch.
          </div>
        )}
      </div>

      {/* Task Assignment Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 500, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="text-2xl font-bold m-0 text-gradient-primary">Assign Task</h2>
            <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="input-field"
                  placeholder="e.g. Fix lights in room 204"
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  required
                  rows="3"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="input-field resize-none"
                  placeholder="Task details..."
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
