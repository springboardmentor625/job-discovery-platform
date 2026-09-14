import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, IndianRupee, Send, Loader2 } from 'lucide-react';
import { jobsApi } from '../../api/jobs.api';

export const PostJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    job_title: '',
    job_type: 'Full-time',
    location: '',
    salary_range: '',
    experience_level: 'Mid-Level',
    description: '',
    requirements: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Transform requirements from comma string to array
    const reqsArray = formData.requirements
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      await jobsApi.createJob({
        job_title: formData.job_title,
        job_type: formData.job_type,
        location: formData.location,
        job_description: formData.description,
        required_skills: reqsArray,
        // We will assume experience_level can be mapped or ignored, but it's not strictly in schema.
      });
      navigate('/recruiter/jobs');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post job. Make sure you have created a Company Profile first.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Post a New Job</h1>
        <p className="text-slate-500 mt-1">Create a compelling job listing to attract top talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Job Title *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="job_title"
                required
                value={formData.job_title}
                onChange={handleChange}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Job Type *</label>
            <select
              name="job_type"
              required
              value={formData.job_type}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Experience Level *</label>
            <select
              name="experience_level"
              required
              value={formData.experience_level}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
            >
              <option value="Entry-Level">Entry-Level</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Location *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                placeholder="e.g. New York, NY or Remote"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Salary Range</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                placeholder="e.g. ₹10 LPA - ₹15 LPA"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Job Description *</label>
            <textarea
              name="description"
              required
              rows={6}
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Required Skills *</label>
            <input
              type="text"
              name="requirements"
              required
              value={formData.requirements}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
              placeholder="e.g. React, TypeScript, Node.js (comma separated)"
            />
            <p className="text-xs text-slate-500">Separate multiple skills with commas.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Publish Job Listing
          </button>
        </div>
      </form>
    </div>
  );
};
