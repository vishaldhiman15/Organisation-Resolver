'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [attendanceData, setAttendanceData] = useState(null);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [todayDate, setTodayDate] = useState('');

  const fetchData = useCallback(async (userRole) => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (data.success) {
        setAttendanceData(data.data);
        if (data.date) setTodayDate(data.date);
      } else {
        setError(data.error || 'Failed to fetch attendance data');
      }
    } catch (err) {
      setError('An error occurred');
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
          fetchData(data.data.role);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router, fetchData]);

  const handleAction = async (action) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setMarking(true);
    setError('');

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const res = await fetch('/api/attendance', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        });
        const data = await res.json();
        if (data.success) {
          fetchData(user.role);
        } else {
          setError(data.error || `Failed to ${action}`);
        }
      } catch (err) {
        setError('Network error');
      }
      setMarking(false);
    }, (err) => {
      console.error(err);
      setError(`Location error: ${err.message}. (Ensure you are on HTTPS or localhost)`);
      setMarking(false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  if (loading) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) return null;

  // Employee View
  if (user.role === 'employee') {
    const todayRecord = attendanceData?.find(a => a.date === todayDate);
    const isCheckedIn = !!todayRecord;
    const isCheckedOut = isCheckedIn && !!todayRecord.checkOutTime;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem' }}>📅 Daily Attendance</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Location-enforced attendance tracking.</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: isCheckedOut ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          
          {error && <div style={{ background: 'rgba(255,59,59,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--rounded-md)', maxWidth: '400px' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {!isCheckedIn ? (
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction('checkIn')}
                disabled={marking}
                style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
              >
                {marking ? 'Checking In...' : '📍 Check In'}
              </button>
            ) : !isCheckedOut ? (
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAction('checkOut')}
                disabled={marking}
                style={{ fontSize: '1.1rem', padding: '1rem 2rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
              >
                {marking ? 'Checking Out...' : '📍 Check Out'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem' }}>
                ✓ You have completed your shift today
              </div>
            )}
          </div>

          {isCheckedIn && (
             <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
               <div><strong>Check-In:</strong> {new Date(todayRecord.checkInTime).toLocaleTimeString()}</div>
               {isCheckedOut && <div><strong>Check-Out:</strong> {new Date(todayRecord.checkOutTime).toLocaleTimeString()}</div>}
             </div>
          )}
        </div>

        <div>
          <h3 style={{ margin: '0 0 1rem 0' }}>Attendance History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attendanceData?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No attendance records found.</p>
            ) : (
              attendanceData?.map((record) => (
                <div key={record._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <span style={{ fontWeight: '500', display: 'block' }}>{new Date(record.date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      In: {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} | Out: {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                    </span>
                  </div>
                  <span style={{ 
                    color: record.status === 'present' ? 'var(--success)' : record.status === 'left_early' ? 'var(--warning)' : 'var(--danger)', 
                    fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', padding: '0.3rem 0.6rem', 
                    background: record.status === 'present' ? 'rgba(0,255,136,0.1)' : record.status === 'left_early' ? 'rgba(255,170,0,0.1)' : 'rgba(255,59,59,0.1)', 
                    borderRadius: 'var(--rounded-full)' 
                  }}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin / Head View
  if (user.role === 'head') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem' }}>📅 Today's Attendance</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {new Date(todayDate || new Date()).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {error && <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {attendanceData?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No employees found in the organization.</p>
          ) : (
            attendanceData?.map((record) => {
              const emp = record.user;
              const isPresent = record.present;
              return (
                <div key={emp._id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '1rem', 
                  background: isPresent ? 'rgba(0,255,136,0.03)' : 'rgba(255,59,59,0.03)', 
                  borderRadius: 'var(--rounded-md)', 
                  border: `1px solid ${isPresent ? 'rgba(0,255,136,0.15)' : 'rgba(255,59,59,0.15)'}` 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-full)', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600' }}>{emp.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.email}</p>
                      {isPresent && (
                        <div style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div>
                            In: {new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            {record.checkInLocation?.latitude && (
                              <a href={`https://maps.google.com/?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}`} target="_blank" style={{color: 'var(--secondary-accent)', marginLeft: '0.5rem', textDecoration: 'underline', fontWeight: 'bold'}}>
                                📍 Map
                              </a>
                            )}
                          </div>
                          {record.checkOutTime && (
                            <div>
                              Out: {new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {record.checkOutLocation?.latitude && (
                                <a href={`https://maps.google.com/?q=${record.checkOutLocation.latitude},${record.checkOutLocation.longitude}`} target="_blank" style={{color: 'var(--secondary-accent)', marginLeft: '0.5rem', textDecoration: 'underline', fontWeight: 'bold'}}>
                                  📍 Map
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span style={{ 
                    color: record.status === 'present' ? 'var(--success)' : record.status === 'left_early' ? 'var(--warning)' : 'var(--danger)', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    fontSize: '0.75rem', 
                    padding: '0.4rem 0.8rem', 
                    background: record.status === 'present' ? 'rgba(0,255,136,0.1)' : record.status === 'left_early' ? 'rgba(255,170,0,0.1)' : 'rgba(255,59,59,0.1)', 
                    borderRadius: 'var(--rounded-full)' 
                  }}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return null;
}
