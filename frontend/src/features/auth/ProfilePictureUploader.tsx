import React, { useRef, useState } from 'react';
import { Camera, Trash2, CheckCircle2, AlertTriangle, UploadCloud } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';
import { apiUrl } from '../../config/api';

interface ProfilePictureUploaderProps {
  currentAvatar: string | null;
  userName: string;
  userEmail: string;
  initials: string;
  onAvatarUpdated: (newAvatarUrl: string | null) => void;
}

export default function ProfilePictureUploader({
  currentAvatar,
  userName,
  userEmail,
  initials,
  onAvatarUpdated
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please select an image file (PNG, JPG, WEBP).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image size exceeds 10MB limit.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      // 1. Compress image to clean, lightweight Data URL
      const compressedDataUrl = await compressImageFile(file, 300, 300, 0.85);

      // 2. Persist in localStorage
      localStorage.setItem('agrilens_user_avatar', compressedDataUrl);
      const savedUserStr = localStorage.getItem('agrilens_user');
      if (savedUserStr) {
        try {
          const userObj = JSON.parse(savedUserStr);
          userObj.avatarUrl = compressedDataUrl;
          localStorage.setItem('agrilens_user', JSON.stringify(userObj));
        } catch (err) {}
      }

      // 3. Persist to backend database
      try {
        await fetch(apiUrl('auth/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, avatarUrl: compressedDataUrl })
        });
      } catch (beErr) {
        console.warn('Backend profile update deferred:', beErr);
      }

      // 4. Notify all layouts (Admin, Data Manager, District sidebars)
      window.dispatchEvent(new Event('agrilens_user_updated'));
      onAvatarUpdated(compressedDataUrl);

      setFeedback({ type: 'success', message: 'Profile picture updated successfully! Visible on your sidebar and identity card.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to process image.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setFeedback(null);

    try {
      localStorage.removeItem('agrilens_user_avatar');
      const savedUserStr = localStorage.getItem('agrilens_user');
      if (savedUserStr) {
        try {
          const userObj = JSON.parse(savedUserStr);
          userObj.avatarUrl = null;
          localStorage.setItem('agrilens_user', JSON.stringify(userObj));
        } catch (err) {}
      }

      try {
        await fetch(apiUrl('auth/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, avatarUrl: null })
        });
      } catch (beErr) {}

      window.dispatchEvent(new Event('agrilens_user_updated'));
      onAvatarUpdated(null);

      setFeedback({ type: 'success', message: 'Profile picture removed. Reverted to standard role avatar.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to remove picture.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Avatar Display */}
        <div className="relative group self-start">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={userName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shadow-emerald-950/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-950/20 border-2 border-emerald-400/40">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors"
            title="Upload new picture"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upload Controls */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>{uploading ? 'Processing Image...' : currentAvatar ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
            </button>

            {currentAvatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            PNG, JPG, WEBP supported. Image is automatically optimized and displayed at the bottom of the navigation sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}
