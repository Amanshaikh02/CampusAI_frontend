import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { User, Bell, Shield, Palette, Link2, Save, CheckCircle2 } from 'lucide-react';
import { DEPARTMENT_OPTIONS } from '../../constants/departments';

export default function TeacherSettings({ currentUser, setCurrentUser }) {
  const [tab, setTab] = useState('Account');

  // Account State
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(
    DEPARTMENT_OPTIONS.includes(currentUser?.department) ? currentUser.department : 'AIML'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Preference states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [theme, setTheme] = useState('Light');

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Faculty name is required.');
      setSuccess('');
      return;
    }
    if (!email.trim()) {
      setError('Faculty email is required.');
      setSuccess('');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      setSuccess('');
      return;
    }

    if (setCurrentUser) {
      const updatedUser = {
        ...currentUser,
        name: name.trim(),
        username: username.trim() || currentUser?.username,
        email: email.trim(),
        department
      };
      delete updatedUser.password;
      setCurrentUser(updatedUser);
    }

    setError('');
    setSuccess('Faculty profile and settings updated successfully!');
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSuccess('Faculty preferences saved successfully!');
  };

  return (
    <Layout role="teacher" currentUser={currentUser}>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your faculty account preferences and course notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Nav */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-sm space-y-1 h-fit">
          {[
            { name: 'Account', icon: User },
            { name: 'Notifications', icon: Bell },
            { name: 'Privacy & Security', icon: Shield },
            { name: 'Appearance', icon: Palette },
            { name: 'Linked Apps', icon: Link2 }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setTab(item.name);
                  setSuccess('');
                  setError('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  tab === item.name
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={16} className={tab === item.name ? 'text-indigo-600' : 'text-gray-400'} />
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Form Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm">
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {tab === 'Account' && (
            <form onSubmit={handleSaveAccount} noValidate>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Faculty Account Details</h2>
                <p className="text-xs text-gray-500 mt-1">Update your name, email, department, and credentials.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none ${
                      error ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                  >
                    {DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <Save size={15} /> Save Faculty Account
                </button>
              </div>
            </form>
          )}

          {tab === 'Notifications' && (
            <form onSubmit={handleSavePreferences}>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Faculty Notification Preferences</h2>
                <p className="text-xs text-gray-500 mt-1">Configure email alerts for student submissions and announcements.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Department Email Alerts</h4>
                    <p className="text-[11px] text-gray-500">Receive departmental circulars via email.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Assignment Submission Alerts</h4>
                    <p className="text-[11px] text-gray-500">Get notified when students submit assignments.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignmentAlerts}
                    onChange={(e) => setAssignmentAlerts(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <Save size={15} /> Save Notification Preferences
                </button>
              </div>
            </form>
          )}

          {tab === 'Privacy & Security' && (
            <form onSubmit={handleSavePreferences}>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
                <p className="text-xs text-gray-500 mt-1">Manage visibility settings for your faculty profile.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Faculty Directory Visibility</h4>
                    <p className="text-[11px] text-gray-500">Show your profile in student directory.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileVisible}
                    onChange={(e) => setProfileVisible(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <Save size={15} /> Save Privacy Settings
                </button>
              </div>
            </form>
          )}

          {tab === 'Appearance' && (
            <form onSubmit={handleSavePreferences}>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                <p className="text-xs text-gray-500 mt-1">Customize your faculty dashboard theme.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {['Light', 'Dark', 'System'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTheme(m)}
                    className={`p-4 rounded-xl border text-xs font-bold text-center transition-all ${
                      theme === m
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {m} Mode
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <Save size={15} /> Apply Theme
                </button>
              </div>
            </form>
          )}

          {tab === 'Linked Apps' && (
            <form onSubmit={handleSavePreferences}>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Linked Applications</h2>
                <p className="text-xs text-gray-500 mt-1">Connect third-party teaching tools.</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Google Classroom / Workspace</h4>
                  <p className="text-[11px] text-gray-500">Sync assignments and rosters.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">Connected</span>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <Save size={15} /> Save Integrations
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
