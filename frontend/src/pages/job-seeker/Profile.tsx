import { useState, useEffect } from 'react';
import { MapPin, Mail, Loader2, Save } from 'lucide-react';
import { profilesApi, type ProfileUpdate } from '../../api/profiles.api';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form state
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profilesApi.getMyProfile();
        setProfile(data);
        setHeadline(data.headline || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setSkillsStr(data.skills ? data.skills.join(', ') : '');
        setExperienceYears(data.experience_years || 0);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const updateData: ProfileUpdate = {
        headline,
        bio,
        location,
        skills,
        experience_years: experienceYears
      };
      const updated = await profilesApi.updateMyProfile(updateData);
      setProfile(updated);
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-slate-500 mt-1">Manage your professional information and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Basic Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              {user?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user?.first_name} {user?.last_name}</h2>
            <p className="text-sm text-slate-500">{headline || 'Add a headline'}</p>
            
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              {location && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-900">Edit Details</h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              {message && (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Professional Headline</label>
                <input 
                  type="text" 
                  value={headline} 
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">About Me (Bio)</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="Tell recruiters about yourself..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Years of Experience</label>
                  <input 
                    type="number" 
                    min="0"
                    value={experienceYears} 
                    onChange={e => setExperienceYears(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Skills (comma separated)</label>
                <input 
                  type="text" 
                  value={skillsStr} 
                  onChange={e => setSkillsStr(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="React, TypeScript, Node.js..."
                />
                <p className="text-xs text-slate-500 mt-2">These skills are used to match you with jobs.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
