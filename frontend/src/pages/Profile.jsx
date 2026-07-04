import { useState } from 'react';
import { Lock, Save, User, Mail, Shield, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { ThemeToggleSwitch } from '../components/ui/ThemeToggle';

const ROLE_VARIANT = { Admin: 'purple', Recruiter: 'info', Viewer: 'default' };

const Profile = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account and security settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column — identity + password (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {initial}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{user?.name}</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">{user?.email}</p>
                <Badge variant={ROLE_VARIANT[user?.role] || 'default'}>
                  <Shield className="w-3 h-3" />
                  {user?.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                <User className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
                <div>
                  <p className="text-2xs text-stone-400 dark:text-stone-500 uppercase tracking-wide font-semibold">Name</p>
                  <p className="text-sm text-stone-800 dark:text-stone-200 font-medium">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                <Mail className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
                <div>
                  <p className="text-2xs text-stone-400 dark:text-stone-500 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-sm text-stone-800 dark:text-stone-200 font-medium truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-5">
              <Lock className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <Input
                label="New Password"
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                hint="Minimum 6 characters"
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                required
                autoComplete="new-password"
              />
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </form>
          </Card>
        </div>

        {/* Right column — preferences (1/3 width on desktop, stacks below on mobile) */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-5">
              <Moon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              Preferences
            </h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Dark mode</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {isDark ? 'Currently on' : 'Currently off'}
                </p>
              </div>
              <ThemeToggleSwitch />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
