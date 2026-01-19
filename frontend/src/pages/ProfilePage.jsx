import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit2, Crown, MessageCircle, Image, Heart, LogOut } from 'lucide-react';
import { BaseLayout } from '../components/layout';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const getToken = () => localStorage.getItem('token');
  const getSessionId = () => localStorage.getItem('session_id');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = getToken();
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      const response = await fetch('/api/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': getSessionId() || '',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/signin');
          return;
        }
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setUser(data.user);
      setFormData({
        username: data.user.username,
        email: data.user.email,
        password: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch('/api/auth/profile/update/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser({ ...user, ...data.user });
      setFormData({ ...formData, password: '' });
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/auth/profile/delete/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear all local data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('session_id');
      navigate('/');
    } catch (err) {
      setError(err.message);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
    navigate('/');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
    { id: 'subscription', label: 'Subscription' },
  ];

  if (loading) {
    return (
      <BaseLayout>
        <div className="profile-page">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </BaseLayout>
    );
  }

  if (!user) {
    return (
      <BaseLayout>
        <div className="profile-page">
          <div className="profile-error">
            <p>Please sign in to view your profile</p>
            <button onClick={() => navigate('/signin')} className="auth-submit-btn">
              Sign In
            </button>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-cover"></div>
          <div className="profile-info">
            <div className="avatar-container">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=120&background=7c3aed&color=fff`}
                alt={user.username}
                className="profile-avatar"
              />
              <button className="avatar-edit-btn">
                <Camera size={16} />
              </button>
            </div>
            <div className="profile-details">
              <div className="profile-name-row">
                <h1>{user.username}</h1>
              </div>
              <p className="profile-email">{user.email}</p>
              <p className="profile-joined">Member since {user.dateJoined}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <MessageCircle size={24} />
            <div className="stat-info">
              <span className="stat-value">{user.stats?.chats || 0}</span>
              <span className="stat-label">Chats</span>
            </div>
          </div>
          <div className="stat-card">
            <Image size={24} />
            <div className="stat-info">
              <span className="stat-value">{user.stats?.characters || 0}</span>
              <span className="stat-label">Characters</span>
            </div>
          </div>
          <div className="stat-card">
            <Image size={24} />
            <div className="stat-info">
              <span className="stat-value">{user.stats?.images || 0}</span>
              <span className="stat-label">Images</span>
            </div>
          </div>
          <div className="stat-card">
            <Heart size={24} />
            <div className="stat-info">
              <span className="stat-value">{user.stats?.favorites || 0}</span>
              <span className="stat-label">Favorites</span>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="profile-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="section-card">
                <h3>Recent Activity</h3>
                <div className="empty-state">
                  <p>No recent activity to show</p>
                </div>
              </div>
              <div className="section-card">
                <h3>Your Characters</h3>
                <div className="empty-state">
                  <p>You haven't created any characters yet</p>
                  <button className="create-btn">Create Character</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <div className="section-card">
                <h3>Account Settings</h3>
                {error && <div className="settings-error">{error}</div>}
                {success && <div className="settings-success">{success}</div>}
                <form className="settings-form" onSubmit={handleSave}>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
              <div className="section-card danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back.</p>
                {!showDeleteConfirm ? (
                  <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p className="delete-warning">Are you sure? This action cannot be undone.</p>
                    <div className="delete-actions">
                      <button className="delete-btn" onClick={handleDeleteAccount}>
                        Yes, Delete My Account
                      </button>
                      <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="subscription-section">
              <div className="section-card">
                <h3>Current Plan</h3>
                <div className="current-plan">
                  <span className="plan-name">Free</span>
                  <span className="plan-status">Active</span>
                </div>
                <p className="plan-description">
                  Basic access with limited features
                </p>
              </div>
              <div className="section-card premium-card">
                <div className="premium-header">
                  <Crown size={32} />
                  <h3>Upgrade to Premium</h3>
                </div>
                <ul className="premium-features">
                  <li>Unlimited chats</li>
                  <li>Create unlimited characters</li>
                  <li>Priority support</li>
                  <li>Exclusive features</li>
                </ul>
                <button className="upgrade-btn">
                  Upgrade Now - $9.99/month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
};

export default ProfilePage;
