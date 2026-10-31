import React, { useState, useEffect } from 'react';
import { 
  UserCheck, ShieldCheck, Key, Lock, CheckCircle2, 
  AlertTriangle, Save, User, Mail, Shield, Phone
} from 'lucide-react';
import { apiUrl } from '../../config/api';
import ProfilePictureUploader from '../auth/ProfilePictureUploader';

export default function AdminProfilePage() {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('agrilens_user');
    const avatar = localStorage.getItem('agrilens_user_avatar');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return { ...u, avatarUrl: u.avatarUrl || avatar || null };
      } catch (e) {}
    }
    return {
      name: 'System Administrator',
      email: 'sysadmin@agrilens.gov.rw',
      phone: '+250 788 123 456',
      role: 'PLATFORM_ADMIN',
      roleName: 'Platform Administrator',
      avatarUrl: avatar || null
    };
  });

  const [profileForm, setProfileForm] = useState({
    name: adminUser.name || 'System Administrator',
    phone: adminUser.phone || '+250 788 123 456'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      const saved = localStorage.getItem('agrilens_user');
      const avatar = localStorage.getItem('agrilens_user_avatar');
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setAdminUser({ ...u, avatarUrl: u.avatarUrl || avatar || null });
        } catch (e) {}
      }
    };
    window.addEventListener('agrilens_user_updated', syncUser);
    return () => window.removeEventListener('agrilens_user_updated', syncUser);
  }, []);

  const handleAvatarUpdated = (newAvatarUrl: string | null) => {
    setAdminUser((prev: any) => ({ ...prev, avatarUrl: newAvatarUrl }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setFeedback(null);

    try {
      const updatedUser = {
        ...adminUser,
        name: profileForm.name,
        phone: profileForm.phone
      };

      localStorage.setItem('agrilens_user', JSON.stringify(updatedUser));
      setAdminUser(updatedUser);

      try {
        await fetch(apiUrl('auth/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminUser.email,
            fullName: profileForm.name,
            phone: profileForm.phone
          })
        });
      } catch (beErr) {
        console.warn('Backend profile update deferred:', beErr);
      }

      window.dispatchEvent(new Event('agrilens_user_updated'));
      setFeedback({ type: 'success', message: 'Profile details updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setUpdatingPassword(true);
    setFeedback(null);
    try {
      await fetch(apiUrl('auth/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          password: passwordForm.newPassword
        })
      });

      setFeedback({ type: 'success', message: 'Administrator credentials updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update credentials.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const initials = adminUser.name 
    ? adminUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
    : 'SA';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Identity & Security Settings</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Administrator Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Manage your personal profile photo, identity credentials, contact information, and account authentication parameters.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs' 
            : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* 2. Profile Photo & Identity Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Profile Photo & Identity
          </h3>
          <span className="text-xs text-slate-400">
            Visible across platform sidebars & audit ledger
          </span>
        </div>

        {/* Dynamic Photo Uploader */}
        <ProfilePictureUploader
          currentAvatar={adminUser.avatarUrl || null}
          userName={adminUser.name}
          userEmail={adminUser.email}
          initials={initials}
          onAvatarUpdated={handleAvatarUpdated}
        />

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            👑 Platform Administrator
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            System-Wide Authority
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Root Ledger Auditor
          </span>
        </div>
      </div>

      {/* 3. Account Details Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Account Contact Details</span>
        </h3>

        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
            <input
              type="email"
              disabled
              value={adminUser.email}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Government email address managed by platform root administrator.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone Number</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+250 788 000 000"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updatingProfile ? 'Saving Changes...' : 'Save Contact Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Change Password Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-600" />
          <span>Update Account Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updatingPassword ? 'Updating...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
