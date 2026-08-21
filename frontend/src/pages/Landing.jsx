import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import JobCard from '../components/swipe/JobCard';

const sampleJob = {
  id: 'sample',
  title: 'Frontend Engineer',
  company: 'NovaTech Systems',
  company_type: 'MNC',
  location: 'Bengaluru',
  salary_min: 800000,
  salary_max: 1400000,
  job_type: 'Full-time',
  required_skills: ['React', 'JavaScript', 'Tailwind'],
  match_score: 91,
  posted_at: new Date().toISOString(),
  description:
    'Build customer-facing dashboards used by enterprise clients across three continents.',
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink overflow-hidden">
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display text-xl font-semibold text-gold">SwipeX</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-textLo hover:text-textHi">
            Log in
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-teal">
            AI-powered job discovery
          </span>
          <h1 className="font-display text-5xl leading-[1.05] font-semibold mt-4">
            Every opportunity,
            <br />
            filed and stamped
            <br />
            for you.
          </h1>
          <p className="text-textLo mt-5 max-w-md leading-relaxed">
            Upload your resume, get a real ATS score, and swipe through roles
            matched to your skills — across MNCs, startups, and newly founded
            companies.
          </p>
          <div className="flex gap-3 mt-8">
            <Link to="/register">
              <Button>Create your account</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost">I already have one</Button>
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotate: 6 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="justify-self-center w-72"
        >
          <JobCard job={sampleJob} />
        </motion.div>
      </section>
    </div>
  );
}
