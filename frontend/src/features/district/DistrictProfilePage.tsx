import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserCheck, ShieldCheck, Lock, Key, MapPin, CheckCircle2 } from 'lucide-react';
import ProfilePictureUploader from '../auth/ProfilePictureUploader';

export default function DistrictProfilePage() {
  const { districtName } = useOutletContext<{ districtName: string }>();

  const [officerUser, setOfficerUser] = useState(() => {
    const saved = localStorage.getItem('agrilens_user');
    const avatar = localStorage.getItem('agrilens_user_avatar');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return { ...u, avatarUrl: u.avatarUrl || avatar || null };
      } catch (e) {}
    }
    return {
      name: 'Damascene Nkundabagenzi',
      email: 'officer.musanze@minagri.gov.rw',
      phone: '+250 788 567 890',
      role: 'DISTRICT_OFFICER',
      roleName: 'District Agricultural Officer',
      avatarUrl: avatar || null
    };
  });

  useEffect(() => {
    const syncUser = () => {
      const saved = localStorage.getItem('agrilens_user');
      const avatar = localStorage.getItem('agrilens_user_avatar');
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setOfficerUser({ ...u, avatarUrl: u.avatarUrl || avatar || null });
        } catch (e) {}
      }
    };
    window.addEventListener('agrilens_user_updated', syncUser);
    return () => window.removeEventListener('agrilens_user_updated', syncUser);
  }, []);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass !== confirmPass) return;
    setPassSuccess(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
            User Account & Security
          </span>
          <span className="text-xs text-slate-500 font-medium">{districtName} Desk</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View your district authorization credentials, account details, and permitted security controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Account Details Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="mb-4">
              <ProfilePictureUploader
                currentAvatar={officerUser.avatarUrl || null}
                userName={officerUser.name}
                userEmail={officerUser.email}
                initials={officerUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                onAvatarUpdated={(newAvatar) => setOfficerUser((prev: any) => ({ ...prev, avatarUrl: newAvatar }))}
              />
            </div>
            <div className="text-left mb-4 pt-3 border-t border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{officerUser.name}</h2>
              <div className="text-xs text-slate-500 font-medium">{officerUser.roleName || 'District Agricultural Officer'}</div>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
              <div>
                <span className="text-slate-400 block mb-0.5">Official Email:</span>
                <span className="font-semibold text-slate-800 truncate block">{officerUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned District:</span>
                <span className="font-bold text-emerald-900">{districtName} District</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Authorized Level:</span>
                <span className="font-semibold text-slate-700">District & Subordinate Sectors</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Cross-district queries strictly restricted by Section 4.2 policy.</span>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            Update Account Credentials
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            You can change your portal access password. System administrators can also reset initial credentials.
          </p>

          {passSuccess && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Password updated successfully for future sign-ins.
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
                placeholder="Enter new strong password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                required
                placeholder="Re-type new password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
