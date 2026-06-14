import { useState } from 'react';
import { Lock, Save, User, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';

const ROLE_VARIANT = { Admin: 'purple', Recruiter: 'info', Viewer: 'default' };

const Profile = () => {
  const { user } = useAuth();
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
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account and security settings" />

      {/* Profile card */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">{user?.name}</h2>
            <p className="text-sm text-stone-500 mb-1">{user?.email}</p>
            <Badge variant={ROLE_VARIANT[user?.role] || 'default'}>
              <Shield className="w-3 h-3" />
              {user?.role}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-stone-50">
            <User className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <div>
              <p className="text-2xs text-stone-400 uppercase tracking-wide font-semibold">Name</p>
              <p className="text-sm text-stone-800 font-medium">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-stone-50">
            <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <div>
              <p className="text-2xs text-stone-400 uppercase tracking-wide font-semibold">Email</p>
              <p className="text-sm text-stone-800 font-medium truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-stone-500" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
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
  );
};

export default Profile;
