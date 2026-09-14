'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const saveLocation = async (lat, lng) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius: 200
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Company location set successfully!');
        setManualLat(lat);
        setManualLng(lng);
      } else {
        setError(data.error || 'Failed to save location');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition((position) => {
      saveLocation(position.coords.latitude, position.coords.longitude);
    }, (err) => {
      setError(`Location error: ${err.message}. (Ensure you are on HTTPS or localhost)`);
      setLoading(false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    if (!manualLat || !manualLng) {
      setError('Please enter both latitude and longitude.');
      return;
    }
    saveLocation(parseFloat(manualLat), parseFloat(manualLng));
  };

  const [specialization, setSpecialization] = useState('General');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if(data.success && data.data.specialization) {
          setSpecialization(data.data.specialization);
        }
      });
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specialization })
    });
    if(res.ok) setProfileSuccess('Profile updated successfully!');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.75rem' }}>⚙️ Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your profile and organization settings.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>My Profile</h3>
        {profileSuccess && <div style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--rounded-md)' }}>{profileSuccess}</div>}
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="input-label">Role Specialization</label>
            <select className="input-field" value={specialization} onChange={e => setSpecialization(e.target.value)}>
              <option value="General">General</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="IT Support">IT Support</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Update Profile</button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Company Location</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            To enforce location-based attendance, you need to set the company's GPS coordinates. Employees will only be able to check in if they are within a 200-meter radius of this location.
          </p>
        </div>
        
        {error && <div style={{ background: 'rgba(255,59,59,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--rounded-md)' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--rounded-md)' }}>{success}</div>}

        <button 
          className="btn btn-primary" 
          onClick={handleSetLocation}
          disabled={loading}
          style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}
        >
          {loading ? 'Fetching Location...' : '📍 Auto-detect My Location'}
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <hr style={{ flex: 1, borderColor: 'var(--glass-border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR ENTER MANUALLY</span>
          <hr style={{ flex: 1, borderColor: 'var(--glass-border)' }} />
        </div>

        <form onSubmit={handleManualSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Latitude</label>
              <input type="number" step="any" className="input-field" value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="e.g. 40.7128" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Longitude</label>
              <input type="number" step="any" className="input-field" value={manualLng} onChange={e => setManualLng(e.target.value)} placeholder="e.g. -74.0060" />
            </div>
          </div>
          <button 
            type="submit" 
            className="btn btn-secondary" 
            disabled={loading || !manualLat || !manualLng}
            style={{ alignSelf: 'flex-start' }}
          >
            Save Manual Coordinates
          </button>
        </form>
      </div>
    </div>
  );
}
