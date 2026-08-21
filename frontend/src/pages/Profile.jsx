import { useEffect, useRef, useState } from 'react';
import { getProfile, updateProfile, uploadResume } from '../api/profile';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import MatchStamp from '../components/ui/MatchStamp';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [skillsText, setSkillsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [resumeState, setResumeState] = useState('idle'); // idle | parsing | done | error
  const [resumeResult, setResumeResult] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    getProfile().then((data) => {
      setProfile(data);
      setSkillsText((data.skills || []).join(', '));
      if (data.resume) {
        setResumeResult({
          ats_score: data.resume.ats_score,
          parser: data.resume.parser,
          extracted_skills: data.resume.skills || [],
          missing_skills: data.resume.missing_skills || [],
          experience_years: data.resume.experience_years,
          education: data.resume.education || [],
        });
        setResumeState('done');
      }
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await updateProfile({ ...profile, skills });
      setSaveMessage('Profile saved.');
      toast.success('Profile updated successfully!');
    } catch {
      setSaveMessage('Could not save — check the backend is running.');
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeState('parsing');
    try {
      const result = await uploadResume(file);
      setResumeResult(result);
      setSkillsText((current) => {
        const skills = new Set(current.split(',').map((skill) => skill.trim()).filter(Boolean));
        result.extracted_skills.forEach((skill) => skills.add(skill));
        return [...skills].join(', ');
      });
      setProfile((current) => ({ ...current, skills: [...new Set([...(current.skills || []), ...result.extracted_skills])] }));
      setResumeState('done');
      toast.success(`Resume parsed! ATS Score: ${result.ats_score}% (${result.parser} parser)`);
    } catch {
      setResumeState('error');
      toast.error('Failed to parse resume file.');
    }
  }

  if (!profile) {
    return <p className="text-textLo text-center py-20">Loading profile…</p>;
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Your profile</h1>
        <p className="text-textLo text-sm">
          Keep this current — it drives your recommendations and match scores.
        </p>
      </div>

      <div className="grid xl:grid-cols-[1.4fr_0.9fr] gap-8">
        <section>
          <form onSubmit={handleSave} className="bg-surface border border-white/10 rounded-xl p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Headline"
                placeholder="Final-year CS student, frontend-leaning"
                value={profile.headline || ''}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              />
              <Input
                label="Experience (years)"
                type="number"
                min="0"
                placeholder="2"
                value={profile.experience_years || ''}
                onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })}
              />
            </div>

            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-wide text-textLo mb-1.5">
                About me
              </span>
              <textarea
                rows="4"
                value={profile.about || ''}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                className="w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-textHi placeholder:text-textLo/60 focus:border-gold outline-none transition-colors resize-none"
                placeholder="I build polished web experiences and enjoy turning product ideas into conversion-ready interfaces."
              />
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Location"
                placeholder="Chennai, Tamil Nadu"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
              <Input
                label="Preferred role"
                placeholder="Frontend Engineer"
                value={profile.preferred_role || ''}
                onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Preferred locations"
                placeholder="Bengaluru, Remote"
                value={profile.preferred_locations || ''}
                onChange={(e) => setProfile({ ...profile, preferred_locations: e.target.value })}
              />
              <Input
                label="Portfolio"
                placeholder="https://yourportfolio.dev"
                value={profile.portfolio_url || ''}
                onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="LinkedIn"
                placeholder="https://linkedin.com/in/yourname"
                value={profile.linkedin_url || ''}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
              />
              <Input
                label="GitHub"
                placeholder="https://github.com/yourname"
                value={profile.github_url || ''}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="GitHub projects"
                placeholder="https://github.com/yourname?tab=repositories"
                value={profile.github_projects_url || ''}
                onChange={(e) => setProfile({ ...profile, github_projects_url: e.target.value })}
              />
              <Input
                label="HackerRank"
                placeholder="https://www.hackerrank.com/yourname"
                value={profile.hackerrank_url || ''}
                onChange={(e) => setProfile({ ...profile, hackerrank_url: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="LeetCode"
                placeholder="https://leetcode.com/yourname"
                value={profile.leetcode_url || ''}
                onChange={(e) => setProfile({ ...profile, leetcode_url: e.target.value })}
              />
              <label className="block">
                <span className="block text-xs font-mono uppercase tracking-wide text-textLo mb-1.5">
                  Remote preference
                </span>
                <select
                  value={profile.remote_preference || 'Hybrid'}
                  onChange={(e) => setProfile({ ...profile, remote_preference: e.target.value })}
                  className="w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-textHi focus:border-gold outline-none transition-colors"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                  <option value="Open to all">Open to all</option>
                </select>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="College / university"
                placeholder="Anna University"
                value={profile.college_name || ''}
                onChange={(e) => setProfile({ ...profile, college_name: e.target.value })}
              />
              <Input
                label="Graduation year"
                placeholder="2026"
                value={profile.graduation_year || ''}
                onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="CGPA / percentage"
                placeholder="8.7 / 9.2"
                value={profile.cgpa || ''}
                onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })}
              />
              <Input
                label="Work authorization"
                placeholder="Eligible for employment in India"
                value={profile.work_authorization || ''}
                onChange={(e) => setProfile({ ...profile, work_authorization: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Minimum salary (₹/year)"
                type="number"
                placeholder="600000"
                value={profile.min_salary || ''}
                onChange={(e) => setProfile({ ...profile, min_salary: e.target.value })}
              />
              <Input
                label="Notice period"
                placeholder="30 days"
                value={profile.notice_period || ''}
                onChange={(e) => setProfile({ ...profile, notice_period: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Job type"
                placeholder="Full-time, Internship..."
                value={profile.job_type || ''}
                onChange={(e) => setProfile({ ...profile, job_type: e.target.value })}
              />
              <Input
                label="Availability"
                placeholder="Open to opportunities"
                value={profile.availability || ''}
                onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Education"
                placeholder="B.Tech in Computer Science"
                value={profile.education || ''}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
              />
            </div>

            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-wide text-textLo mb-1.5">
                Projects summary
              </span>
              <textarea
                rows="3"
                value={profile.projects_summary || ''}
                onChange={(e) => setProfile({ ...profile, projects_summary: e.target.value })}
                className="w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-textHi placeholder:text-textLo/60 focus:border-gold outline-none transition-colors resize-none"
                placeholder="Built a resume ATS analyzer, job recommendation dashboard, and a team task manager using React and Node.js."
              />
            </label>

            <Input
              label="Skills (comma separated)"
              placeholder="React, SQL, Python"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />

            {saveMessage && <p className="text-sm text-teal mb-3">{saveMessage}</p>}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="bg-gradient-to-br from-surface via-surface to-surfaceHi border border-white/10 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-textLo">Public profile preview</p>
                <h2 className="font-display text-2xl font-semibold mt-1">
                  {profile.headline || 'Open to opportunities'}
                </h2>
              </div>
              <div className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-gold">
                {profile.availability || 'Available'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-[10px] font-mono uppercase tracking-wide text-textLo">Location</p>
                <p className="mt-1 text-sm text-textHi font-medium">{profile.location || '—'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-[10px] font-mono uppercase tracking-wide text-textLo">Role</p>
                <p className="mt-1 text-sm text-textHi font-medium">{profile.preferred_role || '—'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-[10px] font-mono uppercase tracking-wide text-textLo">Years</p>
                <p className="mt-1 text-sm text-textHi font-medium">
                  {profile.experience_years ? `${profile.experience_years}y` : 'Fresher'}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-[10px] font-mono uppercase tracking-wide text-textLo">Salary</p>
                <p className="mt-1 text-sm text-textHi font-medium">
                  {profile.min_salary ? `₹${(Number(profile.min_salary) / 100000).toFixed(1)}L` : '—'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] font-mono uppercase tracking-wide text-textLo mb-2">Profile strength</p>
              <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold via-yellow-400 to-teal"
                  style={{
                    width: `${Math.min(
                      100,
                      42 + (skillsText.split(',').filter(Boolean).length * 8) + (profile.projects_summary ? 12 : 0)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {[
                profile.linkedin_url && { label: 'LinkedIn', href: profile.linkedin_url },
                profile.github_url && { label: 'GitHub', href: profile.github_url },
                profile.hackerrank_url && { label: 'HackerRank', href: profile.hackerrank_url },
                profile.leetcode_url && { label: 'LeetCode', href: profile.leetcode_url },
                profile.portfolio_url && { label: 'Portfolio', href: profile.portfolio_url },
              ]
                .filter(Boolean)
                .map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-white/10 bg-surfaceHi px-3 py-2 text-sm text-gold hover:border-gold/50 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}

              {![
                profile.linkedin_url,
                profile.github_url,
                profile.hackerrank_url,
                profile.leetcode_url,
                profile.portfolio_url,
              ].some(Boolean) && (
                <p className="text-sm text-textLo">Add social links and portfolio URLs to strengthen your profile.</p>
              )}
            </div>
          </div>

          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <p className="text-xs font-mono uppercase tracking-wide text-textLo mb-3">Candidate strengths</p>
            <div className="flex flex-wrap gap-2">
              {profile.education && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal/10 border border-teal/30 rounded-full text-xs text-teal font-medium">
                  ✓ Educated
                </span>
              )}
              {profile.cgpa && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-xs text-gold font-medium">
                  ✓ High CGPA
                </span>
              )}
              {skillsText.split(',').filter(Boolean).length >= 5 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-lime/10 border border-lime/30 rounded-full text-xs text-lime font-medium">
                  ✓ Multi-skilled
                </span>
              )}
              {profile.portfolio_url && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple/10 border border-purple/30 rounded-full text-xs text-purple font-medium">
                  ✓ Portfolio
                </span>
              )}
              {profile.github_url && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue/10 border border-blue/30 rounded-full text-xs text-blue font-medium">
                  ✓ GitHub Active
                </span>
              )}
              {profile.linkedin_url && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan/10 border border-cyan/30 rounded-full text-xs text-cyan font-medium">
                  ✓ LinkedIn
                </span>
              )}
            </div>
          </div>

          {profile.projects_summary && (
            <div className="bg-surface border border-white/10 rounded-xl p-5">
              <p className="text-xs font-mono uppercase tracking-wide text-textLo mb-3">Key projects</p>
              <p className="text-sm text-textHi leading-relaxed">{profile.projects_summary}</p>
            </div>
          )}

          <div className="bg-surface border border-white/10 rounded-xl p-6 flex flex-col items-center text-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />

            <h2 className="font-display text-2xl font-semibold mb-1">Resume &amp; ATS analysis</h2>
            <p className="text-textLo text-sm mb-2">
              Upload a resume to extract skills and get an ATS compatibility score.
            </p>

            {resumeState === 'idle' && (
              <>
                <p className="text-textLo text-sm">No resume uploaded yet.</p>
                <Button onClick={() => fileInputRef.current?.click()}>Upload resume</Button>
              </>
            )}

            {resumeState === 'parsing' && (
              <p className="text-gold font-mono text-sm animate-pulse">
                Parsing resume and scoring ATS compatibility…
              </p>
            )}

            {resumeState === 'error' && (
              <>
                <p className="text-coral text-sm">
                  Couldn't process that file — try a PDF or DOCX under a few MB.
                </p>
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                  Try again
                </Button>
              </>
            )}

            {resumeState === 'done' && resumeResult && (
              <>
                <MatchStamp percentage={resumeResult.ats_score} size="lg" />
                <p className="text-xs text-textLo font-mono">
                  Parser: {resumeResult.parser === 'ai' ? 'AI analysis' : 'local analysis'}
                </p>
                <div className="w-full text-left mt-2">
                  <span className="text-xs font-mono uppercase tracking-wide text-textLo">
                    Skills detected
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {resumeResult.extracted_skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {resumeResult.missing_skills?.length > 0 && (
                  <p className="w-full text-left text-xs text-coral">
                    Missing keywords: {resumeResult.missing_skills.join(', ')}
                  </p>
                )}
                {resumeResult.education?.length > 0 && (
                  <p className="w-full text-left text-xs text-textLo">
                    Education detected: {resumeResult.education.join(' · ')}
                  </p>
                )}
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                  Upload a different resume
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
