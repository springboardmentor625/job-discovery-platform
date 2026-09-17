import { useEffect, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { fetchCompanies } from "../services/api";
import Avatar from "../components/Avatar";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const COMPANY_TYPES = [{ value: "", label: "All" }, { value: "mnc", label: "MNCs" }, { value: "startup", label: "Startups" }, { value: "new_startup", label: "Newly founded" }, { value: "unspecified", label: "Not specified" }];

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCompanies(filter || undefined).then(({ data }) => setCompanies(data)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="px-8 sm:px-12 py-12">
      <h1 className="font-display text-3xl font-bold text-ink mb-1">Companies & startups</h1>
      <p className="text-muted mb-6">Everyone currently hiring on SwipeX.</p>

      <div className="flex gap-2 mb-6">
        {COMPANY_TYPES.map((t) => (
          <button
            key={t.value || "all"}
            onClick={() => setFilter(t.value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === t.value ? "bg-violet-600 text-white" : "bg-white border border-line text-muted hover:border-violet-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : companies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {companies.map((c) => (
            <div key={c.company} className="bg-white border border-line rounded-xl p-5 hover:border-violet-300 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={c.company} size={44} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-ink truncate">{c.company}</h3>
                  <span className="inline-block px-2 py-0.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-full capitalize mt-0.5">
                    {c.company_type.replace("_", " ")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted mb-2 flex items-center gap-3">
                <span>{c.open_jobs} open role{c.open_jobs !== 1 ? "s" : ""}</span>
                {c.locations.length > 0 && (
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.locations.join(", ")}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.slice(0, 6).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-gray-50 text-muted text-xs rounded-full capitalize">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}