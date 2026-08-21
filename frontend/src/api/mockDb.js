const KEYS = {
  users: 'swipex_mock_users',
  profiles: 'swipex_mock_profiles',
  jobs: 'swipex_mock_jobs',
  applications: 'swipex_mock_applications',
  savedJobs: 'swipex_mock_saved_jobs',
  swipes: 'swipex_mock_swipes',
  notifications: 'swipex_mock_notifications',
};

const seedJobs = [
  {
    id: 101,
    title: 'Frontend Engineer',
    company: 'Aurora Labs',
    company_type: 'Startup',
    location: 'Chennai',
    job_type: 'Full-time',
    salary_min: 700000,
    salary_max: 1200000,
    match_score: 89,
    required_skills: ['React', 'TypeScript', 'Tailwind'],
    description: 'Build product UI, collaborate with design, and ship fast in a small team.',
    posted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 102,
    title: 'UI Developer',
    company: 'Northstar Systems',
    company_type: 'MNC',
    location: 'Bengaluru',
    job_type: 'Full-time',
    salary_min: 800000,
    salary_max: 1400000,
    match_score: 82,
    required_skills: ['JavaScript', 'CSS', 'Accessibility'],
    description: 'Own component quality and frontend performance across a high-traffic platform.',
    posted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 103,
    title: 'Product Engineer Intern',
    company: 'Blue Orbit',
    company_type: 'New',
    location: 'Remote',
    job_type: 'Internship',
    salary_min: 30000,
    salary_max: 50000,
    match_score: 76,
    required_skills: ['React', 'Node.js', 'SQL'],
    description: 'Work across the stack and learn by shipping real customer-facing features.',
    posted_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 104,
    title: 'Frontend QA Engineer',
    company: 'PixelForge',
    company_type: 'Startup',
    location: 'Hyderabad',
    job_type: 'Full-time',
    salary_min: 600000,
    salary_max: 1000000,
    match_score: 73,
    required_skills: ['Playwright', 'JavaScript', 'CI/CD'],
    description: 'Design and maintain test automation for critical product flows.',
    posted_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 105,
    title: 'Junior Full Stack Developer',
    company: 'Crescent Forge',
    company_type: 'Startup',
    location: 'Pune',
    job_type: 'Full-time',
    salary_min: 550000,
    salary_max: 950000,
    match_score: 88,
    required_skills: ['React', 'Node.js', 'MongoDB'],
    description: 'Join a product team shipping customer features across web and API layers.',
    posted_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 106,
    title: 'Software Engineer Fresher',
    company: 'NexaCore',
    company_type: 'MNC',
    location: 'Bengaluru',
    job_type: 'Full-time',
    salary_min: 450000,
    salary_max: 700000,
    match_score: 79,
    required_skills: ['Java', 'Spring Boot', 'SQL'],
    description: 'Ideal for graduates with strong coding fundamentals and eagerness to learn production systems.',
    posted_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 107,
    title: 'Data Analyst - Entry Level',
    company: 'Nova Metrics',
    company_type: 'MNC',
    location: 'Remote',
    job_type: 'Full-time',
    salary_min: 480000,
    salary_max: 800000,
    match_score: 81,
    required_skills: ['SQL', 'Excel', 'Power BI'],
    description: 'Create dashboards, analyze product trends, and support decision-making.',
    posted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 108,
    title: 'Python Developer Internship',
    company: 'CodeNexa',
    company_type: 'New',
    location: 'Remote',
    job_type: 'Internship',
    salary_min: 20000,
    salary_max: 40000,
    match_score: 74,
    required_skills: ['Python', 'Flask', 'API'],
    description: 'Build internal tools and automation scripts while learning backend workflows.',
    posted_at: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 109,
    title: 'React Native Developer',
    company: 'MetroHive',
    company_type: 'Startup',
    location: 'Hyderabad',
    job_type: 'Full-time',
    salary_min: 650000,
    salary_max: 1150000,
    match_score: 86,
    required_skills: ['React Native', 'JavaScript', 'UI'],
    description: 'Build polished mobile experiences for a growing fintech startup.',
    posted_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 110,
    title: 'AI Product Analyst',
    company: 'Signal Foundry',
    company_type: 'New',
    location: 'Chennai',
    job_type: 'Full-time',
    salary_min: 700000,
    salary_max: 1250000,
    match_score: 84,
    required_skills: ['Python', 'SQL', 'Data Analysis'],
    description: 'Translate AI features into measurable product decisions and customer insights.',
    posted_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 111,
    title: 'Graduate Trainee - Web Development',
    company: 'Zenith Digital',
    company_type: 'MNC',
    location: 'Coimbatore',
    job_type: 'Full-time',
    salary_min: 400000,
    salary_max: 650000,
    match_score: 77,
    required_skills: ['HTML', 'CSS', 'JavaScript'],
    description: 'Structured trainee role focused on frontend fundamentals and collaborative projects.',
    posted_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const competitionProfiles = [
  { applicants_count: 14, competition_level: 'Low', is_early_applicant: true },
  { applicants_count: 42, competition_level: 'Medium', is_early_applicant: false },
  { applicants_count: 8, competition_level: 'Low', is_early_applicant: true },
  { applicants_count: 96, competition_level: 'High', is_early_applicant: false },
  { applicants_count: 27, competition_level: 'Medium', is_early_applicant: true },
  { applicants_count: 61, competition_level: 'High', is_early_applicant: false },
  { applicants_count: 19, competition_level: 'Low', is_early_applicant: true },
  { applicants_count: 11, competition_level: 'Low', is_early_applicant: true },
  { applicants_count: 35, competition_level: 'Medium', is_early_applicant: false },
  { applicants_count: 23, competition_level: 'Medium', is_early_applicant: true },
  { applicants_count: 17, competition_level: 'Low', is_early_applicant: true },
];

const seededJobs = seedJobs.map((job, index) => ({
  ...job,
  ...competitionProfiles[index % competitionProfiles.length],
}));

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initMockDb() {
  if (!localStorage.getItem(KEYS.jobs)) {
    writeJson(KEYS.jobs, seededJobs);
  }
  if (!localStorage.getItem(KEYS.users)) {
    writeJson(KEYS.users, []);
  }
  if (!localStorage.getItem(KEYS.profiles)) {
    writeJson(KEYS.profiles, {});
  }
  if (!localStorage.getItem(KEYS.applications)) {
    writeJson(KEYS.applications, []);
  }
  if (!localStorage.getItem(KEYS.savedJobs)) {
    writeJson(KEYS.savedJobs, []);
  }
  if (!localStorage.getItem(KEYS.swipes)) {
    writeJson(KEYS.swipes, []);
  }
  if (!localStorage.getItem(KEYS.notifications)) {
    writeJson(KEYS.notifications, []);
  }
}

export function getCollection(name, fallback) {
  initMockDb();
  return readJson(KEYS[name], fallback);
}

export function setCollection(name, value) {
  initMockDb();
  writeJson(KEYS[name], value);
}

export function getCurrentUser() {
  const raw = localStorage.getItem('swipex_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getUserProfile(userId) {
  const profiles = getCollection('profiles', {});
  return (
    profiles[userId] || {
      headline: '',
      about: '',
      location: '',
      preferred_role: '',
      preferred_locations: '',
      experience_years: '',
      portfolio_url: '',
      linkedin_url: '',
      github_url: '',
      hackerrank_url: '',
      leetcode_url: '',
      github_projects_url: '',
      college_name: '',
      graduation_year: '',
      cgpa: '',
      projects_summary: '',
      work_authorization: '',
      remote_preference: 'Hybrid',
      notice_period: '',
      min_salary: '',
      job_type: '',
      education: '',
      availability: 'Open to opportunities',
      skills: [],
    }
  );
}

export function setUserProfile(userId, profile) {
  const profiles = getCollection('profiles', {});
  profiles[userId] = profile;
  setCollection('profiles', profiles);
}

export function makeApiError(message, status = 400) {
  const err = new Error(message);
  err.response = {
    status,
    data: { error: message },
  };
  return err;
}

export function asyncResolve(value, delay = 120) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });
}
