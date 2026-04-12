import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, authService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAdmin, permissions } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
  });
  const [newUserData, setNewUserData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'user',
    is_staff: false,
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [createUserMsg, setCreateUserMsg] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }
    fetchUsers();
    // eslint-disable-next-line
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await authService.updateProfile(profileData);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileMsg(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg('');

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordMsg('New passwords do not match');
      return;
    }

    try {
      await authService.changePassword(
        passwordData.old_password,
        passwordData.new_password,
        passwordData.new_password_confirm
      );
      setPasswordMsg('Password changed successfully');
      setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      setPasswordMsg(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserMsg('');

    if (newUserData.password !== newUserData.password_confirm) {
      setCreateUserMsg('Passwords do not match');
      return;
    }

    try {
      await userService.createUser({
        email: newUserData.email,
        username: newUserData.username,
        password: newUserData.password,
        password_confirm: newUserData.password_confirm,
        first_name: newUserData.first_name,
        last_name: newUserData.last_name,
        role: newUserData.role,
        is_staff: newUserData.is_staff,
      });
      setCreateUserMsg('User created successfully');
      setNewUserData({
        email: '', username: '', password: '', password_confirm: '',
        first_name: '', last_name: '', role: 'user', is_staff: false
      });
      fetchUsers();
      setTimeout(() => setShowCreateUser(false), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        // Handle field-level errors
        const messages = [];
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            messages.push(`${key}: ${value.join(', ')}`);
          } else {
            messages.push(`${key}: ${value}`);
          }
        }
        setCreateUserMsg(messages.join(' | '));
      } else {
        setCreateUserMsg('Failed to create user');
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await userService.toggleUserActive(userId, isActive);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openProfile = () => {
    setProfileData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
    });
    setShowProfile(true);
  };

  const closeProfile = () => {
    setShowProfile(false);
    setShowCreateUser(false);
    setProfileMsg('');
    setPasswordMsg('');
    setCreateUserMsg('');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'guest': return 'role-guest';
      default: return 'role-user';
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>User Management</h1>
          <span className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
            {user?.role?.toUpperCase() || 'USER'}
          </span>
        </div>
        <div className="header-actions">
          <span className="user-greeting">
            Hello, {user?.username || user?.email}
            {isAdmin && <span className="admin-indicator"> (Admin)</span>}
          </span>
          {isAdmin && (
            <button onClick={() => setShowCreateUser(true)} className="btn btn-primary">
              + Create User
            </button>
          )}
          <button onClick={openProfile} className="btn btn-secondary">Profile</button>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <section className="users-section">
          <h2>Users</h2>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Staff</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={!u.is_active ? 'user-inactive' : ''}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="role-select"
                          disabled={u.id === user?.id}
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                          <option value="guest">Guest</option>
                        </select>
                      ) : (
                        <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {isAdmin && u.id !== user?.id ? (
                        <button
                          className={`btn-status ${u.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(u.id, !u.is_active)}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      ) : (
                        <span className={u.is_active ? 'status-active' : 'status-inactive'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td>{u.is_staff ? 'Yes' : 'No'}</td>
                    {isAdmin && (
                      <td>
                        {u.id !== user?.id && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isAdmin && (
          <section className="permissions-section">
            <h2>Your Permissions</h2>
            <div className="permissions-list">
              {permissions.map((perm) => (
                <span key={perm} className="permission-tag">{perm}</span>
              ))}
            </div>
          </section>
        )}
      </main>

      {(showProfile || showCreateUser) && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showCreateUser ? 'Create New User' : 'Profile Settings'}</h2>
              <button className="close-btn" onClick={closeProfile}>&times;</button>
            </div>
            <div className="modal-body">
              {showCreateUser ? (
                <form onSubmit={handleCreateUser} className="create-user-form">
                  {createUserMsg && (
                    <div className={`form-message ${createUserMsg.includes('success') ? 'success' : 'error'}`}>
                      {createUserMsg}
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Username *</label>
                      <input
                        type="text"
                        value={newUserData.username}
                        onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={newUserData.first_name}
                        onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={newUserData.last_name}
                        onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        value={newUserData.password_confirm}
                        onChange={(e) => setNewUserData({ ...newUserData, password_confirm: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={newUserData.role}
                        onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newUserData.is_staff}
                          onChange={(e) => setNewUserData({ ...newUserData, is_staff: e.target.checked })}
                        />
                        Is Staff
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">Create User</button>
                </form>
              ) : (
                <>
                  <form onSubmit={handleProfileUpdate} className="profile-form">
                    <h3>Update Profile</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                    {profileMsg && <div className="form-message">{profileMsg}</div>}
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </form>

                  <hr />

                  <form onSubmit={handlePasswordChange} className="password-form">
                    <h3>Change Password</h3>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password_confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
                        required
                      />
                    </div>
                    {passwordMsg && (
                      <div className={`form-message ${passwordMsg.includes('success') ? 'success' : 'error'}`}>
                        {passwordMsg}
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary">Change Password</button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;