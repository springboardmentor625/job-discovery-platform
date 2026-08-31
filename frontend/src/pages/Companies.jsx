import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Building,
  Search,
  MapPin,
  Briefcase,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";

function Companies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/companies/");
      setCompanies(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load companies at this time. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const searchText = search.toLowerCase();
    return (
      company.company_name?.toLowerCase().includes(searchText) ||
      company.industry?.toLowerCase().includes(searchText) ||
      company.company_type?.toLowerCase().includes(searchText) ||
      company.headquarters?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Hiring Partners & Startups
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Explore Top Hiring Companies
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            Discover tech organizations actively seeking talent through SwipeX with transparent company profiles and open opportunities.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name, industry, or location..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-xl text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 px-2 text-xs text-slate-400">
            <span>Showing {filteredCompanies.length} companies</span>
            <span>Total registered: {companies.length}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading companies...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-md mx-auto text-center py-16 bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-300 text-sm mb-4">{error}</p>
            <button
              onClick={fetchCompanies}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Company Grid */}
        {!loading && !error && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <motion.div
                key={company.company_id}
                whileHover={{ y: -4 }}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all group backdrop-blur-sm"
              >
                <div>
                  {/* Top Row: Icon & Type Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/20">
                      {company.company_name ? company.company_name.charAt(0).toUpperCase() : "C"}
                    </div>
                    {company.company_type && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {company.company_type}
                      </span>
                    )}
                  </div>

                  {/* Company Name */}
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {company.company_name}
                  </h2>

                  {/* Industry & Location */}
                  <div className="space-y-2 mt-3 text-xs text-slate-300">
                    {company.industry && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{company.industry}</span>
                      </div>
                    )}
                    {company.headquarters && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{company.headquarters}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-slate-400 text-xs mt-4 line-clamp-3 leading-relaxed">
                      {company.description}
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-5 mt-5 border-t border-slate-800">
                  {company.website && (
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => navigate("/jobs")}
                    className="flex-1 py-2 px-4 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>View Jobs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCompanies.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Companies Found</h3>
            <p className="text-slate-400 text-xs mb-6">
              No hiring companies match your search criteria. Try a different keyword or view all companies.
            </p>
            <button
              onClick={() => setSearch("")}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Companies;