'use client';
import { useState, useEffect } from 'react';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [report, setReport] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!report.trim()) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${completingTask._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', report }),
      });
      if (!res.ok) throw new Error('Failed to complete task');
      
      setCompletingTask(null);
      setReport('');
      fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8">Loading tasks...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Tasks</h1>

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <div className="text-gray-500 text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            You don't have any tasks assigned right now!
          </div>
        ) : (
          tasks.map(task => (
            <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{task.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'assigned' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{task.description}</p>
                
                {task.report && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    <strong className="block text-gray-700 mb-1">Your Report:</strong>
                    {task.report}
                  </div>
                )}
              </div>

              {task.status !== 'completed' && (
                <div className="flex flex-col gap-2 shrink-0">
                  {task.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(task._id, 'assigned')}
                      disabled={updating}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
                    >
                      Acknowledge & Start
                    </button>
                  )}
                  {task.status === 'assigned' && (
                    <button 
                      onClick={() => setCompletingTask(task)}
                      disabled={updating}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold mb-2">Complete Task</h2>
            <p className="text-gray-600 mb-4 text-sm">Please write a brief report on the work you completed for "{completingTask.title}".</p>
            
            <form onSubmit={handleComplete}>
              <div className="mb-6">
                <textarea
                  required
                  rows="4"
                  value={report}
                  onChange={e => setReport(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="e.g. Fixed the wiring issue on the second floor..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setCompletingTask(null); setReport(''); }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !report.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
