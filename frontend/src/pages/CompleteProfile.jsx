
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../api/api";


const EXISTING_SKILLS = [

"C", "C++", "C#", "Java", "JavaScript", "TypeScript",

"Python", "React", "React Native", "Angular", "Vue.js",

"Node.js", "Express.js", "Django", "FastAPI", "HTML",

"CSS", "Tailwind CSS", "Bootstrap", "SQL", "MySQL",

"PostgreSQL", "MongoDB", "Git", "GitHub", "Docker",

"AWS", "Azure", "Machine Learning", "Deep Learning",

"Natural Language Processing", "Data Science",

"Data Analysis", "scikit-learn", "TensorFlow", "PyTorch",

"Figma", "UI/UX Design", "REST API",

"Big Data", "Hadoop", "Hive", "MapReduce", "Spark",

"HDFS", "YARN", "Core Java", "Data Structures", "DBMS",

"RDBMS", "Informatica", "Talend", "Amazon Redshift",

"Azure Data Factory", "Azure Databricks", "AWS Lambda",

"AWS Deployment", "Anaconda", "Bash", "Linux",

"C Programming", "C/C++", "ASP", "ASP.NET",

"ASP.NET 4.5", "Android", "AngularJS", "ANN", "API",

"API Design", "Application Development",

"Application Programming", "Application Support",

"Applied Machine Learning", "Algorithm Design",

"Algorithm Development", "Algorithm Optimization",

"Algorithms", "Algorithms and Data Structures",

"Analysis of Algorithms", "Artificial Intelligence",

"Active Learning", "Automation", "Automated Testing",

"Automated Test Scripts", "Agile", "Agile Methodologies",

"Agile Methodology", "Agile Coach", "Adobe",

"Adobe Acrobat", "Adobe Analytics", "Adobe Creative Suite",

"Adobe Illustrator", "Adobe InDesign", "Adobe Photoshop",

"AutoCAD", "AutoCAD Civil 3D", "CAD", "Arduino",

"Arduino IDE", "Ansys", "ANSYS", "ArcView",

"Audio Editing", "Backup", "BGP", "BERT",

"Black Box Testing", "Big Data Analytics",

"Business Analysis", "Business Analytics",

"Business Intelligence", "Business Objects",

"Business Development", "Business Management",

"Business Process Improvement", "Business Process Management",

"Business Requirements", "Business Strategy",

"Business Systems", "Business Systems Analysis",

"C Programming", "Cloud", "Cloud Computing",

"Computer Vision", "Convolutional Neural Networks",

"Data Analytics", "Data Visualization", "Data Mining",

"Data Warehousing", "Database Administration",

"Database Management", "Deep Learning", "DevOps",

"ETL", "Excel", "Advanced Excel", "Financial Analysis",

"Flask", "GitLab", "Google Cloud", "GCP",

"GraphQL", "HBase", "J2EE", "Jenkins",

"Jira", "JSON", "Jupyter", "Kubernetes",

"Microsoft Azure", "Microsoft Office", "Microsoft Power BI",

"NLP", "NumPy", "Pandas", "Power BI", "PowerBI",

"Predictive Analytics", "PySpark", "Python Analysis",

"Python Programming", "Python Statistics",

"REST", "RESTful API", "R", "SAS", "Scala",

"Scikit-Learn", "Shell Scripting", "Software Development",

"Software Engineering", "SQL Server", "Tableau",

"Testing", "Unit Testing", "UI Design", "UX Design",

"Web Development", "Web Services", "Windows",

"XML", "XGBoost", "Matplotlib", "Seaborn",

"OpenCV", "spaCy", "NLTK", "Transformers",

"Hugging Face", "LLM", "Generative AI", "Generative Artificial Intelligence",

"Reinforcement Learning", "Supervised Learning",

"Unsupervised Learning", "Neural Networks",

"Natural Language Processing with Python",

"Machine Learning with Python", "PyTorch Developer",

"TensorFlow", "Keras", "CUDA", "Computer Networks",

"Network Security", "Cybersecurity", "Information Security",

"Active Directory", "Wireshark", "OpenSSH", "OpenVPN",

"System Administration", "Systems Administration",

"Systems Analysis", "Systems Engineering",

"Technical Support", "Troubleshooting",

"Software Testing", "Quality Assurance", "QA Testing",

"Black Box", "Test Automation", "Selenium",

"Postman", "Microservices", "Spring", "Spring Boot",

"Hibernate", "Maven", "Gradle", "PHP", "Laravel",

"Ruby", "Ruby on Rails", "Go", "Rust", "Swift",

"Objective-C", "iOS Development",

"Mobile Application Development", "React Native",

"Next.js", "Nuxt.js", "Svelte", "Redux",

"Redux Toolkit", "Context API", "Vite",

"Webpack", "Babel", "Nginx", "Apache",

"Docker Compose", "Terraform", "Ansible",

"CI/CD", "GitHub Actions", "Jenkins CI",

"AWS EC2", "AWS S3", "AWS EMR", "Amazon EC2",

"Amazon S3", "Microsoft Power BI", "Tableau",

"Alteryx", "SAP", "Oracle", "Oracle Database",

"MySQL", "PostgreSQL", "MongoDB", "Redis",

"Firebase", "Django REST Framework", "FastAPI",

"Flask", "JWT", "OAuth", "OAuth2",

"Authentication", "Authorization", "Role-Based Access Control",

"API Development", "API Integration", "API Testing",

"Data Structures", "Algorithms", "Object-Oriented Programming",

"OOP", "Design Patterns", "Software Architecture",

"System Design", "Database Design", "Database Queries",

"Data Modeling", "Data Cleaning", "Data Preprocessing",

"Feature Engineering", "Model Training", "Model Evaluation",

"Model Deployment", "MLOps", "Statistical Analysis",

"Statistics", "Probability", "Linear Regression",

"Logistic Regression", "Decision Trees", "Random Forest",

"KNN", "Naive Bayes", "Clustering", "K-Means",

"PCA", "SVM", "Gradient Boosting", "XGBoost",

"LightGBM", "CatBoost", "Time Series Analysis",

"ANOVA", "Algebra", "Mathematics", "R Programming",

"SAS", "SPSS", "Power Query", "Power Pivot",

"Financial Modeling", "Accounting", "Auditing",

"Budgeting", "Business Consulting", "Business Writing",

"Communication", "Leadership", "Project Management",

"Team Management", "Problem Solving", "Critical Thinking",

"Analytical Skills", "Research", "Research Analysis",

"Technical Writing", "Documentation", "Presentation",

"Marketing", "Digital Marketing", "Advertising",

"Branding", "Sales", "Customer Service",

"Recruitment", "Human Resources", "Talent Acquisition",

"Supply Chain", "Operations Management", "Risk Management",

"Product Management", "Product Development", "Product Design",

"UI/UX", "Interaction Design", "Wireframing", "Prototyping",

"Figma", "Adobe XD", "Sketch", "Illustration",

"3D Modeling", "3D Printing", "3ds Max",

"SolidWorks", "CATIA", "Autodesk Inventor",

"Mechanical Design", "Engineering Design", "Manufacturing",

"Quality Control", "Process Improvement", "Automation Design",

"Embedded Systems", "Embedded C", "Microcontrollers",

"Electronics", "Analog and Digital Circuits", "PCB Design",

"IoT", "Internet of Things", "Robotics",

"Computer Graphics", "Game Development", "Unity",

"Unreal Engine", "Blockchain", "Ethereum",

"Smart Contracts", "Cryptography", "Linux Administration",

"Windows Administration", "Server Administration",

"Cloud Infrastructure", "Cloud Administration",

"AWS", "Azure", "Google Cloud Platform",

];


const EXISTING_ROLES = [

"Software Developer",

"Software Engineer",

"Frontend Developer",

"Backend Developer",

"Full Stack Developer",

"React Developer",

"Java Developer",

"Python Developer",

"Node.js Developer",

"Web Developer",

"Mobile App Developer",

"Data Analyst",

"Data Scientist",

"Machine Learning Engineer",

"AI Engineer",

"DevOps Engineer",

"Cloud Engineer",

"Database Administrator",

"UI/UX Designer",

"Product Designer",

"QA Engineer",

"Software Tester",

"Cybersecurity Analyst",

"Big Data Analyst",

"Big Data Engineer",

"Data Engineer",

"Data Architect",

"Data Scientist",

"Business Analyst",

"Business Intelligence Analyst",

"Business Intelligence Developer",

"Business Consultant",

"Business Development Manager",

"Business Development Executive",

"Project Manager",

"Project Coordinator",

"Product Manager",

"Product Owner",

"Technical Product Manager",

"Software Architect",

"Solution Architect",

"Solutions Engineer",

"Systems Analyst",

"Systems Engineer",

"System Administrator",

"Network Engineer",

"Network Administrator",

"Network Support Engineer",

"Network Security Engineer",

"Information Security Analyst",

"Security Engineer",

"Cybersecurity Engineer",

"Security Analyst",

"Technical Support Engineer",

"Technical Support Specialist",

"Application Support Engineer",

"Support Engineer",

"QA Tester",

"QA Analyst",

"QA Lead",

"QA Manager",

"Quality Assurance Engineer",

"Quality Engineer",

"Automation Engineer",

"Test Automation Engineer",

"Selenium Tester",

"DevOps Engineer",

"Site Reliability Engineer",

"SRE",

"Cloud Architect",

"Cloud Administrator",

"Cloud Developer",

"AWS Engineer",

"Azure Engineer",

"Cloud Solutions Architect",

"Machine Learning Scientist",

"Machine Learning Scientist",

"Machine Learning Developer",

"Machine Learning Intern",

"AI Developer",

"AI Researcher",

"AI Scientist",

"NLP Engineer",

"NLP Developer",

"NLP Analyst",

"Computer Vision Engineer",

"Deep Learning Engineer",

"Data Science Intern",

"Data Analyst Intern",

"Data Scientist Intern",

"Python Developer Intern",

"Software Developer Intern",

"Software Engineer Intern",

"Web Developer Intern",

"Machine Learning Intern",

"Research Assistant",

"Research Analyst",

"Research Scientist",

"Research Engineer",

"Research Intern",

"Statistical Analyst",

"Statistician",

"Financial Analyst",

"Financial Data Analyst",

"Business Analyst",

"Business Systems Analyst",

"MIS Analyst",

"Systems Analyst",

"Database Developer",

"Database Engineer",

"SQL Developer",

"Oracle Developer",

"MySQL Developer",

"PostgreSQL Developer",

"MongoDB Developer",

"ETL Developer",

"Data Warehouse Developer",

"Data Warehouse Engineer",

"Data Integration Engineer",

"BI Developer",

"Power BI Developer",

"Tableau Developer",

"Reporting Analyst",

"Product Analyst",

"Marketing Analyst",

"Digital Marketing Specialist",

"Marketing Manager",

"Marketing Director",

"Sales Executive",

"Sales Representative",

"Sales Manager",

"Sales Engineer",

"Account Manager",

"Account Executive",

"Customer Success Manager",

"Customer Support Specialist",

"HR Analyst",

"HR Manager",

"Human Resources Manager",

"Recruiter",

"Technical Recruiter",

"Talent Acquisition Specialist",

"Talent Acquisition Consultant",

"Operations Manager",

"Operations Analyst",

"Operations Specialist",

"Supply Chain Analyst",

"Supply Chain Manager",

"Project Engineer",

"Process Engineer",

"Manufacturing Engineer",

"Mechanical Engineer",

"Electrical Engineer",

"Electronics Engineer",

"Embedded Systems Engineer",

"Automation Engineer",

"Robotics Engineer",

"Civil Engineer",

"Chemical Engineer",

"Production Engineer",

"Quality Engineer",

"Maintenance Engineer",

"Mechanical Designer",

"Mechanical Design Engineer",

"CAD Designer",

"CAD Engineer",

"UI Designer",

"UX Designer",

"UI/UX Designer",

"Product Designer",

"Interaction Designer",

"Visual Designer",

"Graphic Designer",

"Web Designer",

"Technical Writer",

"Content Writer",

"Technical Support",

"System Developer",

"Software Development Engineer",

"SDE",

"SDE Intern",

"Principal Software Engineer",

"Senior Software Engineer",

"Senior Software Developer",

"Senior Data Analyst",

"Senior Data Scientist",

"Senior Data Engineer",

"Senior Machine Learning Engineer",

"Senior DevOps Engineer",

"Senior Cloud Engineer",

"Senior QA Engineer",

"Senior Network Engineer",

"Senior Systems Engineer",

"Senior Business Analyst",

"Senior Project Manager",

"Engineering Manager",

"Software Engineering Manager",

"QA Engineering Manager",

"IT Manager",

"Technology Manager",

"Technical Manager",

"Team Lead",

"Technical Lead",

"Engineering Lead",

"Software Engineering Team Lead",

"Development Team Lead",

"DevOps Lead",

"Data Engineering Lead",

"Machine Learning Lead",

"AI Lead",

"Product Lead",

"Engineering Director",

"Director of Engineering",

"Director of Software Development",

"VP of Engineering",

"Software Development Manager",

"Application Developer",

"Application Engineer",

"Application Programmer",

"Systems Developer",

"Web Application Developer",

"Web Application Engineer",

"Mobile Application Developer",

"Android Developer",

"iOS Developer",

"React Native Developer",

"Angular Developer",

"Vue.js Developer",

"JavaScript Developer",

"TypeScript Developer",

"C Developer",

"C++ Developer",

"C# Developer",

".NET Developer",

"ASP.NET Developer",

"PHP Developer",

"Laravel Developer",

"Ruby Developer",

"Ruby on Rails Developer",

"Go Developer",

"Rust Developer",

"Kotlin Developer",

"Swift Developer",

"DevOps Intern",

"Cloud Intern",

"Data Engineering Intern",

"AI Intern",

"Research Scientist",

"Researcher",

"Postdoctoral Research Fellow",

"Professor",

"Teaching Assistant",

"Instructor",

"Technical Trainer",

"Training Coordinator",

"Accountant",

"Senior Accountant",

"Staff Accountant",

"Payroll Accountant",

"Project Accountant",

"Tax Accountant",

"Audit Analyst",

"Auditor",

"Internal Auditor",

"Risk Analyst",

"Risk Manager",

"Compliance Analyst",

"Compliance Manager",

"Operations Analyst",

"Operations Manager",

"Administrative Assistant",

"Office Manager",

"Office Coordinator",

"Project Administrator",

"Program Manager",

"Program Coordinator",

"Service Manager",

"Service Technician",

"Maintenance Technician",

"Production Technician",

"Manufacturing Technician",

"Quality Assurance Technician",

"Quality Assurance Manager",

"Quality Manager",

"Production Manager",

"Production Supervisor",

"Manufacturing Manager",

"Engineering Technician",

"Mechanical Technician",

"Electrical Technician",

"Field Engineer",

"Site Engineer",

"Test Engineer",

"Test Technician",

"Validation Engineer",

"Reliability Engineer",

"Process Improvement Engineer",

"Product Development Engineer",

"R&D Engineer",

"Research and Development Associate",

"Technical Project Manager",

"Scrum Master",

"Agile Coach",

"Product Marketing Specialist",

"Content Specialist",

"Content Manager",

"Technical Content Writer",

"Social Media Manager",

"SEO Specialist",

"Digital Marketing Manager",

"Brand Manager",

"Advertising Manager",

"Customer Service Representative",

"Customer Support Representative",

"Customer Success Specialist",

"Business Development Executive",

"Business Development Manager",

"Regional Sales Manager",

"Sales Director",

"Marketing Officer",

"Marketing Director",

"Strategy Analyst",

"Strategic Planning Analyst",

"Management Consultant",

"Management Trainee",

"Operations Specialist",

"Operations Technician",

"Technical Operations Engineer",

"IT Support Specialist",

"IT Support Engineer",

"IT Administrator",

"IT Consultant",

"Technology Consultant",

"Solutions Consultant",

"Solutions Analyst",

"Implementation Specialist",

"Software Implementation Engineer",

"Application Support Specialist",

"Technical Account Manager",

"Technical Support Coordinator",

"Support Manager",

];


const MIN_SALARY = 10000;


function CompleteProfile() {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({

    headline: "",
    summary: "",
    location: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
    preferredJobType: "",
    preferredLocation: "",
    preferredRole: "",
    expectedSalary: "",

  });


  const [skills, setSkills] = useState([]);

  const [skillInput, setSkillInput] = useState("");

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  const [profileExists, setProfileExists] =
    useState(false);


  // =========================================================
  // LOAD EXISTING PROFILE
  // =========================================================

  useEffect(() => {

    const loadProfile = async () => {

      try {

        setIsProfileLoading(true);

        setError("");


        const response =
          await api.get("/api/profile/");


        const profile =
          response.data?.profile ||
          response.data;


        if (!profile) {

          setProfileExists(false);

          return;

        }


        setProfileExists(true);


        // -----------------------------------------------------
        // LOAD SAVED PROFILE DETAILS
        // -----------------------------------------------------

        setFormData({

          headline:
            profile.headline || "",

          summary:
            profile.summary || "",

          location:
            profile.location || "",

          experience:
            profile.experience_years != null
              ? String(profile.experience_years)
              : "",

          education:
            typeof profile.education === "object"
              ? profile.education?.details || ""
              : profile.education || "",

          projects:
            Array.isArray(profile.projects)
              ? profile.projects.join(", ")
              : profile.projects || "",

          certifications:
            Array.isArray(profile.certifications)
              ? profile.certifications.join(", ")
              : profile.certifications || "",

          preferredJobType:
            profile.preferred_job_type || "",

          preferredLocation:
            profile.preferred_location || "",

          preferredRole:
            profile.preferred_role || "",

          expectedSalary:
            profile.expected_salary != null
              ? String(profile.expected_salary)
              : "",

        });


        // -----------------------------------------------------
        // LOAD SAVED SKILLS IF AVAILABLE
        // -----------------------------------------------------

        if (Array.isArray(profile.skills)) {

          setSkills(profile.skills);

        } else if (
          Array.isArray(profile.extracted_skills)
        ) {

          setSkills(profile.extracted_skills);

        } else {

          setSkills([]);

        }


      } catch (error) {

        console.error(
          "Profile loading error:",
          error
        );


        // -----------------------------------------------------
        // NO PROFILE EXISTS
        // -----------------------------------------------------

        if (
          error.response?.status === 404
        ) {

          setProfileExists(false);

          setFormData({

            headline: "",
            summary: "",
            location: "",
            experience: "",
            education: "",
            projects: "",
            certifications: "",
            preferredJobType: "",
            preferredLocation: "",
            preferredRole: "",
            expectedSalary: "",

          });

          setSkills([]);

        } else {

          setError(
            error.response?.data?.detail ||
            "Failed to load profile."
          );

        }

      } finally {

        setIsProfileLoading(false);

      }

    };


    loadProfile();

  }, []);


  // =========================================================
  // GENERAL INPUT
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previousData) => ({

        ...previousData,

        [name]: value,

      })
    );


    setError("");

  };


  // =========================================================
  // SKILL SUGGESTIONS
  // =========================================================

  const filteredSkills =
    skillInput.trim() === ""
      ? []
      : EXISTING_SKILLS
          .filter((skill) =>
            skill
              .toLowerCase()
              .includes(
                skillInput.toLowerCase()
              )
          )
          .filter(
            (skill) =>
              !skills.includes(skill)
          );


  // =========================================================
  // ADD EXISTING SKILL
  // =========================================================

  const addExistingSkill = (skill) => {

    if (!skills.includes(skill)) {

      setSkills(
        (previousSkills) => [
          ...previousSkills,
          skill,
        ]
      );

    }


    setSkillInput("");

  };


  // =========================================================
  // ADD CUSTOM SKILL
  // =========================================================

  const addCustomSkill = () => {

    const newSkill =
      skillInput.trim();


    if (!newSkill) return;


    const existingSkill =
      EXISTING_SKILLS.find(
        (skill) =>
          skill.toLowerCase() ===
          newSkill.toLowerCase()
      );


    if (existingSkill) {

      addExistingSkill(
        existingSkill
      );

      return;

    }


    if (!skills.includes(newSkill)) {

      setSkills(
        (previousSkills) => [
          ...previousSkills,
          newSkill,
        ]
      );

    }


    setSkillInput("");

  };


  // =========================================================
  // REMOVE SKILL
  // =========================================================

  const removeSkill = (
    skillToRemove
  ) => {

    setSkills(
      (previousSkills) =>
        previousSkills.filter(
          (skill) =>
            skill !== skillToRemove
        )
    );

  };


  // =========================================================
  // ENTER KEY
  // =========================================================

  const handleSkillKeyDown = (
    event
  ) => {

    if (event.key === "Enter") {

      event.preventDefault();


      if (
        filteredSkills.length > 0
      ) {

        addExistingSkill(
          filteredSkills[0]
        );

      } else {

        addCustomSkill();

      }

    }

  };


  // =========================================================
  // SALARY
  // =========================================================

  const handleSalaryChange = (
    event
  ) => {

    const value =
      event.target.value.replace(
        /\D/g,
        ""
      );


    setFormData(
      (previousData) => ({

        ...previousData,

        expectedSalary: value,

      })
    );


    setError("");

  };


  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {

    if (
      !formData.headline.trim()
    ) {

      return "Please enter your professional headline.";

    }


    if (
      !formData.summary.trim()
    ) {

      return "Please enter your professional summary.";

    }


    if (
      !formData.location.trim()
    ) {

      return "Please enter your current location.";

    }


    if (
      formData.experience === ""
    ) {

      return "Please select your experience.";

    }


    if (
      !formData.education.trim()
    ) {

      return "Please enter your education.";

    }


    if (skills.length === 0) {

      return "Please add at least one skill.";

    }


    if (
      formData.preferredRole &&
      !EXISTING_ROLES.includes(
        formData.preferredRole
      )
    ) {

      return "Please select a valid preferred job role.";

    }


    if (
      formData.expectedSalary
    ) {

      const salary =
        Number(
          formData.expectedSalary
        );


      if (
        salary < MIN_SALARY
      ) {

        return `Expected salary must be at least ₹${MIN_SALARY.toLocaleString(
          "en-IN"
        )}.`;

      }

    }


    return "";

  };


  // =========================================================
  // CREATE / UPDATE PROFILE PAYLOAD
  // =========================================================

  const getProfilePayload = () => {

    return {

      headline:
        formData.headline,

      summary:
        formData.summary,

      location:
        formData.location,

      experience_years:
        Number(
          formData.experience
        ),

      // Keep existing backend format
      education: {

        details:
          formData.education,

      },

      projects:
        formData.projects
          ? [formData.projects]
          : [],

      certifications:
        formData.certifications
          ? [formData.certifications]
          : [],

      preferred_job_type:
        formData.preferredJobType,

      preferred_location:
        formData.preferredLocation,

    };

  };


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const saveProfile = async () => {

    const validationError =
      validateForm();


    if (validationError) {

      setError(
        validationError
      );

      return false;

    }


    setIsLoading(true);

    setError("");


    try {

      const payload =
        getProfilePayload();


      // -----------------------------------------------------
      // UPDATE EXISTING PROFILE
      // -----------------------------------------------------

      if (profileExists) {

        const response =
          await api.put(
            "/api/profile/",
            payload
          );


        console.log(
          "Profile updated:",
          response.data
        );


        return true;

      }


      // -----------------------------------------------------
      // CREATE NEW PROFILE
      // -----------------------------------------------------

      const response =
        await api.post(
          "/api/profile/",
          payload
        );


      console.log(
        "Profile created:",
        response.data
      );


      setProfileExists(true);


      return true;


    } catch (error) {

      console.error(
        "Profile save error:",
        error
      );


      const errDetail =
        error.response?.data?.detail;


      if (
        Array.isArray(errDetail)
      ) {

        setError(
          `Validation error: ${errDetail[0].loc[1]} - ${errDetail[0].msg}`
        );

      } else {

        setError(
          errDetail ||
          "Failed to save profile."
        );

      }


      return false;

    } finally {

      setIsLoading(false);

    }

  };


  // =========================================================
  // SAVE PROFILE & CONTINUE
  // =========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    const saved =
      await saveProfile();


    if (!saved) return;


    // Keep existing workflow
    navigate(
      "/upload-resume"
    );

  };


  // =========================================================
  // SAVE PROFILE & GO TO DASHBOARD
  // =========================================================

  const handleGoToDashboard =
    async () => {

      const saved =
        await saveProfile();


      if (!saved) return;


      navigate(
        "/candidate-dashboard"
      );

    };


  // =========================================================
  // PROFILE LOADING
  // =========================================================

  if (isProfileLoading) {

    return (

      <div
        className="profile-page"
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >

        <div
          className="profile-loading"
          style={{
            textAlign: "center",
          }}
        >

          <div
            className="button-spinner"
          >
          </div>

          <p>
            Loading your profile...
          </p>

        </div>

      </div>

    );

  }


  return (

    <div className="profile-page">

      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <header className="profile-header">

        <div className="profile-brand">

          <div className="profile-brand-icon">
            SX
          </div>

          <div>

            <div className="profile-brand-name">
              SwipeX
            </div>

            <div className="profile-brand-subtitle">
            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className="profile-main"
        style={{
          width: "100%",
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          justifyContent: "center",
          boxSizing: "border-box",
          padding: "30px 24px",
        }}
      >

        <div
          className="profile-wrapper"
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >

          {/* PAGE INTRO */}

          <div className="profile-intro">

            <div className="profile-intro-icon">
              ✦
            </div>

            <div>

              <p className="profile-eyebrow">
              </p>

              <h1>
                Complete Your Profile
              </h1>

              <p className="profile-description">
                
              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="profile-error">

              <span className="profile-error-icon">
                !
              </span>

              <div>

                <strong>
                  Please check your information
                </strong>

                <p>
                  {error}
                </p>

              </div>

            </div>

          )}


          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="profile-form"
            style={{
              width: "100%",
            }}
          >

            {/* =================================================
                SECTION 1 — PROFESSIONAL INFORMATION
            ================================================= */}

            <section className="profile-section">

              <div className="section-heading">

                <div className="section-number">
                  01
                </div>

                <div>

                  <h2>
                    Professional Information
                  </h2>

                  <p>
                    Tell us about your professional background.
                  </p>

                </div>

              </div>


              <div className="profile-grid">

                {/* HEADLINE */}

                <div className="profile-field full-width">

                  <label htmlFor="headline">

                    Professional Headline

                    <span className="required-mark">
                      *
                    </span>

                  </label>

                  <input
                    id="headline"
                    name="headline"
                    type="text"
                    value={formData.headline}
                    onChange={handleChange}
                    required
                  />

                  <p className="field-hint">
                    A short title that describes your professional
                    identity.
                  </p>

                </div>


                {/* SUMMARY */}

                <div className="profile-field full-width">

                  <label htmlFor="summary">

                    Professional Summary

                    <span className="required-mark">
                      *
                    </span>

                  </label>

                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleChange}
                    placeholder="Briefly describe your background, interests and career goals..."
                    rows="5"
                    required
                  />

                </div>


                {/* LOCATION */}

                <div className="profile-field">

                  <label htmlFor="location">

                    Current Location

                    <span className="required-mark">
                      *
                    </span>

                  </label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* EXPERIENCE */}

                <div className="profile-field">

                  <label htmlFor="experience">

                    Experience

                    <span className="required-mark">
                      *
                    </span>

                  </label>

                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select experience
                    </option>

                    <option value="0">
                      Fresher
                    </option>

                    <option value="0.5">
                      0-1 Years
                    </option>

                    <option value="1.5">
                      1-2 Years
                    </option>

                    <option value="3.5">
                      2-5 Years
                    </option>

                    <option value="7.5">
                      5-10 Years
                    </option>

                    <option value="10">
                      10+ Years
                    </option>

                  </select>

                </div>


                {/* EDUCATION */}

                <div className="profile-field full-width">

                  <label htmlFor="education">

                    Education

                    <span className="required-mark">
                      *
                    </span>

                  </label>

                  <input
                    id="education"
                    name="education"
                    type="text"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. B.Tech Computer Science"
                    required
                  />

                </div>

              </div>

            </section>


            {/* =================================================
                SECTION 2 — SKILLS
            ================================================= */}

            <section className="profile-section">

              <div className="section-heading">

                <div className="section-number">
                  02
                </div>

                <div>

                  <h2>
                    Skills
                  </h2>

                  

                </div>

              </div>


              <div className="profile-field">

                <label htmlFor="skills">

                  Skills

                  <span className="required-mark">
                    *
                  </span>

                </label>


                <div className="skill-input-container-new">

                  <span className="skill-search-icon">
                    ⌕
                  </span>

                  <input
                    id="skills"
                    type="text"
                    value={skillInput}
                    onChange={(event) =>
                      setSkillInput(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleSkillKeyDown
                    }
                    placeholder="Search or type a skill..."
                  />

                </div>


                {/* SUGGESTIONS */}

                {filteredSkills.length > 0 && (

                  <div className="skill-suggestions-new">

                    <div className="suggestion-title">
                      Suggested skills
                    </div>

                    {filteredSkills
                      .slice(0, 8)
                      .map((skill) => (

                        <button
                          type="button"
                          key={skill}
                          className="skill-suggestion-new"
                          onClick={() =>
                            addExistingSkill(
                              skill
                            )
                          }
                        >

                          <span>
                            +
                          </span>

                          {skill}

                        </button>

                      ))}

                  </div>

                )}


                {/* CUSTOM SKILL */}

                {skillInput.trim() !== "" &&
                  filteredSkills.length === 0 && (

                    <button
                      type="button"
                      className="add-custom-skill-new"
                      onClick={
                        addCustomSkill
                      }
                    >
                      + Add "{skillInput.trim()}"
                    </button>

                  )}


                {/* SELECTED SKILLS */}

                {skills.length > 0 && (

                  <div className="selected-skills-new">

                    <div className="selected-skills-label">
                      Your skills
                    </div>

                    <div className="skill-tags">

                      {skills.map((skill) => (

                        <span
                          className="selected-skill-new"
                          key={skill}
                        >

                          {skill}

                          <button
                            type="button"
                            onClick={() =>
                              removeSkill(
                                skill
                              )
                            }
                            aria-label={`Remove ${skill}`}
                          >
                            ×
                          </button>

                        </span>

                      ))}

                    </div>

                  </div>

                )}

                <p className="field-hint">
                  Start typing to find an existing skill.
                  If it is not available, you can add your own.
                  Press Enter to add a skill.
                </p>

              </div>

            </section>


            {/* =================================================
                SECTION 4 — JOB PREFERENCES
            ================================================= */}

            <section className="profile-section">

              <div className="section-heading">

                <div className="section-number">
                  03
                </div>

                <div>

                  <h2>
                    Job Preferences
                  </h2>

                  

                </div>

              </div>


              <div className="profile-grid">

                {/* JOB TYPE */}

                <div className="profile-field">

                  <label htmlFor="preferredJobType">
                    Preferred Job Type
                  </label>

                  <select
                    id="preferredJobType"
                    name="preferredJobType"
                    value={
                      formData.preferredJobType
                    }
                    onChange={handleChange}
                  >

                    <option value="">
                      Select job type
                    </option>

                    <option value="Full Time">
                      Full Time
                    </option>

                    <option value="Part Time">
                      Part Time
                    </option>

                    <option value="Internship">
                      Internship
                    </option>

                    <option value="Contract">
                      Contract
                    </option>

                  </select>

                </div>


                {/* PREFERRED LOCATION */}

                <div className="profile-field">

                  <label htmlFor="preferredLocation">

                    Preferred Location

                    <span className="optional-label-new">
                      Optional
                    </span>

                  </label>

                  <input
                    id="preferredLocation"
                    name="preferredLocation"
                    type="text"
                    value={
                      formData.preferredLocation
                    }
                    onChange={handleChange}
                  />

                </div>


                {/* PREFERRED ROLE */}

                <div className="profile-field">

                  <label htmlFor="preferredRole">

                    Preferred Job Role

                    <span className="optional-label-new">
                      Optional
                    </span>

                  </label>

                  <select
                    id="preferredRole"
                    name="preferredRole"
                    value={
                      formData.preferredRole
                    }
                    onChange={handleChange}
                  >

                    <option value="">
                      Select preferred role
                    </option>

                    {EXISTING_ROLES.map(
                      (role) => (

                        <option
                          value={role}
                          key={role}
                        >
                          {role}
                        </option>

                      )
                    )}

                  </select>

                  <p className="field-hint">
                  </p>

                </div>


                {/* EXPECTED SALARY */}

                <div className="profile-field">

                  <label htmlFor="expectedSalary">

                    Expected Salary

                    <span className="optional-label-new">
                      Optional
                    </span>

                  </label>

                  <div className="salary-input">

                    <span className="currency-symbol">
                      ₹
                    </span>

                    <input
                      id="expectedSalary"
                      name="expectedSalary"
                      type="text"
                      inputMode="numeric"
                      value={
                        formData.expectedSalary
                      }
                      onChange={
                        handleSalaryChange
                      }
                    />

                  </div>

                  <p className="field-hint">
                    Enter salary as a number only.
                    Minimum accepted value is ₹
                    {MIN_SALARY.toLocaleString(
                      "en-IN"
                    )}.
                  </p>

                </div>

              </div>

            </section>


            {/* =================================================
                SUBMIT AREA
            ================================================= */}

            <div
              className="profile-submit-area"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >

              {/* =================================================
                  GO TO DASHBOARD BUTTON — LEFT SIDE
              ================================================= */}

              <button
                type="button"
                onClick={
                  handleGoToDashboard
                }
                disabled={isLoading}
                style={{
                  padding: "13px 24px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isLoading
                    ? "not-allowed"
                    : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    "0 2px 6px rgba(0, 0, 0, 0.08)",
                }}
              >
                Back to Dashboard
              </button>


              {/* =================================================
                  EXISTING SAVE & CONTINUE BUTTON — RIGHT SIDE
              ================================================= */}

              <button
                type="submit"
                className="profile-submit-button"
                disabled={isLoading}
              >

                {isLoading ? (

                  <>

                    <span className="button-spinner"></span>

                    Saving Profile...

                  </>

                ) : (

                  <>

                    Save Profile & Continue

                    <span className="button-arrow">
                      →
                    </span>

                  </>

                )}

              </button>

            </div>

          </form>

        </div>

      </main>

    </div>

  );

}


export default CompleteProfile;
