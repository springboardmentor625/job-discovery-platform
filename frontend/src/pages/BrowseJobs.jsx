import { useEffect, useState } from "react";
import { Search, MapPin, Briefcase, Users, SlidersHorizontal, ChevronLeft, ChevronRight, X, Bookmark, Heart } from "lucide-react";
import { fetchJobs, submitSwipe } from "../services/api";
import Avatar from "../components/Avatar";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const COMPANY_TYPES = [{ value: "", label: "All companies" }, { value: "mnc", label: "MNC" }, { value: "startup", label: "Startup" }, { value: "new_startup", label: "Newly founded" }, { value: "unspecified", label: "Not specified" }];
const JOB_TYPES = [{ value: "", label: "All types" }, { value: "full_time", label: "Full-time" }, { value: "internship", label: "Internship" }, { value: "remote", label: "Remote" }];
const EXPERIENCE_LEVELS = [{ value: "", label: "All levels" }, { value: "fresher", label: "Fresher" }, { value: "mid", label: "Mid-level" }, { value: "senior", label: "Senior" }];
const COMPETITION_STYLES = { low: "bg-green-50 text-green-700", medium: "bg-amber-50 text-amber-700", high: "bg-red-50 text-red-700" };
const ACTION_LABELS = { left: "Skipped", save: "Saved", right: "Interested" };
const ACTION_STYLES = { left: "bg-gray-100 text-muted", save: "bg-amber-50 text-amber-700", right: "bg-violet-50 text-violet-700" };
const selectCls = "px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600";

export default function BrowseJobs() {
  const [filters, setFilters] = useState({ q: "", company_type: "", job_type: "", experience_level: "", location: "", salary_min: "", recently_posted: false, low_competition: false });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [actionState, setActionState] = useState({}); // { [jobId]: "left" | "save" | "right" | "pending" }

  const load = (pageToLoad = 1) => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== false));
    if (params.recently_posted) params.recently_posted = "true";
    if (params.low_competition) params.low_competition = "true";
    params.page = pageToLoad;
    fetchJobs(params)
      .then(({ data }) => {
        setJobs(data.results || []);
        setTotalCount(data.count || 0);
        setHasNext(Boolean(data.next));
        setHasPrevious(Boolean(data.previous));
        setPage(pageToLoad);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => load(1), []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({ ...filters, [name]: type === "checkbox" ? checked : value });
  };
  const handleSubmit = (e) => { e.preventDefault(); load(1); };

  const handleAction = async (jobId, direction) => {
    setActionState((prev) => ({ ...prev, [jobId]: "pending" }));
    try {
      await submitSwipe(jobId, direction);
      setActionState((prev) => ({ ...prev, [jobId]: direction }));
    } catch {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
    }
  };

  const pageSize = jobs.length > 0 ? jobs.length : 20;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="px-8 sm:px-12 py-12">
      <h1 className="font-display text-3xl font-bold text-ink mb-1">Browse jobs</h1>
      <p className="text-muted mb-6">Search and filter every open posting.</p>

      <form onSubmit={handleSubmit} className="border border-line rounded-xl bg-white p-5 mb-8 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" value={filters.q} onChange={handleChange} placeholder="Search title, company, description" className="w-full pl-9 pr-3.5 py-2.5 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
        </div>

        <button
          type="button"
          onClick={() => setShowMoreFilters((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-violet-600 transition-colors"
        >
          <SlidersHorizontal size={14} />
          {showMoreFilters ? "Fewer filters" : "More filters"}
        </button>

        {showMoreFilters && (
          <div className="grid sm:grid-cols-3 gap-3 pt-1 border-t border-line">
            <select name="company_type" value={filters.company_type} onChange={handleChange} className={`${selectCls} mt-3`}>{COMPANY_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <select name="job_type" value={filters.job_type} onChange={handleChange} className={`${selectCls} mt-3`}>{JOB_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <select name="experience_level" value={filters.experience_level} onChange={handleChange} className={`${selectCls} mt-3`}>{EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <input name="location" value={filters.location} onChange={handleChange} placeholder="Location" className={selectCls} />
            <input name="salary_min" value={filters.salary_min} onChange={handleChange} placeholder="Min salary" type="number" className={selectCls} />
            <div />
            <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="recently_posted" checked={filters.recently_posted} onChange={handleChange} />Recently posted</label>
            <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="low_competition" checked={filters.low_competition} onChange={handleChange} />Low competition</label>
          </div>
        )}

        <button type="submit" className="px-4 py-2 rounded-full bg-ink text-white text-sm font-semibold hover:bg-ink/90 transition-colors">Apply filters</button>
      </form>

      {loading ? (
        <SkeletonList count={4} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Search} title="No jobs match those filters" description="Try widening your search criteria." />
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {jobs.map((job) => {
              const currentAction = actionState[job.id];
              const isPending = currentAction === "pending";
              return (
                <div key={job.id} className="bg-white border border-line rounded-xl p-4 hover:border-violet-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar name={job.company} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-ink truncate" title={job.title}>{job.title}</h3>
                          <p className="text-sm text-muted truncate" title={job.company}>{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {currentAction && currentAction !== "pending" && (
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ACTION_STYLES[currentAction]}`}>
                              {ACTION_LABELS[currentAction]}
                            </span>
                          )}
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${COMPETITION_STYLES[job.competition_level] || "bg-gray-50 text-muted"}`}>
                            {job.competition_level} competition
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-ink/70 my-2.5 line-clamp-3">{job.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {job.skills_required.map((skill) => <span key={skill} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full capitalize">{skill}</span>)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location || "Not specified"}</span>
                          <span className="flex items-center gap-1 capitalize"><Briefcase size={12} /> {job.job_type.replace("_", " ")}</span>
                          <span className="capitalize">{job.company_type.replace("_", " ")}</span>
                          <span className="capitalize">{job.experience_level}</span>
                          <span className="flex items-center gap-1"><Users size={12} /> {job.applicant_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAction(job.id, "left")}
                            disabled={isPending}
                            title="Skip"
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${currentAction === "left" ? "bg-gray-100 text-ink" : "text-muted hover:text-ink hover:bg-paper"}`}
                          >
                            <X size={15} />
                          </button>
                          <button
                            onClick={() => handleAction(job.id, "save")}
                            disabled={isPending}
                            title="Save"
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${currentAction === "save" ? "bg-amber-50 text-amber-600" : "text-muted hover:text-amber-600 hover:bg-amber-50"}`}
                          >
                            <Bookmark size={15} />
                          </button>
                          <button
                            onClick={() => handleAction(job.id, "right")}
                            disabled={isPending}
                            title="Interested"
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${currentAction === "right" ? "bg-violet-50 text-violet-600" : "text-muted hover:text-violet-600 hover:bg-violet-50"}`}
                          >
                            <Heart size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing {rangeStart}-{rangeEnd} of {totalCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={!hasPrevious}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-line text-sm text-ink hover:border-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={!hasNext}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-line text-sm text-ink hover:border-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
