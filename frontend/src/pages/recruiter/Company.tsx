import { useState, useEffect } from 'react';
import { Building, Save, Loader2, Globe } from 'lucide-react';
import { companiesApi, type Company as CompanyType } from '../../api/companies.api';
import { useNavigate } from 'react-router-dom';

export const Company = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    company_size: '',
    about: '',
    logo: '',
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await companiesApi.getMyCompany();
        setCompany(data);
        setFormData({
          company_name: data.company_name || '',
          industry: data.industry || '',
          website: data.website || '',
          company_size: data.company_size || '',
          about: data.about || '',
          logo: data.logo || '',
        });
      } catch (err: any) {
        if (err.response?.status !== 404) {
          setError('Failed to load company profile.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompany();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (company) {
        // Update existing
        await companiesApi.updateCompany(company.company_id, formData);
        setSuccess('Company profile updated successfully!');
      } else {
        // Create new
        const newComp = await companiesApi.createCompany(formData);
        setCompany(newComp);
        setSuccess('Company profile created! You can now post jobs.');
        setTimeout(() => navigate('/recruiter/dashboard'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
        <p className="text-slate-500 mt-1">Manage your employer brand and company details.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{error}</div>}
        {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Company Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleChange}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Industry</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
              placeholder="e.g. Technology, Finance"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Company Size</label>
            <select
              name="company_size"
              value={formData.company_size}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Website</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                placeholder="https://acme.com"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">About the Company</label>
            <textarea
              name="about"
              rows={4}
              value={formData.about}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
              placeholder="Tell candidates what makes your company great..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {company ? 'Save Changes' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
};
