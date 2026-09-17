import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume, fetchResumes, activateResume, deleteResume } from "../services/api";
import { SkeletonList } from "../components/Skeleton";
import { Upload, ArrowRight, Trash2, CheckCircle2 } from "lucide-react";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const loadResumes = () => {
    setListLoading(true);
    fetchResumes().then(({ data }) => setResumes(data)).finally(() => setListLoading(false));
  };

  // Re-fetches in the background without toggling listLoading — used where
  // we can't predict the outcome locally (like delete's fallback-promotion
  // logic), but still don't want to flash the whole list to "Loading..."
  // for what's usually a near-instant request.
  const reloadResumesSilently = () => {
    fetchResumes().then(({ data }) => setResumes(data));
  };

  useEffect(loadResumes, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Choose a resume file first (.pdf, .docx, or .txt)."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await uploadResume(file, targetRole);
      setResult(data);
      setFile(null);
      setTargetRole("");
      // The upload response already contains the complete new resume
      // object, and a new upload always becomes the active one — so we can
      // update the list in place instantly instead of re-fetching and
      // flashing a "Loading..." state.
      setResumes((prev) => [data, ...prev.map((r) => ({ ...r, is_active: false }))]);
    } catch { setError("Upload failed. Please try a different file."); }
    finally { setLoading(false); }
  };

  const handleActivate = async (id) => {
    await activateResume(id);
    setResumes((prev) => prev.map((r) => ({ ...r, is_active: r.id === id })));
  };

  const handleDelete = async (id) => {
    await deleteResume(id);
    // Delete can trigger fallback-promotion on the backend (another resume
    // becomes active), which we can't predict locally — so we do need to
    // ask the server again here, just without flashing the loading state.
    reloadResumesSilently();
  };

  return (
    <div className="px-8 sm:px-12 py-12 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Your resumes</h1>
        <p className="text-muted">Upload one per role — job matching always uses whichever is marked active.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-6 space-y-4 mb-8">
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Target role (optional)</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Frontend Developer"
            className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
        </div>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-line rounded-xl py-10 cursor-pointer hover:border-violet-400 transition-colors">
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
            <Upload size={18} className="text-violet-600" />
          </div>
          <p className="text-sm text-ink font-medium">{file ? file.name : "Click to choose a file"}</p>
          <p className="text-xs text-muted">.pdf, .docx, or .txt</p>
          <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
        </label>

        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">
          {loading ? "Parsing..." : "Upload & analyze"}
        </button>
      </form>

      {result && (
        <div className="bg-white border border-line rounded-xl p-6 mb-8 text-center">
          <h2 className="font-display font-semibold text-ink mb-3">Skills we found</h2>
          {result.extracted_skills.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {result.extracted_skills.map((skill) => <span key={skill} className="px-2.5 py-1 bg-violet-50 text-violet-700 text-sm font-medium rounded-full capitalize">{skill}</span>)}
            </div>
          ) : <p className="text-sm text-muted mb-5">No recognized skills found — try a more detailed resume.</p>}
          <button onClick={() => navigate("/jobs")} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            See matching jobs <ArrowRight size={16} />
          </button>
        </div>
      )}

      <h2 className="font-display font-semibold text-ink mb-4 text-center">All your resumes</h2>
      {listLoading ? (
        <SkeletonList count={2} />
      ) : resumes.length === 0 ? (
        <p className="text-sm text-muted text-center">No resumes uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <div key={r.id} className={`bg-white border rounded-xl p-4 ${r.is_active ? "border-violet-400" : "border-line"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-ink flex items-center gap-2">
                    {r.target_role || "Untitled resume"}
                    {r.is_active && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Version {r.version} · Uploaded {new Date(r.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!r.is_active && (
                    <button
                      onClick={() => handleActivate(r.id)}
                      className="px-3 py-1.5 rounded-full bg-violet-50 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                    >
                      Set as active
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    title="Delete"
                    className="p-2 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {r.extracted_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.extracted_skills.slice(0, 8).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-paper text-muted text-xs rounded-full capitalize">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}