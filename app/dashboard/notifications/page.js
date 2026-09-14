'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await fetch('/api/notifications');
    const data = await res.json();
    if (data.success) {
      setNotifications(data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id = null) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    });
    fetchNotifications();
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem' }}>🔔 Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Stay updated on tasks and announcements.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button className="btn btn-secondary" onClick={() => markAsRead()}>
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          You have no notifications yet!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map(n => (
            <div 
              key={n._id} 
              className="glass-panel" 
              style={{ 
                padding: '1.5rem', 
                borderLeft: n.isRead ? 'none' : '4px solid var(--primary-accent)',
                backgroundColor: n.isRead ? 'var(--glass-bg)' : 'rgba(107, 76, 255, 0.05)',
                cursor: n.link ? 'pointer' : 'default',
                transition: 'var(--transition)'
              }}
              onClick={() => {
                if (!n.isRead) markAsRead(n._id);
                if (n.link) router.push(n.link);
              }}
              onMouseEnter={(e) => { if(n.link) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { if(n.link) e.currentTarget.style.transform = 'none' }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: n.isRead ? 'var(--text-primary)' : 'var(--primary-accent)' }}>{n.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{n.message}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
