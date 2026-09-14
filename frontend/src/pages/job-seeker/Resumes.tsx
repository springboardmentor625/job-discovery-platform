import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Cpu, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resumesApi, type Resume, type ResumeAnalysis } from '../../api/resumes.api';

export const Resumes = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const data = await resumesApi.getResumes();
      setResumes(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const title = file.name.replace('.pdf', '');
      await resumesApi.uploadResume(file, title);
      await fetchResumes();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload resume.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumesApi.deleteResume(id);
      setResumes(prev => prev.filter(r => r.resume_id !== id));
      if (analysisResult) setAnalysisResult(null);
    } catch (err) {
      console.error('Failed to delete resume', err);
    }
  };

  const handleAnalyze = async (resume: Resume) => {
    setAnalyzingId(resume.resume_id);
    setAnalysisResult(null);
    try {
      const result = await resumesApi.analyzeResume(resume.resume_id);
      setAnalysisResult(result);
      // Refresh list to show new ATS score if it changed
      await fetchResumes();
    } catch (err) {
      console.error('Failed to analyze resume', err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resume Management</h1>
        <p className="text-slate-600 mt-1">Upload your resumes and get AI-powered feedback to improve your match rate.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: List and Upload */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload Box */}
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center hover:bg-slate-50 transition-colors">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {isUploading ? 'Uploading...' : 'Upload New Resume'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">PDF format only. Max 5MB.</p>
            {uploadError && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded-lg">{uploadError}</p>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Select File
            </button>
          </div>

          {/* Resumes List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Your Resumes</h2>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                You haven't uploaded any resumes yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {resumes.map(resume => (
                  <div key={resume.resume_id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{resume.title}</h3>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(resume.file_size)} • Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                        </p>
                        {resume.ats_score !== null && (
                          <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ATS Score: {resume.ats_score}/100
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAnalyze(resume)}
                        disabled={analyzingId === resume.resume_id}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        {analyzingId === resume.resume_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Cpu className="w-4 h-4" />
                        )}
                        Analyze
                      </button>
                      <button 
                        onClick={() => handleDelete(resume.resume_id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Analysis Results */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" /> AI Analysis
            </h2>
            
            {analyzingId ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Analyzing resume structure and keywords...</p>
                <p className="text-sm text-slate-400 mt-2">This usually takes a few seconds.</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                
                {/* Score */}
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-5xl font-black text-indigo-600 mb-2">{analysisResult.ats_score}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">ATS Compatibility Score</div>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Improvement Suggestions</h3>
                  <ul className="space-y-3">
                    {analysisResult.improvement_suggestions.map((sug, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Extracted Skills */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Skills Detected</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.extracted_skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" /> {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-8 h-8 text-slate-300" />
                </div>
                <p>Click "Analyze" on any resume to see AI-powered insights and scoring.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
