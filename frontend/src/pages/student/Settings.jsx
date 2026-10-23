import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { User, Bell, Shield, Palette, Link2, Save, CheckCircle2 } from 'lucide-react';
import { DEPARTMENT_OPTIONS } from '../../constants/departments';

export default function StudentSettings({ currentUser, setCurrentUser }) {
  const [tab, setTab] = useState('Account');

  // Account State
  const [name, setName] = useState(currentUser?.name || '');
  const [enrollment, setEnrollment] = useState(currentUser?.enrollment || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [course, setCourse] = useState(currentUser?.course || 'MCA');
  const [semester, setSemester] = useState(currentUser?.semester || 'Semester 1');
  const [department, setDepartment] = useState(
    DEPARTMENT_OPTIONS.includes(currentUser?.department) ? currentUser.department : 'AIML'
  );
  const [language, setLanguage] = useState('English (US)');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Notifications State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);

  // Privacy State
  const [profileVisible, setProfileVisible] = useState(true);
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);

  // Appearance State
  const [theme, setTheme] = useState('Light');

  // Linked Apps State
  const [googleLinked, setGoogleLinked] = useState(true);
  const [githubLinked, setGithubLinked] = useState(false);

  const handleSaveAccount = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim()) {
      newErrors.email = 'Primary email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!course) newErrors.course = 'Please select a course.';
    if (!semester) newErrors.semester = 'Please select a semester.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccess('');
      return;
    }

    if (setCurrentUser) {
      const updatedUser = {
        ...currentUser,
        name: name.trim(),
        enrollment: enrollment.trim(),
        email: email.trim(),
        course,
        semester,
        department
      };
      delete updatedUser.password;
      setCurrentUser(updatedUser);
    }

    setErrors({});
    setSuccess('Student profile and settings updated successfully!');
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSuccess('Preferences saved successfully!');
  };

  return (
    <Layout role="student" currentUser={currentUser}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your student profile, notifications, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sub-Nav */}
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
                  setErrors({});
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

        {/* Right Form Panel */}
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
                <h2 className="text-xl font-bold text-gray-900">Student Account & Profile Details</h2>
                <p className="text-xs text-gray-500 mt-1">Update your registered name, email, course, and semester.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500 font-medium mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Enrollment Number</label>
                  <input
                    type="text"
                    value={enrollment}
                    onChange={(e) => setEnrollment(e.target.value)}
                    placeholder="e.g. MCA001"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Course *</label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                    >
                      <option value="AIML">AIML</option>
                      <option value="Cyber Security">Cyber Security</option>
                      <option value="All Departments">All Departments</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Semester *</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
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

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Save size={15} /> Save Changes
                </button>
              </div>
            </form>
          )}

          {tab === 'Notifications' && (
            <form onSubmit={handleSavePreferences}>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-xs text-gray-500 mt-1">Configure alerts for course updates and assignments.</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Email Notifications</h4>
                    <p className="text-[11px] text-gray-500">Receive important announcements via email.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Assignment Reminders</h4>
                    <p className="text-[11px] text-gray-500">Get reminders before assignment due dates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignmentReminders}
                    onChange={(e) => setAssignmentReminders(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Announcement Alerts</h4>
                    <p className="text-[11px] text-gray-500">Instant alerts for new campus announcements.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={announcementAlerts}
                    onChange={(e) => setAnnouncementAlerts(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <Save size={15} /> Save Notification Settings
                </button>
              </div>
            </form>
          )}

          {tab === 'Privacy & Security' && (
            <form onSubmit={handleSavePreferences}>
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
                <p className="text-xs text-gray-500 mt-1">Manage visibility settings for your student profile.</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Profile Visibility</h4>
                    <p className="text-[11px] text-gray-500">Allow faculty and peers to view your academic profile.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileVisible}
                    onChange={(e) => setProfileVisible(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Public Email</h4>
                    <p className="text-[11px] text-gray-500">Show email address on class directory.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEmailPublicly}
                    onChange={(e) => setShowEmailPublicly(e.target.checked)}
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
                <p className="text-xs text-gray-500 mt-1">Customize visual theme and interface preferences.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-semibold text-gray-700">Theme Mode</label>
                <div className="grid grid-cols-3 gap-4">
                  {['Light', 'Dark', 'System'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTheme(mode)}
                      className={`p-4 rounded-xl border text-xs font-bold text-center transition-all ${
                        theme === mode
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {mode} Mode
                    </button>
                  ))}
                </div>
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
                <p className="text-xs text-gray-500 mt-1">Connect third-party academic accounts.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Google Workspace</h4>
                    <p className="text-[11px] text-gray-500">Connected as {email || 'student@college.edu'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleLinked(!googleLinked)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      googleLinked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {googleLinked ? 'Connected' : 'Connect'}
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">GitHub Education</h4>
                    <p className="text-[11px] text-gray-500">Repository integration for assignments.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGithubLinked(!githubLinked)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      githubLinked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {githubLinked ? 'Connected' : 'Connect'}
                  </button>
                </div>
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
