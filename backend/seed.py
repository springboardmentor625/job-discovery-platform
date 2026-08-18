from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Company, Job
import datetime
import random
def seed_data():
    db = SessionLocal()
    if db.query(Company).count() > 0:
        print("Data already seeded.")
        db.close()
        return
    companies_data = [
        dict(company_name="Google", company_type="MNC", industry="Technology",
             website="google.com", headquarters="Bangalore, Karnataka",
             career_page="https://careers.google.com"),
        dict(company_name="Microsoft", company_type="MNC", industry="Technology",
             website="microsoft.com", headquarters="Hyderabad, Telangana",
             career_page="https://careers.microsoft.com"),
        dict(company_name="Amazon", company_type="MNC", industry="Technology",
             website="amazon.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.amazon.jobs"),
        dict(company_name="Infosys", company_type="MNC", industry="IT Services",
             website="infosys.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.infosys.com/careers"),
        dict(company_name="TCS", company_type="MNC", industry="IT Services",
             website="tcs.com", headquarters="Mumbai, Maharashtra",
             career_page="https://ibegin.tcs.com/iBegin"),
        dict(company_name="Wipro", company_type="MNC", industry="IT Services",
             website="wipro.com", headquarters="Bangalore, Karnataka",
             career_page="https://careers.wipro.com"),
        dict(company_name="HCL Technologies", company_type="MNC", industry="IT Services",
             website="hcltech.com", headquarters="Noida, Uttar Pradesh",
             career_page="https://www.hcltech.com/careers"),
        dict(company_name="Accenture", company_type="MNC", industry="Consulting",
             website="accenture.com", headquarters="Mumbai, Maharashtra",
             career_page="https://www.accenture.com/in-en/careers"),
        dict(company_name="Flipkart", company_type="Unicorn", industry="E-Commerce",
             website="flipkart.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.flipkartcareers.com"),
        dict(company_name="Razorpay", company_type="Unicorn", industry="Fintech",
             website="razorpay.com", headquarters="Bangalore, Karnataka",
             career_page="https://razorpay.com/jobs"),
        dict(company_name="Swiggy", company_type="Unicorn", industry="Food Tech",
             website="swiggy.com", headquarters="Bangalore, Karnataka",
             career_page="https://careers.swiggy.com"),
        dict(company_name="Zomato", company_type="Public", industry="Food Tech",
             website="zomato.com", headquarters="Gurugram, Haryana",
             career_page="https://www.zomato.com/careers"),
        dict(company_name="PhonePe", company_type="Unicorn", industry="Fintech",
             website="phonepe.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.phonepe.com/careers"),
        dict(company_name="Atlassian", company_type="MNC", industry="Technology",
             website="atlassian.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.atlassian.com/company/careers"),
        dict(company_name="Adobe", company_type="MNC", industry="Technology",
             website="adobe.com", headquarters="Noida, Uttar Pradesh",
             career_page="https://www.adobe.com/careers.html"),
        dict(company_name="Salesforce", company_type="MNC", industry="CRM/Cloud",
             website="salesforce.com", headquarters="Hyderabad, Telangana",
             career_page="https://www.salesforce.com/company/careers"),
        dict(company_name="Oracle", company_type="MNC", industry="Technology",
             website="oracle.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.oracle.com/careers"),
        dict(company_name="IBM", company_type="MNC", industry="Technology",
             website="ibm.com", headquarters="Bangalore, Karnataka",
             career_page="https://www.ibm.com/employment"),
        dict(company_name="Capgemini", company_type="MNC", industry="IT Services",
             website="capgemini.com", headquarters="Mumbai, Maharashtra",
             career_page="https://www.capgemini.com/in-en/careers"),
        dict(company_name="Deloitte", company_type="MNC", industry="Consulting",
             website="deloitte.com", headquarters="Mumbai, Maharashtra",
             career_page="https://www2.deloitte.com/in/en/careers.html"),
    ]
    companies = []
    for cd in companies_data:
        c = Company(**cd)
        db.add(c)
        companies.append(c)
    db.flush()
    locations = [
        "Bangalore, Karnataka", "Mumbai, Maharashtra", "Hyderabad, Telangana",
        "Chennai, Tamil Nadu", "New Delhi, Delhi", "Pune, Maharashtra",
        "Noida, Uttar Pradesh", "Gurugram, Haryana", "Kochi, Kerala",
        "Kolkata, West Bengal", "Ahmedabad, Gujarat", "Remote",
    ]
    jobs_data = [
        ("Software Engineer III", "Design and implement scalable software systems in Google's core infrastructure. Solve complex distributed systems problems, mentor junior engineers, and drive technical excellence across teams.", ["Python", "Java", "Go", "Kubernetes", "SQL", "Distributed Systems", "Git"], "Full-time", 3, 7, 2500000, 5000000, "https://careers.google.com/jobs/results/?q=Software+Engineer"),
        ("Senior Software Engineer – AI/ML", "Lead development of machine learning infrastructure powering Google's AI products. Build ML pipelines, optimize model serving, and collaborate with researchers to ship production AI features.", ["Python", "TensorFlow", "Machine Learning", "Kubernetes", "Go", "SQL", "Deep Learning"], "Full-time", 5, 10, 4000000, 8000000, "https://careers.google.com/jobs/results/?q=Machine+Learning+Engineer"),
        ("Frontend Engineer – Google Maps", "Build the next generation of Google Maps UI using Angular and TypeScript. Design highly performant map rendering components, implement real-time data visualizations, and ensure cross-browser compatibility.", ["Angular", "TypeScript", "JavaScript", "HTML", "CSS", "REST", "Git"], "Full-time", 2, 6, 2000000, 4500000, "https://careers.google.com/jobs/results/?q=Frontend+Engineer"),
        ("Site Reliability Engineer", "Ensure reliability and performance of Google's production systems serving billions of users. Build monitoring infrastructure, automate incident response, and drive SLO/SLI improvements.", ["Python", "Go", "Kubernetes", "Linux", "Terraform", "Prometheus", "CI/CD"], "Full-time", 3, 8, 3000000, 6000000, "https://careers.google.com/jobs/results/?q=Site+Reliability+Engineer"),
        ("Data Engineer – Google Cloud", "Design and build large-scale data pipelines on Google Cloud Platform. Work with BigQuery, Dataflow, and Pub/Sub to process petabytes of data for analytics and ML workloads.", ["Python", "SQL", "Apache Spark", "BigQuery", "Airflow", "Kafka", "ETL", "GCP"], "Full-time", 2, 6, 2500000, 5000000, "https://careers.google.com/jobs/results/?q=Data+Engineer"),
        ("Software Engineer – Azure", "Build cloud-native services on Microsoft Azure. Design REST APIs, implement microservices architecture, and ensure high availability and security for enterprise customers.", ["C#", ".NET", "Azure", "Docker", "Kubernetes", "SQL", "REST", "Git"], "Full-time", 2, 6, 2000000, 4500000, "https://jobs.careers.microsoft.com/global/en/search?q=Software+Engineer"),
        ("Senior Full Stack Engineer – Teams", "Build and scale Microsoft Teams features used by 300M+ daily active users. Own feature development from backend services to React frontend components.", ["React", "TypeScript", "Node.js", "C#", "Azure", "SQL", "Microservices"], "Full-time", 4, 8, 3500000, 7000000, "https://jobs.careers.microsoft.com/global/en/search?q=Full+Stack+Engineer"),
        ("Machine Learning Engineer – Bing", "Build ML models powering Bing's search ranking, natural language understanding, and personalization. Work with large-scale datasets and cutting-edge LLM technologies.", ["Python", "PyTorch", "Machine Learning", "NLP", "Transformers", "Azure", "SQL"], "Full-time", 3, 8, 3000000, 6500000, "https://jobs.careers.microsoft.com/global/en/search?q=Machine+Learning"),
        ("DevOps Engineer – Azure DevOps", "Develop and maintain CI/CD infrastructure for Azure DevOps platform. Build deployment automation, manage cloud infrastructure at scale, and improve developer productivity.", ["Azure", "Docker", "Kubernetes", "Terraform", "Python", "CI/CD", "Linux"], "Full-time", 2, 6, 2000000, 4000000, "https://jobs.careers.microsoft.com/global/en/search?q=DevOps+Engineer"),
        ("Security Engineer – Microsoft Defender", "Build and enhance Microsoft Defender security products. Develop threat detection algorithms, improve endpoint security, and protect millions of enterprise customers.", ["Python", "C++", "Cybersecurity", "Machine Learning", "Azure", "OWASP", "Penetration Testing"], "Full-time", 3, 7, 2800000, 5500000, "https://jobs.careers.microsoft.com/global/en/search?q=Security+Engineer"),
        ("Software Development Engineer I", "Build and scale Amazon's core e-commerce systems. Design distributed services, write clean maintainable code, and own features from design through deployment.", ["Java", "Python", "AWS", "SQL", "Docker", "REST", "Git"], "Full-time", 0, 3, 1500000, 3000000, "https://www.amazon.jobs/en/search?base_query=Software+Development+Engineer"),
        ("SDE II – Amazon Pay", "Own the technical architecture for Amazon Pay's payment processing systems. Build fault-tolerant payment services handling millions of daily transactions.", ["Java", "Python", "AWS", "SQL", "Microservices", "DynamoDB", "Kafka", "Docker"], "Full-time", 3, 6, 3000000, 5500000, "https://www.amazon.jobs/en/search?base_query=Software+Engineer+Pay"),
        ("Data Scientist – Amazon Ads", "Build ML models to improve Amazon's advertising targeting and bidding systems. Work with massive datasets to optimize ad relevance, click-through rates, and advertiser ROI.", ["Python", "Machine Learning", "SQL", "Pandas", "Scikit-learn", "Spark", "R"], "Full-time", 2, 6, 2500000, 5000000, "https://www.amazon.jobs/en/search?base_query=Data+Scientist"),
        ("Cloud Support Engineer – AWS", "Provide technical support for AWS services to enterprise customers. Troubleshoot complex cloud architecture issues, write technical guides, and improve AWS documentation.", ["AWS", "Linux", "Python", "Networking", "Docker", "SQL", "Bash"], "Full-time", 1, 4, 1200000, 2500000, "https://www.amazon.jobs/en/search?base_query=Cloud+Support+Engineer"),
        ("Backend Engineer – Alexa", "Build the natural language processing and conversational AI systems behind Alexa. Develop intent recognition, dialogue management, and real-time inference APIs.", ["Python", "Java", "NLP", "Machine Learning", "AWS", "Kubernetes", "REST"], "Full-time", 2, 6, 2500000, 5500000, "https://www.amazon.jobs/en/search?base_query=Backend+Engineer+Alexa"),
        ("Technology Analyst – Digital", "Drive digital transformation projects for global enterprise clients. Build cloud-native applications using modern tech stacks and lead technical delivery teams.", ["Java", "Python", "AWS", "Angular", "SQL", "Microservices", "Docker"], "Full-time", 2, 5, 900000, 2000000, "https://career.infosys.com/jobdesc?jobReferenceCode=INFSYS-EXTERNAL-362649"),
        ("Associate – Systems Engineer", "Join Infosys as a fresher Systems Engineer. Get trained in enterprise technologies and work on large-scale IT projects for Fortune 500 clients worldwide.", ["Java", "SQL", "Python", "Git", "HTML", "CSS"], "Full-time", 0, 2, 350000, 700000, "https://career.infosys.com/jobdesc?jobReferenceCode=INFSYS-EXTERNAL-362650"),
        ("Senior Technology Lead – AI", "Lead AI/ML initiatives for Infosys enterprise clients. Design ML solutions, manage teams, and ensure successful delivery of AI projects from PoC to production.", ["Python", "Machine Learning", "TensorFlow", "Deep Learning", "SQL", "Cloud", "Leadership"], "Full-time", 7, 12, 2500000, 4500000, "https://career.infosys.com/jobdesc?jobReferenceCode=INFSYS-EXTERNAL-362651"),
        ("Full Stack Developer – .NET", "Build enterprise web applications using ASP.NET Core and React for Infosys clients in banking and financial services domains.", ["C#", ".NET", "React", "SQL", "Azure", "JavaScript", "REST"], "Full-time", 2, 5, 800000, 1800000, "https://career.infosys.com/jobdesc?jobReferenceCode=INFSYS-EXTERNAL-362652"),
        ("DevOps Engineer – Cloud Native", "Implement CI/CD pipelines and cloud infrastructure for Infosys's enterprise clients. Work with AWS/Azure/GCP and modern container orchestration platforms.", ["Docker", "Kubernetes", "AWS", "Azure", "Jenkins", "Terraform", "Python", "Linux"], "Full-time", 2, 6, 1000000, 2500000, "https://career.infosys.com/jobdesc?jobReferenceCode=INFSYS-EXTERNAL-362653"),
        ("Java Developer – TCS", "Develop enterprise Java applications for TCS's banking and insurance clients. Design RESTful microservices using Spring Boot and deploy on cloud platforms.", ["Java", "Spring Boot", "SQL", "Microservices", "Docker", "AWS", "REST", "Git"], "Full-time", 1, 4, 600000, 1500000, "https://ibegin.tcs.com/iBegin/faces/pages/login.xhtml"),
        ("Data Analyst – TCS iON", "Analyze data to generate actionable insights for TCS's enterprise customers. Build dashboards, write SQL queries, and present findings using Tableau and Power BI.", ["SQL", "Python", "Power BI", "Tableau", "Data Analysis", "Excel", "Pandas"], "Full-time", 0, 3, 500000, 1200000, "https://ibegin.tcs.com/iBegin/faces/pages/login.xhtml"),
        ("React Developer – TCS", "Build responsive web UIs for TCS's digital commerce clients. Develop reusable React components, integrate REST APIs, and ensure optimal page performance.", ["React", "JavaScript", "TypeScript", "HTML", "CSS", "REST", "Redux"], "Full-time", 1, 4, 700000, 1600000, "https://ibegin.tcs.com/iBegin/faces/pages/login.xhtml"),
        ("Python Developer – TCS", "Develop automation scripts and backend APIs for TCS process automation solutions. Work with FastAPI/Django, databases, and cloud services.", ["Python", "FastAPI", "Django", "PostgreSQL", "REST", "Docker", "Git"], "Full-time", 1, 4, 650000, 1500000, "https://ibegin.tcs.com/iBegin/faces/pages/login.xhtml"),
        ("QA Engineer – TCS", "Design and execute test strategies for enterprise web and mobile applications. Build automated regression suites using Selenium and Cypress.", ["Selenium", "Cypress", "Python", "Jest", "SQL", "Jira", "Git"], "Full-time", 1, 4, 500000, 1200000, "https://ibegin.tcs.com/iBegin/faces/pages/login.xhtml"),
        ("Software Engineer – Wipro", "Join Wipro's engineering practice to build scalable software solutions for global clients. Work in agile teams and deliver high-quality code across the full stack.", ["Java", "Python", "SQL", "REST", "Git", "Docker", "Agile"], "Full-time", 1, 4, 600000, 1400000, "https://careers.wipro.com/careers-home/jobs?keywords=Software+Engineer"),
        ("Cloud Engineer – GCP", "Design and deploy cloud-native solutions on Google Cloud Platform for Wipro's enterprise clients. Build serverless architectures, manage GKE clusters, and optimize cloud costs.", ["GCP", "Kubernetes", "Docker", "Terraform", "Python", "Linux", "Serverless"], "Full-time", 2, 6, 1200000, 2800000, "https://careers.wipro.com/careers-home/jobs?keywords=Cloud+Engineer"),
        ("Salesforce Developer – Wipro", "Build and customize Salesforce applications for enterprise CRM implementations. Develop Apex triggers, LWC components, and Salesforce integrations.", ["Salesforce", "Apex", "JavaScript", "SQL", "REST", "Git", "CRM"], "Full-time", 2, 5, 1000000, 2200000, "https://careers.wipro.com/careers-home/jobs?keywords=Salesforce"),
        ("SAP ABAP Developer", "Develop and maintain SAP ABAP programs for Wipro's manufacturing and retail clients. Build custom reports, interface programs, and BADI/BTE enhancements.", ["SAP", "SQL", "ABAP", "Git", "Agile"], "Full-time", 2, 7, 1200000, 3000000, "https://careers.wipro.com/careers-home/jobs?keywords=SAP+ABAP"),
        ("iOS Developer – Wipro", "Build native iOS applications for enterprise clients in banking and healthcare sectors. Develop Swift/SwiftUI apps, integrate REST APIs, and ensure performance optimization.", ["Swift", "iOS", "SwiftUI", "REST", "Git", "Xcode", "SQL"], "Full-time", 2, 5, 1200000, 2500000, "https://careers.wipro.com/careers-home/jobs?keywords=iOS+Developer"),
        ("Software Development Engineer – Flipkart", "Build and scale Flipkart's e-commerce platform handling millions of daily orders. Own microservices, optimize system performance, and mentor junior engineers.", ["Java", "Python", "Kafka", "MySQL", "Redis", "Microservices", "Docker", "Kubernetes"], "Full-time", 2, 6, 2000000, 4500000, "https://www.flipkartcareers.com/#!/jobDetail/2000000190"),
        ("Data Scientist – Recommendations", "Build the recommendation engine powering Flipkart's product discovery. Develop collaborative filtering models, A/B test algorithms, and improve click-through and conversion rates.", ["Python", "Machine Learning", "Spark", "SQL", "Pandas", "Scikit-learn", "TensorFlow"], "Full-time", 2, 6, 2500000, 5000000, "https://www.flipkartcareers.com/#!/jobDetail/2000000191"),
        ("Frontend Engineer – Flipkart", "Build high-performance React UIs for Flipkart's shopping experience. Implement real-time features, improve Core Web Vitals, and build design system components.", ["React", "TypeScript", "JavaScript", "Redux", "HTML", "CSS", "Next.js", "Webpack"], "Full-time", 2, 5, 1800000, 3500000, "https://www.flipkartcareers.com/#!/jobDetail/2000000192"),
        ("Android Developer – Flipkart App", "Build Flipkart's Android shopping app used by 100M+ users. Develop Kotlin features, optimize app performance, implement ML-powered features, and maintain high code quality.", ["Kotlin", "Android", "Jetpack Compose", "REST", "SQL", "Git", "Java"], "Full-time", 2, 5, 2000000, 4000000, "https://www.flipkartcareers.com/#!/jobDetail/2000000193"),
        ("DevOps Engineer – Flipkart Commerce", "Manage Flipkart's massive compute infrastructure during events like Big Billion Days. Build self-healing systems, automate deployments, and ensure 99.99% uptime.", ["Kubernetes", "Docker", "AWS", "Terraform", "Python", "Linux", "CI/CD", "Prometheus"], "Full-time", 3, 7, 2500000, 5000000, "https://www.flipkartcareers.com/#!/jobDetail/2000000194"),
        ("Backend Engineer – Payments Core", "Build Razorpay's payment processing engine handling ₹5L crore annually. Design fault-tolerant distributed systems, implement payment gateway integrations, and optimize transaction success rates.", ["Go", "Python", "MySQL", "Redis", "Kafka", "Microservices", "Docker", "AWS"], "Full-time", 2, 6, 2000000, 4500000, "https://razorpay.com/jobs/apply/backend-engineer-payments-core"),
        ("Full Stack Engineer – Dashboard", "Build Razorpay's merchant dashboard used by 8M+ businesses. Develop React frontend, Node.js APIs, and data visualization components for real-time payment analytics.", ["React", "Node.js", "TypeScript", "PostgreSQL", "Redis", "REST", "Docker"], "Full-time", 1, 4, 1500000, 3000000, "https://razorpay.com/jobs/apply/fullstack-engineer-dashboard"),
        ("Data Engineer – Razorpay", "Build data infrastructure powering Razorpay's analytics and ML platforms. Design Spark pipelines, build real-time streaming systems with Kafka, and maintain data warehouses.", ["Python", "Spark", "Kafka", "SQL", "Airflow", "AWS", "ETL", "Data Pipeline"], "Full-time", 2, 5, 1800000, 3500000, "https://razorpay.com/jobs/apply/data-engineer"),
        ("Security Engineer – Fintech", "Secure Razorpay's payment infrastructure against fraud and cyber threats. Build real-time fraud detection systems, conduct security audits, and ensure PCI-DSS compliance.", ["Python", "Cybersecurity", "Machine Learning", "SQL", "AWS", "OWASP", "Penetration Testing"], "Full-time", 3, 7, 2500000, 5000000, "https://razorpay.com/jobs/apply/security-engineer"),
        ("Product Analyst – Growth", "Use data to drive Razorpay's growth strategy. Build dashboards, conduct cohort analyses, and present insights to leadership that influence product roadmap decisions.", ["SQL", "Python", "Tableau", "Data Analysis", "Excel", "Power BI"], "Full-time", 1, 4, 1000000, 2000000, "https://razorpay.com/jobs/apply/product-analyst-growth"),
        ("SDE II – Swiggy Supply", "Build Swiggy's restaurant onboarding and catalog management systems. Design APIs consumed by restaurant partners, develop admin dashboards, and ensure data accuracy.", ["Java", "Python", "MySQL", "Redis", "Kafka", "Microservices", "Docker"], "Full-time", 2, 5, 1800000, 3500000, "https://careers.swiggy.com/#/careers?src=careers"),
        ("Data Scientist – Delivery ETA", "Build ML models to predict accurate delivery times for Swiggy's 100M+ orders. Use real-time traffic data, weather signals, and historical patterns to improve ETA prediction.", ["Python", "Machine Learning", "SQL", "Pandas", "TensorFlow", "Scikit-learn", "Spark"], "Full-time", 2, 5, 2000000, 4000000, "https://careers.swiggy.com/#/careers?src=careers"),
        ("React Native Developer – Swiggy", "Build cross-platform features for Swiggy's consumer app with 85M+ downloads. Implement smooth animations, optimize startup performance, and ship weekly releases.", ["React Native", "JavaScript", "TypeScript", "Redux", "REST", "Mobile Development"], "Full-time", 2, 5, 1800000, 3500000, "https://careers.swiggy.com/#/careers?src=careers"),
        ("Platform Engineer – Swiggy", "Build Swiggy's internal developer platform serving 800+ engineers. Create self-service deployment tools, improve CI/CD pipelines, and reduce time-to-production.", ["Kubernetes", "Terraform", "Python", "Go", "AWS", "Docker", "CI/CD"], "Full-time", 3, 7, 2500000, 5000000, "https://careers.swiggy.com/#/careers?src=careers"),
        ("SDE – Android (PhonePe)", "Build PhonePe's UPI payments Android app used by 500M+ users. Implement new payment flows, optimize performance, and ensure seamless transaction experience.", ["Kotlin", "Android", "Java", "REST", "SQL", "Git", "Jetpack Compose"], "Full-time", 1, 4, 1500000, 3000000, "https://www.phonepe.com/en/careers.html"),
        ("Backend Engineer – UPI", "Build highly available UPI payment processing services at PhonePe. Design APIs handling 1B+ daily transactions, ensure sub-100ms latency, and implement fraud prevention.", ["Java", "Go", "MySQL", "Redis", "Kafka", "AWS", "Microservices", "Docker"], "Full-time", 3, 7, 2500000, 5000000, "https://www.phonepe.com/en/careers.html"),
        ("ML Engineer – Fraud Detection", "Build real-time fraud detection models protecting PhonePe's 500M users. Design feature engineering pipelines, train gradient boosting models, and deploy to production.", ["Python", "Machine Learning", "XGBoost", "SQL", "Spark", "Kafka", "AWS", "MLOps"], "Full-time", 2, 6, 2000000, 4500000, "https://www.phonepe.com/en/careers.html"),
        ("Senior Software Engineer – Jira", "Build Jira's project management features used by 200,000+ companies. Own complex backend systems, design scalable APIs, and deliver features impacting millions of users.", ["Java", "Python", "PostgreSQL", "Redis", "Kafka", "AWS", "Microservices", "Docker"], "Full-time", 4, 8, 3500000, 7000000, "https://www.atlassian.com/company/careers/detail/engineering"),
        ("Full Stack Engineer – Confluence", "Build Confluence's collaborative documentation platform. Develop React frontend components and Java backend services for real-time document collaboration features.", ["React", "TypeScript", "Java", "PostgreSQL", "Redux", "REST", "Git"], "Full-time", 2, 6, 2500000, 5000000, "https://www.atlassian.com/company/careers/detail/engineering"),
        ("Site Reliability Engineer – Atlassian Cloud", "Ensure reliability of Atlassian's cloud platform serving 10M+ users. Build observability infrastructure, automate incident response, and drive capacity planning.", ["Python", "Go", "Kubernetes", "Terraform", "AWS", "Prometheus", "Linux", "CI/CD"], "Full-time", 3, 7, 3000000, 6000000, "https://www.atlassian.com/company/careers/detail/engineering"),
        ("Software Engineer – Adobe Creative Cloud", "Build features for Adobe Creative Cloud's document services. Develop APIs for PDF processing, cloud storage integrations, and real-time collaboration features.", ["Java", "Python", "AWS", "PostgreSQL", "Microservices", "Docker", "REST", "Git"], "Full-time", 2, 6, 2000000, 4500000, "https://www.adobe.com/careers.html"),
        ("Frontend Engineer – Adobe Firefly", "Build the frontend for Adobe Firefly, the AI image generation platform. Create interactive creative tools using React and WebGL for real-time AI-powered editing.", ["React", "TypeScript", "JavaScript", "CSS", "WebGL", "REST", "Webpack", "Three.js"], "Full-time", 2, 6, 2500000, 5000000, "https://www.adobe.com/careers.html"),
        ("ML Engineer – Generative AI", "Build generative AI models for Adobe Firefly's text-to-image and video generation capabilities. Train diffusion models, build inference APIs, and improve generation quality.", ["Python", "PyTorch", "Generative AI", "Deep Learning", "GPU Computing", "AWS", "MLOps"], "Full-time", 3, 8, 3000000, 7000000, "https://www.adobe.com/careers.html"),
        ("SDE II – Zomato Platform", "Build Zomato's restaurant discovery and ordering platform. Design scalable microservices, optimize database queries, and improve system reliability during peak traffic.", ["Python", "Go", "MySQL", "Redis", "Kafka", "Docker", "Kubernetes", "AWS"], "Full-time", 2, 6, 1800000, 3800000, "https://www.zomato.com/careers"),
        ("Android Developer – Zomato", "Build Zomato's Android consumer app. Implement new ordering flows, integrate live order tracking, and optimize app for low-end devices and slow networks.", ["Kotlin", "Android", "Java", "REST", "SQL", "Git", "Jetpack Compose"], "Full-time", 1, 4, 1500000, 3000000, "https://www.zomato.com/careers"),
        ("Product Analyst – Zomato Gold", "Drive data-driven decisions for Zomato's Gold subscription program. Build cohort analyses, measure subscription retention, and present insights to Product and Business teams.", ["SQL", "Python", "Tableau", "Data Analysis", "Excel", "A/B Testing"], "Full-time", 1, 4, 900000, 1800000, "https://www.zomato.com/careers"),
        ("Software Engineer – Salesforce Platform", "Build features for Salesforce's CRM platform used by 150,000+ companies worldwide. Develop Apex, LWC, and Java services for Salesforce's core platform.", ["Java", "Python", "Salesforce", "SQL", "REST", "JavaScript", "Microservices"], "Full-time", 2, 6, 2000000, 5000000, "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site"),
        ("MuleSoft Integration Developer", "Build API integrations using MuleSoft for Salesforce's enterprise customers. Design integration flows, implement API management policies, and ensure data consistency across systems.", ["MuleSoft", "REST", "Java", "SQL", "JSON", "XML", "Git"], "Full-time", 2, 5, 1500000, 3500000, "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site"),
        ("Senior Data Scientist – Einstein AI", "Build Salesforce Einstein's AI/ML models for sales forecasting and lead scoring. Work with billions of CRM data records to train predictive models that surface insights for salespeople.", ["Python", "Machine Learning", "SQL", "TensorFlow", "Scikit-learn", "Spark", "NLP"], "Full-time", 4, 9, 3500000, 7000000, "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site"),
        ("Java Developer – Oracle Database", "Build and enhance Oracle Database's SQL engine and query optimizer. Work on challenging database internals problems requiring deep expertise in C and Java.", ["Java", "C", "SQL", "Oracle", "Linux", "Performance Optimization", "Git"], "Full-time", 3, 8, 2000000, 5000000, "https://www.oracle.com/careers/search"),
        ("Cloud Native Developer – OCI", "Build Oracle Cloud Infrastructure services. Develop Go microservices, design distributed storage systems, and contribute to OCI's compute and networking services.", ["Go", "Java", "Python", "Kubernetes", "Oracle", "SQL", "Linux", "REST"], "Full-time", 2, 6, 2000000, 4500000, "https://www.oracle.com/careers/search"),
        ("QA Automation Engineer – Oracle", "Build comprehensive test automation frameworks for Oracle enterprise products. Design API test suites, performance tests, and ensure quality across Oracle's SaaS products.", ["Python", "Java", "Selenium", "REST", "SQL", "Jira", "Git", "CI/CD"], "Full-time", 2, 5, 1000000, 2500000, "https://www.oracle.com/careers/search"),
        ("Full Stack Developer – IBM Consulting", "Build enterprise digital transformation solutions for IBM's global clients. Work with modern cloud-native stacks on AWS/Azure and deliver features in agile sprints.", ["React", "Node.js", "Python", "Docker", "Kubernetes", "SQL", "REST", "Git"], "Full-time", 2, 6, 1200000, 3000000, "https://www.ibm.com/employment"),
        ("AI Engineer – IBM Watson", "Build AI solutions using IBM Watson for enterprise clients in healthcare, banking, and retail. Fine-tune NLP models, build conversational AI systems, and deploy on IBM Cloud.", ["Python", "NLP", "Machine Learning", "TensorFlow", "IBM Cloud", "REST", "Deep Learning"], "Full-time", 2, 6, 1800000, 4000000, "https://www.ibm.com/employment"),
        ("Blockchain Developer – IBM", "Build blockchain solutions using Hyperledger Fabric for IBM's enterprise clients in supply chain and trade finance. Develop smart contracts and build distributed ledger applications.", ["Blockchain", "Go", "JavaScript", "Docker", "REST", "SQL", "Git"], "Full-time", 2, 6, 1500000, 3500000, "https://www.ibm.com/employment"),
        ("Java Spring Boot Developer – Capgemini", "Develop enterprise microservices using Java Spring Boot for Capgemini's telecom and banking clients. Build REST APIs, implement OAuth security, and deploy on Kubernetes.", ["Java", "Spring Boot", "SQL", "Docker", "Kubernetes", "REST", "AWS", "Git"], "Full-time", 2, 6, 900000, 2200000, "https://www.capgemini.com/in-en/careers/job-search"),
        ("Angular Developer – Capgemini", "Build enterprise web applications using Angular for Capgemini's retail and insurance clients. Develop reusable component libraries, integrate with REST APIs, and implement responsive designs.", ["Angular", "TypeScript", "JavaScript", "HTML", "CSS", "REST", "Git"], "Full-time", 2, 5, 800000, 2000000, "https://www.capgemini.com/in-en/careers/job-search"),
        ("Data Engineer – Capgemini Analytics", "Build data pipelines and analytics solutions for Capgemini's enterprise clients. Work with Databricks, Snowflake, and Azure Data Factory to create unified data platforms.", ["Python", "SQL", "Databricks", "Snowflake", "Azure", "Spark", "ETL", "Airflow"], "Full-time", 2, 6, 1000000, 2500000, "https://www.capgemini.com/in-en/careers/job-search"),
        ("Technology Consultant – Deloitte", "Advise enterprise clients on digital technology strategy and implementation. Lead delivery teams, architect solutions using cloud and AI technologies, and manage stakeholder relationships.", ["AWS", "Python", "SQL", "Agile", "Leadership", "Project Management", "Communication"], "Full-time", 3, 7, 2000000, 5000000, "https://www2.deloitte.com/in/en/careers/students.html"),
        ("Cybersecurity Analyst – Deloitte", "Help enterprise clients protect against cyber threats. Conduct security assessments, implement SIEM solutions, build SOC processes, and respond to security incidents.", ["Cybersecurity", "Python", "SIEM", "Network Security", "SOC", "Penetration Testing", "OWASP"], "Full-time", 2, 6, 1500000, 3500000, "https://www2.deloitte.com/in/en/careers/students.html"),
        ("RPA Developer – UiPath", "Build robotic process automation solutions using UiPath for Deloitte's enterprise clients. Automate repetitive business processes in banking, insurance, and manufacturing sectors.", ["RPA", "UiPath", "Python", "SQL", "VBA", "Git", "Jira"], "Full-time", 1, 5, 800000, 2000000, "https://www2.deloitte.com/in/en/careers/students.html"),
        ("Python Developer – HCL", "Develop backend APIs and automation solutions using Python for HCL's enterprise clients. Build FastAPI/Django applications, work with PostgreSQL databases, and deploy on AWS.", ["Python", "FastAPI", "Django", "PostgreSQL", "AWS", "Docker", "REST", "Git"], "Full-time", 1, 5, 700000, 1800000, "https://www.hcltech.com/careers"),
        ("React Developer – HCL", "Build modern React applications for HCL's global clients in automotive and manufacturing sectors. Develop responsive UIs, state management, and integrate with SAP and Oracle backends.", ["React", "JavaScript", "TypeScript", "HTML", "CSS", "REST", "Redux", "Git"], "Full-time", 1, 4, 700000, 1700000, "https://www.hcltech.com/careers"),
        ("Embedded Systems Engineer – HCL", "Develop firmware for automotive ECUs for HCL's automotive OEM clients. Write C/C++ code for real-time embedded systems, implement CAN bus protocols, and optimize power consumption.", ["C", "C++", "Embedded Systems", "RTOS", "CAN Bus", "Linux", "Git"], "Full-time", 2, 6, 1000000, 2500000, "https://www.hcltech.com/careers"),
        ("Network Engineer – HCL", "Design and implement enterprise network infrastructure for HCL's clients. Configure routers, switches, and firewalls; implement SD-WAN solutions; and troubleshoot complex network issues.", ["Networking", "Firewall", "Linux", "Python", "Network Security", "Cisco", "Cybersecurity"], "Full-time", 2, 6, 900000, 2200000, "https://www.hcltech.com/careers"),
        ("Cloud Solution Architect – Accenture", "Design cloud migration and modernization strategies for Accenture's Fortune 500 clients. Architect hybrid cloud solutions on AWS/Azure/GCP and lead technical delivery teams.", ["AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes", "Python", "Leadership"], "Full-time", 6, 12, 3500000, 7000000, "https://www.accenture.com/in-en/careers/jobsearch"),
        ("AI/ML Engineer – Accenture AI", "Build AI solutions for Accenture's enterprise clients across industries. Develop custom LLM applications, build computer vision systems, and deploy ML models to production.", ["Python", "Machine Learning", "Deep Learning", "LLM", "TensorFlow", "PyTorch", "AWS", "MLOps"], "Full-time", 3, 8, 2500000, 5500000, "https://www.accenture.com/in-en/careers/jobsearch"),
        ("Automation Testing Lead – Accenture", "Lead QA automation practice for Accenture's digital delivery projects. Build testing frameworks, mentor teams, define quality standards, and ensure defect-free delivery.", ["Selenium", "Cypress", "Python", "Java", "REST", "CI/CD", "Git", "Leadership"], "Full-time", 5, 10, 2000000, 4500000, "https://www.accenture.com/in-en/careers/jobsearch"),
        ("IoT Developer – Accenture", "Build IoT solutions for manufacturing and smart city clients. Develop device firmware, implement MQTT/AMQP protocols, build real-time data processing pipelines, and deploy Azure IoT Hub.", ["IoT", "Python", "C", "Azure", "MQTT", "Embedded Systems", "Docker", "SQL"], "Full-time", 2, 6, 1500000, 3500000, "https://www.accenture.com/in-en/careers/jobsearch"),
        ("Graduate Engineer Trainee – Infosys", "Kickstart your tech career at Infosys. Get world-class training in enterprise technologies, work on live client projects, and grow into a full-time Systems Engineer role.", ["Python", "Java", "SQL", "Git", "HTML", "CSS", "Communication"], "Full-time", 0, 1, 350000, 700000, "https://career.infosys.com/jobdesc?jobReferenceCode=INFSYS-EXTERNAL-GET2026"),
        ("Software Engineering Intern – Microsoft", "Work on real projects at Microsoft alongside experienced engineers. Build features for Azure, Microsoft 365, or Xbox, get mentorship, and experience Microsoft's engineering culture.", ["Python", "C#", "JavaScript", "Git", "SQL", "REST", "Problem Solving"], "Internship", 0, 1, 600000, 1000000, "https://jobs.careers.microsoft.com/global/en/search?q=Intern"),
        ("Data Science Intern – Amazon", "Apply ML and statistics to real-world problems at Amazon. Work with large datasets, build predictive models for supply chain or recommendations, and present findings to stakeholders.", ["Python", "SQL", "Pandas", "Machine Learning", "Data Analysis", "Scikit-learn"], "Internship", 0, 1, 400000, 700000, "https://www.amazon.jobs/en/search?base_query=Intern+Data+Science"),
        ("Frontend Intern – Razorpay", "Build and improve Razorpay's merchant-facing dashboard as an intern. Contribute to React components, fix bugs, review PRs, and ship real features to production.", ["React", "JavaScript", "HTML", "CSS", "Git", "REST"], "Internship", 0, 1, 300000, 600000, "https://razorpay.com/jobs/apply/frontend-intern"),
        ("ML Research Intern – Google", "Work alongside Google researchers on cutting-edge ML problems. Implement research prototypes, run experiments, analyze results, and co-author publications.", ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "Research", "Mathematics"], "Internship", 0, 1, 700000, 1200000, "https://careers.google.com/jobs/results/?q=Machine+Learning+Intern"),
        ("Remote Full Stack Developer – Atlassian", "Work fully remote on Atlassian's products from anywhere in India. Own features end-to-end, collaborate across time zones, and ship code that impacts millions of users.", ["React", "Java", "Python", "PostgreSQL", "Docker", "AWS", "TypeScript", "Git"], "Remote", 2, 6, 2000000, 5000000, "https://www.atlassian.com/company/careers/all-jobs"),
        ("Remote Data Engineer – PhonePe", "Build PhonePe's data infrastructure fully remotely. Design real-time pipelines, maintain data quality, and support the analytics teams with reliable data platforms.", ["Python", "Kafka", "Spark", "SQL", "Airflow", "AWS", "ETL", "Data Pipeline"], "Remote", 2, 6, 2000000, 4000000, "https://www.phonepe.com/en/careers.html"),
        ("Contract Python Developer – IBM Consulting", "6-month renewable contract to build automation and AI solutions for IBM's enterprise clients. Work remotely with a team of global consultants and data scientists.", ["Python", "Machine Learning", "FastAPI", "SQL", "AWS", "Docker", "REST"], "Contract", 3, 8, 2500000, 5000000, "https://www.ibm.com/employment"),
        ("Flutter Developer – Swiggy", "Build Swiggy's delivery partner app using Flutter. Develop high-performance cross-platform features, integrate GPS tracking, and optimize for low-spec Android devices.", ["Flutter", "Dart", "Firebase", "REST", "Git", "Mobile Development", "Android"], "Full-time", 1, 4, 1200000, 2500000, "https://careers.swiggy.com/#/careers?src=careers"),
        ("Blockchain Developer – IBM", "Build enterprise blockchain solutions on Hyperledger for IBM's trade finance clients. Develop chaincode in Go, design distributed ledger architectures, and integrate with existing ERP systems.", ["Blockchain", "Go", "JavaScript", "Docker", "Hyperledger", "REST", "SQL"], "Full-time", 2, 6, 1800000, 4000000, "https://www.ibm.com/employment"),
        ("NLP Research Engineer – Microsoft", "Advance the state of the art in natural language processing for Microsoft's AI products. Fine-tune and train BERT/GPT models for multilingual understanding and generation tasks.", ["Python", "NLP", "Transformers", "BERT", "PyTorch", "Hugging Face", "Machine Learning", "LLM"], "Full-time", 2, 7, 3000000, 7000000, "https://jobs.careers.microsoft.com/global/en/search?q=NLP+Research"),
        ("Computer Vision Engineer – Flipkart", "Build product image understanding systems for Flipkart's catalog. Develop object detection models, image similarity search, and automated quality classification for 400M+ product images.", ["Python", "Computer Vision", "Deep Learning", "PyTorch", "OpenCV", "YOLO", "AWS"], "Full-time", 2, 6, 2500000, 5500000, "https://www.flipkartcareers.com"),
        ("Platform Engineer – Razorpay", "Build Razorpay's internal developer platform enabling 400+ engineers to ship faster. Create self-service tooling, improve build/deploy pipeline performance, and maintain Kubernetes infrastructure.", ["Kubernetes", "Go", "Python", "AWS", "Terraform", "CI/CD", "Docker", "Linux"], "Full-time", 3, 7, 2500000, 5000000, "https://razorpay.com/jobs/apply/platform-engineer"),
    ]
    jobs = []
    company_map = {c.company_name: c for c in companies}
    for jd in jobs_data:
        title, desc, skills, emp_type, exp_min, exp_max, sal_min, sal_max, apply_url = jd
        comp = None
        for cname, c in company_map.items():
            if cname.lower().split()[0] in apply_url.lower():
                comp = c
                break
        if not comp:
            comp = random.choice(companies)
        exp = random.randint(exp_min, max(exp_min, exp_max - 1))
        loc = random.choice(locations)
        jobs.append(Job(
            company_id=comp.company_id,
            title=title,
            description=desc,
            location=loc,
            employment_type=emp_type,
            salary_min=sal_min + random.randint(-100000, 200000),
            salary_max=sal_max + random.randint(-100000, 200000),
            experience_required=exp,
            required_skills={"skills": skills},
            status="Active",
            apply_url=apply_url,
        ))
    db.add_all(jobs)
    db.commit()
    print(f"Successfully seeded {len(companies)} companies and {len(jobs)} jobs.")
    db.close()
if __name__ == "__main__":
    seed_data()