import MatchStamp from '../ui/MatchStamp';

const typeColors = {
  MNC: 'bg-teal/15 text-teal',
  Startup: 'bg-gold/15 text-gold',
  New: 'bg-coral/15 text-coral',
};

function formatSalary(min, max) {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n}`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

const competitionColors = {
  Low: 'text-teal bg-teal/10 border-teal/20',
  Medium: 'text-gold bg-gold/10 border-gold/20',
  High: 'text-coral bg-coral/10 border-coral/20',
};

export default function JobCard({ job, compact = false }) {
  return (
    <div
      className={`paper-grain bg-dossier text-inkOnPaper rounded-xl shadow-dossier flex flex-col ${
        compact ? 'w-64 p-4' : 'w-full h-full p-6'
      } relative overflow-hidden select-none`}
    >
      <div className="absolute top-3 right-3">
        <MatchStamp percentage={job.match_score ?? 0} size={compact ? 'sm' : 'md'} />
      </div>

      <span
        className={`inline-block w-fit text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded ${
          typeColors[job.company_type] || typeColors.MNC
        }`}
      >
        {job.company_type}
      </span>

      <h3 className={`font-display font-semibold mt-3 ${compact ? 'text-lg' : 'text-2xl'} pr-16`}>
        {job.title}
      </h3>
      <p className="text-sm text-inkOnPaper/70 font-medium">{job.company}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-inkOnPaper/60">
        <span>📍 {job.location}</span>
        <span>{job.job_type}</span>
        <span>{formatSalary(Number(job.salary_min), Number(job.salary_max))}</span>
      </div>

      {!compact && job.description && (
        <p className="mt-4 text-sm text-inkOnPaper/80 leading-relaxed line-clamp-4">
          {job.description}
        </p>
      )}

      {!compact && (
        <div className="mt-4 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wide">
          <span className={`border rounded px-2 py-1 ${competitionColors[job.competition_level] || competitionColors.Medium}`}>
            {job.competition_level || 'Medium'} competition
          </span>
          <span className="text-inkOnPaper/55">
            {job.applicants_count || 0} applicants
          </span>
        </div>
      )}

      {!compact && job.is_early_applicant && (
        <p className="mt-2 text-xs font-medium text-teal">Early applicant advantage</p>
      )}

      {!compact && job.matched_skills?.length > 0 && (
        <p className="mt-2 text-xs text-inkOnPaper/70">
          Matched: {job.matched_skills.join(', ')}
        </p>
      )}

      {Array.isArray(job.required_skills) && job.required_skills.length > 0 && (
        <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
          {job.required_skills.slice(0, compact ? 3 : 6).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-mono bg-inkOnPaper/8 border border-inkOnPaper/15 rounded px-2 py-0.5"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {!compact && (
        <div className="pt-3 text-[10px] font-mono text-inkOnPaper/40 border-t border-inkOnPaper/10 mt-3">
          Posted {new Date(job.posted_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
