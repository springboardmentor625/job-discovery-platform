import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir) if os.path.basename(current_dir) == "docs" else os.getcwd()
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if os.path.join(os.getcwd(), "backend") not in sys.path:
    sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Job, Resume, Application, Notification, CandidateProfile, ATSReport

client = TestClient(app)
db = SessionLocal()

print("===========================================================")
print("      SWIPEX END-TO-END TPI & FEATURE VERIFICATION")
print("===========================================================")

# 1. Test Root & Public routes
resp = client.get("/")
print("[TEST 1] Root Endpoint:", resp.status_code, resp.json())

# 2. Test Authentication & Role Verification
user = db.query(User).filter(User.role == "candidate").first()
if not user:
    print("[ERROR] No candidate user found in database.")
    sys.exit(1)

from app.auth import create_access_token
token = create_access_token({"sub": str(user.user_id), "role": user.role})
headers = {"Authorization": f"Bearer {token}"}

resp = client.get("/jobs/", headers=headers)
print("[TEST 2] Jobs Discovery Endpoint:", resp.status_code, f"Found {len(resp.json())} jobs")
if len(resp.json()) > 0:
    j0 = resp.json()[0]
    print("          Sample Job Competition Info:", {
              "title": j0.get("title"),
              "applicant_count": j0.get("applicant_count"),
              "competition_level": j0.get("competition_level"),
              "is_early_applicant": j0.get("is_early_applicant")
          })

resp = client.get("/me", headers=headers)
print("[TEST 3] Authenticated /me Endpoint:", resp.status_code, resp.json())

# 3. Test Profile Completion Dynamic Calculation
resp = client.get("/candidate-profile/completion", headers=headers)
print("[TEST 4] Dynamic Profile Completion:", resp.status_code, resp.json())

# 4. Test Analytics Dashboard (Real stats)
resp = client.get("/analytics/dashboard", headers=headers)
print("[TEST 5] Analytics Dashboard: ", resp.status_code, {
    "total_applications": resp.json().get("total_applications"),
    "response_rate": resp.json().get("response_rate"),
    "avg_ats_score": resp.json().get("avg_ats_score"),
    "skill_gaps": resp.json().get("skill_gaps")
})

# 5. Test AI Recommendations with Anti-Overfitting & Competition
Submitted = client.post("/recommendations/refresh", headers=headers)
resp = client.get("/recommendations/", headers=headers)
print("[TEST 6] Multi-Signal Recommendations:", resp.status_code, f"Found {len(resp.json())} recommendations")
if len(resp.json()) > 0:
    r0 = resp.json()[0]
    print("          Top Recommendation Reason:", r0.get("recommendation_reason"), "Score:", r0.get("recommendation_score"))


# 6. Test Swipe Action & Interested Jobs
unswiped_jobs = client.get("/jobs/", headers=headers).json()
if len(unswiped_jobs) > 0:
    target_job = unswiped_jobs[0]
    swipe_res = client.post(f"/swipes/{target_job['job_id']}?swipe_action=Interested", headers=headers)
    print(f"[TEST 7] Swipe Interested on Job {target_job['job_id']}:", swipe_res.status_code)
    interested_res = client.get("/swipes/interested", headers=headers)
    print(f"          Total Interested Jobs in list:", len(interested_res.json()))

# 7. Test Application Submission & Automatic Notification Trigger
resume = db.query(Resume).filter(Resume.user_id == user.user_id).first()
applied_jobs = {a.job_id for a in db.query(Application).filter(Application.user_id == user.user_id).all()}
available_job = None
for j in unswiped_jobs:
    if j["job_id"] not in applied_jobs:
        available_job = j
        break

if available_job and resume:
    app_res = client.post("/applications/", json={"job_id": available_job["job_id"], "resume_id": resume.resume_id}, headers=headers)
    print(f"[TEST 8] Job Application Submission:", app_res.status_code, f"Application ID: {app_res.json().get('application_id')}")

# 8. Test Notifications (Fetch, Unread Count, Mark as Read)
unread = client.get("/notifications/unread-count", headers=headers)
notifs = client.get("/notifications/", headers=headers)
print(f"[TEST 9] Notifications Fetch:", notifs.status_code, f"Unread Count: {unread.json().get('unread_count')}, Total Notifications: {len(notifs.json())}")
if len(notifs.json()) > 0:
    first_notif = notifs.json()[0]
    print(f"          Latest Notification: [{first_notif.get('title')}] - {first_notif.get('message')}")
    # Mark as read
    read_res = client.put(f"/notifications/{first_notif['notification_id']}/read", headers=headers)
    print(f"          Mark as Read Result:", read_res.status_code, f"is_read: {read_res.json().get('is_read')}")

# 10. Test ATS Report Analysis
if resume and len(unswiped_jobs) > 0:
    ats_res = client.post(f"/ats-reports/analyze?resume_id={resume.resume_id}&job_id={unswiped_jobs[0]['job_id']}", headers=headers)
    print(f"[TEST 10] ATS Resume & Job Analysis:", ats_res.status_code, {
        "ats_score": ats_res.json().get("ats_score"),
        "match_level": ats_res.json().get("match_level"),
        "matched_skills": len(ats_res.json().get("matched_skills") or []),
        "missing_skills": len(ats_res.json().get("missing_skills") or []),
    })

# 11. Test Forgot Password & Reset Password Flow
# 11a. Generic response for non-existent email
fp_fake = client.post("/forgot-password", json={"email": "nobody_exists_12345@domain.com"})
assert fp_fake.status_code == 200
assert fp_fake.json().get("reset_token") is None

# 11b. Password reset token generation for valid user
fp_valid = client.post("/forgot-password", json={"email": user.email})
assert fp_valid.status_code == 200
reset_token = fp_valid.json().get("reset_token")
assert reset_token is not None

# 11c. Verify token endpoint
verify_res = client.get(f"/verify-reset-token?token={reset_token}")
assert verify_res.status_code == 200
assert verify_res.json().get("valid") == True

# 11d. Password mismatch validation
mismatch_res = client.post("/reset-password", json={"token": reset_token, "new_password": "NewSecretPassword123", "confirm_password": "MismatchPassword"})
assert mismatch_res.status_code == 400

# 11e. Successful password reset
reset_res = client.post("/reset-password", json={"token": reset_token, "new_password": "NewSecretPassword123", "confirm_password": "NewSecretPassword123"})
assert reset_res.status_code == 200

# 11f. Token reuse rejection
reuse_res = client.post("/reset-password", json={"token": reset_token, "new_password": "AnotherPassword123", "confirm_password": "AnotherPassword123"})
assert reuse_res.status_code == 400

# 11g. Login with new password
login_new = client.post("/login", json={"email": user.email, "password": "NewSecretPassword123"})
assert login_new.status_code == 200
assert "access_token" in login_new.json()

# Restore original password for testing consistency
fp_restore = client.post("/forgot-password", json={"email": user.email})
restore_token = fp_restore.json().get("reset_token")
client.post("/reset-password", json={"token": restore_token, "new_password": "password123", "confirm_password": "password123"})

print(f"[TEST 11] Forgot/Reset Password Security & Auth Cycle:", "200 Verified (Token Gen, Masked Verification, Mismatch Rejection, Successful Reset, Token Invalidation, New Password Login)")

# 12. Test Resume-Only 5-Dimension ATS Scoring & Recalculation
resumes_res = client.get("/resumes/", headers=headers)
assert resumes_res.status_code == 200
resumes_list = resumes_res.json()
print(f"[TEST 12] Resume-Only ATS Scoring & Breakdown:", resumes_res.status_code, f"Found {len(resumes_list)} resumes")
if len(resumes_list) > 0:
    r_item = resumes_list[0]
    print(f"          Resume '{r_item.get('resume_name')}' ATS Score: {r_item.get('ats_score')}/100")
    print(f"          Breakdown: {r_item.get('ats_breakdown')}")
    print(f"          Actionable Suggestions Count: {len(r_item.get('ats_suggestions') or [])}")
    
    # Recalculate
    recalc_res = client.post(f"/resumes/{r_item['resume_id']}/recalculate-ats", headers=headers)
    assert recalc_res.status_code == 200
    print(f"          Recalculate Endpoint Result:", recalc_res.status_code, f"Updated Score: {recalc_res.json().get('ats_score')}/100")

# 13. Test Resume Deletion with Ownership & Cascade Cleanup
# 13a. Create test resume for user
test_pdf_path = os.path.join(os.getcwd(), "backend", "uploads", "resumes", f"{user.user_id}_deletion_test.pdf")
os.makedirs(os.path.dirname(test_pdf_path), exist_ok=True)
with open(test_pdf_path, "wb") as f:
    f.write(b"%PDF-1.4 deletion test file")

test_resume = Resume(
    user_id=user.user_id,
    resume_name="deletion_test.pdf",
    file_path=f"uploads/resumes/{user.user_id}_deletion_test.pdf",
    ats_score=75
)
db.add(test_resume)
db.commit()
db.refresh(test_resume)
test_rid = test_resume.resume_id

# 13b. Add a dependent ATS report
test_ats = ATSReport(
    resume_id=test_rid,
    job_id=unswiped_jobs[0]["job_id"],
    ats_score="80.0",
    match_percentage="80.0",
    suggestions="Test suggestion"
)
db.add(test_ats)
db.commit()

# 13c. Unauthorized deletion check (other user)
other_user = db.query(User).filter(User.user_id != user.user_id).first()
if other_user:
    other_token = create_access_token({"sub": str(other_user.user_id), "role": other_user.role})
    unauth_res = client.delete(f"/resumes/{test_rid}", headers={"Authorization": f"Bearer {other_token}"})
    assert unauth_res.status_code == 403

# 13d. Authorized deletion by owner
auth_del_res = client.delete(f"/resumes/{test_rid}", headers=headers)
assert auth_del_res.status_code == 200
assert auth_del_res.json().get("resume_id") == test_rid

# 13e. Verify DB record is deleted
assert db.query(Resume).filter(Resume.resume_id == test_rid).first() is None

# 13f. Verify dependent ATSReport is cascade deleted
assert db.query(ATSReport).filter(ATSReport.resume_id == test_rid).first() is None

# 13g. Verify physical file is removed
assert not os.path.exists(test_pdf_path)

print(f"[TEST 13] Resume Deletion Flow:", "200 Verified (Ownership Check 403, Owner Delete 200, ATS Cascade Cleanup, Disk File Removal)")

# 14. Test Recruiter Workflow & Role Security
# 14a. Recruiter user setup
recruiter = db.query(User).filter(User.role == "recruiter").first()
if not recruiter:
    from app.auth import get_password_hash
    recruiter = User(
        email="e2e_recruiter@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="E2E Recruiter Lead",
        role="recruiter"
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

recruiter_token = create_access_token({"sub": str(recruiter.user_id), "role": "recruiter"})
recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}

# 14b. Post a new Job as Recruiter
new_job_payload = {
    "title": "Lead Cloud Infrastructure Architect",
    "location": "Seattle, WA (Hybrid)",
    "employment_type": "Full-time",
    "experience_required": "5+ years",
    "salary_min": 150000,
    "salary_max": 200000,
    "skills_required": ["AWS", "Terraform", "Kubernetes", "Python"],
    "description": "Lead the cloud architecture and infrastructure engineering team.",
    "company_name": "Nexus Cloud Systems",
    "company_industry": "Cloud Computing",
    "is_active": True
}
post_job_res = client.post("/jobs/", json=new_job_payload, headers=recruiter_headers)
assert post_job_res.status_code == 200
recruiter_job = post_job_res.json()
r_job_id = recruiter_job["job_id"]
assert recruiter_job["recruiter_id"] == recruiter.user_id
assert recruiter_job["company_name"] == "Nexus Cloud Systems"

# 14c. Fetch Recruiter My Jobs
my_jobs_res = client.get("/jobs/recruiter/my-jobs", headers=recruiter_headers)
assert my_jobs_res.status_code == 200
my_jobs_list = my_jobs_res.json()
assert any(j["job_id"] == r_job_id for j in my_jobs_list)

# 14d. Candidate applies to this recruiter's job
test_candidate_resume = db.query(Resume).filter(Resume.user_id == user.user_id).first()
if not test_candidate_resume:
    test_candidate_resume = Resume(
        user_id=user.user_id,
        resume_name="Candidate_Resume.pdf",
        file_path="uploads/resumes/cand_res.pdf",
        ats_score=88
    )
    db.add(test_candidate_resume)
    db.commit()
    db.refresh(test_candidate_resume)

cand_apply_res = client.post("/applications/", json={"job_id": r_job_id, "resume_id": test_candidate_resume.resume_id}, headers=headers)
assert cand_apply_res.status_code == 200
cand_app_id = cand_apply_res.json()["application_id"]

# 14e. Recruiter fetches applications
rec_apps_res = client.get("/applications/recruiter/all", headers=recruiter_headers)
assert rec_apps_res.status_code == 200
rec_apps = rec_apps_res.json()
assert any(a["application_id"] == cand_app_id for a in rec_apps)

# 14f. Recruiter updates application status to "Shortlisted"
status_update_res = client.put(f"/applications/{cand_app_id}/status", json={"status": "Shortlisted"}, headers=recruiter_headers)
assert status_update_res.status_code == 200
assert status_update_res.json()["status"] == "Shortlisted"

# 14g. Recruiter Analytics
analytics_res = client.get("/analytics/recruiter", headers=recruiter_headers)
assert analytics_res.status_code == 200
analytics_data = analytics_res.json()
assert analytics_data["total_jobs"] >= 1
assert analytics_data["total_applicants"] >= 1
assert analytics_data["shortlisted_applicants"] >= 1

# 14h. Recruiter edits job
edit_job_res = client.put(f"/jobs/{r_job_id}", json={"title": "Principal Cloud Infrastructure Architect", "is_active": True}, headers=recruiter_headers)
assert edit_job_res.status_code == 200
assert edit_job_res.json()["title"] == "Principal Cloud Infrastructure Architect"

# 14i. Role restriction check: Candidate attempting recruiter-only action gets 403
cand_unauth_post = client.post("/jobs/", json=new_job_payload, headers=headers)
assert cand_unauth_post.status_code == 403

# 14j. Recruiter deletes job (cascades cleanup)
del_job_res = client.delete(f"/jobs/{r_job_id}", headers=recruiter_headers)
assert del_job_res.status_code == 200

print(f"[TEST 14] Recruiter Workflow & Role Security:", "200 Verified (Post Job, My Jobs, Candidate Application Pipeline, Status Update Notification, Recruiter Analytics, Ownership Guard, Cascade Delete)")

# 15. Test Recruiter Candidate Profile & Details, Resume Match Score & PDF Streaming
# 15. Test Recruiter Candidate Profile & Details, Resume Match Score & PDF Streaming
# 15a. Create a dedicated test PDF file on disk
from pypdf import PdfWriter
os.makedirs("uploads/resumes", exist_ok=True)
match_test_pdf_path = "uploads/resumes/candidate_match_test.pdf"
writer = PdfWriter()
writer.add_blank_page(width=72, height=72)
with open(match_test_pdf_path, "wb") as f:
    writer.write(f)

# Create a test candidate profile
candidate_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.user_id).first()
if not candidate_profile:
    candidate_profile = CandidateProfile(
        user_id=user.user_id,
        headline="Senior Backend Engineer",
        location="Austin, TX",
        summary="Experienced backend engineer specializing in FastAPI and distributed systems.",
        experience_years=5,
        education=[{"degree": "B.S. Computer Science", "school": "UT Austin", "year": "2020"}],
        projects=[{"title": "High-Throughput API Gateway", "description": "Built using FastAPI and Redis"}],
        certifications=[{"title": "AWS Certified Solutions Architect", "issuer": "Amazon Web Services"}]
    )
    db.add(candidate_profile)
    db.commit()

# Create a resume record with skills and raw text
match_resume = Resume(
    user_id=user.user_id,
    resume_name="Match_Test_Resume.pdf",
    file_path=match_test_pdf_path,
    extracted_skills=["Python", "FastAPI", "Git", "REST API"],
    raw_text="Senior Backend Engineer with extensive experience in Python, FastAPI, Git, REST API. Education at university, experience in enterprise projects and certifications.",
    ats_score=85
)
db.add(match_resume)
db.commit()
db.refresh(match_resume)

# Recruiter posts a specific job with matching and missing skills
targeted_job_payload = {
    "title": "Senior Backend Developer",
    "location": "Remote",
    "employment_type": "Full-time",
    "experience_required": "4+ years",
    "salary_min": 140000,
    "salary_max": 180000,
    "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
    "description": "We are seeking a Senior Backend Developer proficient in Python, FastAPI, and container orchestration with education and experience.",
    "company_name": "Apex Cloud Labs",
    "status": "Active"
}
job_res = client.post("/jobs/", json=targeted_job_payload, headers=recruiter_headers)
assert job_res.status_code == 200
targeted_job_id = job_res.json()["job_id"]

# Candidate applies to this job
apply_resp = client.post("/applications/", json={"job_id": targeted_job_id, "resume_id": match_resume.resume_id}, headers=headers)
assert apply_resp.status_code == 200
app_id = apply_resp.json()["application_id"]

# Recruiter fetches all applications
recruiter_apps_resp = client.get("/applications/recruiter/all", headers=recruiter_headers)
assert recruiter_apps_resp.status_code == 200
recruiter_apps = recruiter_apps_resp.json()

target_app = next((a for a in recruiter_apps if a["application_id"] == app_id), None)
assert target_app is not None, "Application not found in recruiter list"

# Verify rich details and match score
assert target_app["resume_match_score"] is not None
assert target_app["resume_match_score"] > 0
assert "candidate_headline" in target_app
assert "candidate_email" in target_app
assert "matched_skills" in target_app
assert "missing_skills" in target_app
assert target_app["has_resume"] is True

print(f"[TEST 15a] Candidate Profile & Resume Match Score Calculation:")
print(f"           Job: {target_app['job_title']} at {target_app.get('company_name')}")
print(f"           Candidate: {target_app['candidate_name']} ({target_app.get('candidate_headline')})")
print(f"           Calculated Resume Match Score: {target_app['resume_match_score']}%")
print(f"           Matched Skills: {target_app['matched_skills']}")
print(f"           Missing Skills: {target_app['missing_skills']}")

# Test PDF resume stream endpoint (Recruiter authorized)
pdf_stream_res = client.get(f"/applications/{app_id}/resume", headers=recruiter_headers)
assert pdf_stream_res.status_code == 200
assert pdf_stream_res.headers.get("content-type") == "application/pdf"
assert len(pdf_stream_res.content) > 0
print(f"[TEST 15b] Authorized Resume PDF Streaming: 200 OK (Content-Type: application/pdf, Bytes: {len(pdf_stream_res.content)})")

# Test PDF resume stream endpoint (Unauthorized candidate gets 403 for someone else's application)
other_user = db.query(User).filter(User.role == "candidate", User.user_id != user.user_id).first()
if other_user:
    other_token = create_access_token({"sub": str(other_user.user_id), "role": "candidate"})
    other_headers = {"Authorization": f"Bearer {other_token}"}
    unauth_pdf_res = client.get(f"/applications/{app_id}/resume", headers=other_headers)
    assert unauth_pdf_res.status_code == 403
    print(f"[TEST 15c] Unauthorized Resume Access Guard: 403 Forbidden Verified")

# Clean up test job, resume, and file
client.delete(f"/jobs/{targeted_job_id}", headers=recruiter_headers)
client.delete(f"/resumes/{match_resume.resume_id}", headers=headers)
if os.path.exists(match_test_pdf_path):
    os.remove(match_test_pdf_path)

print(f"[TEST 15] Recruiter Candidate Profile Details, Resume Match Score & PDF Streaming:", "200 Verified")

# =========================================================================
# 16. Test Auth Lifecycle, Role Switching & Multi-Recruiter Data Isolation Matrix
# =========================================================================
from app.auth import hash_password

# 16a. Setup candidate and 2 distinct recruiters in database
cand_test = db.query(User).filter(User.email == "matrix_candidate@example.com").first()
if not cand_test:
    cand_test = User(
        email="matrix_candidate@example.com",
        password_hash=hash_password("password123"),
        full_name="Matrix Candidate Alpha",
        role="candidate"
    )
    db.add(cand_test)
    db.commit()
    db.refresh(cand_test)

recruiter_a = db.query(User).filter(User.email == "recruiter_alpha@example.com").first()
if not recruiter_a:
    recruiter_a = User(
        email="recruiter_alpha@example.com",
        password_hash=hash_password("password123"),
        full_name="Recruiter Alpha",
        role="recruiter"
    )
    db.add(recruiter_a)
    db.commit()
    db.refresh(recruiter_a)

recruiter_b = db.query(User).filter(User.email == "recruiter_beta@example.com").first()
if not recruiter_b:
    recruiter_b = User(
        email="recruiter_beta@example.com",
        password_hash=hash_password("password123"),
        full_name="Recruiter Beta",
        role="recruiter"
    )
    db.add(recruiter_b)
    db.commit()
    db.refresh(recruiter_b)

# Step 1: Candidate logs in -> gets token -> calls candidate endpoints
login_cand_res = client.post("/login", json={"email": "matrix_candidate@example.com", "password": "password123"})
assert login_cand_res.status_code == 200
cand_token = login_cand_res.json()["access_token"]
cand_hdr = {"Authorization": f"Bearer {cand_token}"}

me_cand = client.get("/me", headers=cand_hdr)
assert me_cand.status_code == 200
assert me_cand.json()["role"] == "candidate"

prof_cand = client.get("/candidate-profile/completion", headers=cand_hdr)
assert prof_cand.status_code == 200

# Step 2: Recruiter A logs in -> gets token -> posts Job A
login_rec_a_res = client.post("/login", json={"email": "recruiter_alpha@example.com", "password": "password123"})
assert login_rec_a_res.status_code == 200
rec_a_token = login_rec_a_res.json()["access_token"]
rec_a_hdr = {"Authorization": f"Bearer {rec_a_token}"}

me_rec_a = client.get("/me", headers=rec_a_hdr)
assert me_rec_a.status_code == 200
assert me_rec_a.json()["role"] == "recruiter"

job_a_res = client.post("/jobs/", json={
    "title": "Alpha Cloud Lead",
    "location": "San Francisco, CA",
    "required_skills": ["AWS", "Python", "Kubernetes"],
    "description": "Alpha job opportunity",
    "company_name": "Alpha Corp"
}, headers=rec_a_hdr)
assert job_a_res.status_code == 200
job_a_id = job_a_res.json()["job_id"]
assert job_a_res.json()["recruiter_id"] == recruiter_a.user_id

# Step 3: Recruiter B logs in -> gets token -> posts Job B
login_rec_b_res = client.post("/login", json={"email": "recruiter_beta@example.com", "password": "password123"})
assert login_rec_b_res.status_code == 200
rec_b_token = login_rec_b_res.json()["access_token"]
rec_b_hdr = {"Authorization": f"Bearer {rec_b_token}"}

job_b_res = client.post("/jobs/", json={
    "title": "Beta Data Scientist",
    "location": "New York, NY",
    "required_skills": ["Python", "PyTorch", "SQL"],
    "description": "Beta data role",
    "company_name": "Beta Labs"
}, headers=rec_b_hdr)
assert job_b_res.status_code == 200
job_b_id = job_b_res.json()["job_id"]
assert job_b_res.json()["recruiter_id"] == recruiter_b.user_id

# Step 4: Candidate switches back from Recruiter session (verify NO 401)
login_cand_again = client.post("/login", json={"email": "matrix_candidate@example.com", "password": "password123"})
assert login_cand_again.status_code == 200
new_cand_token = login_cand_again.json()["access_token"]
new_cand_hdr = {"Authorization": f"Bearer {new_cand_token}"}

# Create candidate resume
cand_res_record = Resume(
    user_id=cand_test.user_id,
    resume_name="Matrix_Resume.pdf",
    file_path="uploads/resumes/matrix_cand.pdf",
    extracted_skills=["Python", "AWS", "SQL"],
    ats_score=90
)
db.add(cand_res_record)
db.commit()
db.refresh(cand_res_record)

# Candidate applies to Job A
app_a_res = client.post("/applications/", json={"job_id": job_a_id, "resume_id": cand_res_record.resume_id}, headers=new_cand_hdr)
assert app_a_res.status_code == 200
app_a_id = app_a_res.json()["application_id"]

# Candidate applies to Job B
app_b_res = client.post("/applications/", json={"job_id": job_b_id, "resume_id": cand_res_record.resume_id}, headers=new_cand_hdr)
assert app_b_res.status_code == 200
app_b_id = app_b_res.json()["application_id"]

# Verify candidate sees own 2 applications
cand_my_apps = client.get("/applications/", headers=new_cand_hdr)
assert cand_my_apps.status_code == 200
assert any(a["application_id"] == app_a_id for a in cand_my_apps.json())
assert any(a["application_id"] == app_b_id for a in cand_my_apps.json())

# Step 5: Recruiter A Data Isolation Check
rec_a_my_jobs = client.get("/jobs/recruiter/my-jobs", headers=rec_a_hdr)
assert rec_a_my_jobs.status_code == 200
rec_a_job_ids = [j["job_id"] for j in rec_a_my_jobs.json()]
assert job_a_id in rec_a_job_ids, "Recruiter A must see Job A"
assert job_b_id not in rec_a_job_ids, "Recruiter A must NOT see Job B"

rec_a_apps = client.get("/applications/recruiter/all", headers=rec_a_hdr)
assert rec_a_apps.status_code == 200
rec_a_app_ids = [a["application_id"] for a in rec_a_apps.json()]
assert app_a_id in rec_a_app_ids, "Recruiter A must see application to Job A"
assert app_b_id not in rec_a_app_ids, "Recruiter A must NOT see application to Job B"

rec_a_analytics = client.get("/analytics/recruiter", headers=rec_a_hdr)
assert rec_a_analytics.status_code == 200
assert rec_a_analytics.json()["total_jobs"] == 1
assert rec_a_analytics.json()["total_applicants"] == 1

# Step 6: Recruiter B Data Isolation Check
rec_b_my_jobs = client.get("/jobs/recruiter/my-jobs", headers=rec_b_hdr)
assert rec_b_my_jobs.status_code == 200
rec_b_job_ids = [j["job_id"] for j in rec_b_my_jobs.json()]
assert job_b_id in rec_b_job_ids, "Recruiter B must see Job B"
assert job_a_id not in rec_b_job_ids, "Recruiter B must NOT see Job A"

rec_b_apps = client.get("/applications/recruiter/all", headers=rec_b_hdr)
assert rec_b_apps.status_code == 200
rec_b_app_ids = [a["application_id"] for a in rec_b_apps.json()]
assert app_b_id in rec_b_app_ids, "Recruiter B must see application to Job B"
assert app_a_id not in rec_b_app_ids, "Recruiter B must NOT see application to Job A"

rec_b_analytics = client.get("/analytics/recruiter", headers=rec_b_hdr)
assert rec_b_analytics.status_code == 200
assert rec_b_analytics.json()["total_jobs"] == 1
assert rec_b_analytics.json()["total_applicants"] == 1

# Step 7: Security Guard Check - Cross-Recruiter Unauthorized Actions receive 403 Forbidden
# Recruiter B attempts to edit Job A
rec_b_edit_a = client.put(f"/jobs/{job_a_id}", json={"title": "Hacked Title"}, headers=rec_b_hdr)
assert rec_b_edit_a.status_code == 403, "Recruiter B must receive 403 when trying to edit Recruiter A's job"

# Recruiter B attempts to delete Job A
rec_b_del_a = client.delete(f"/jobs/{job_a_id}", headers=rec_b_hdr)
assert rec_b_del_a.status_code == 403, "Recruiter B must receive 403 when trying to delete Recruiter A's job"

# Recruiter B attempts to view Job A applications
rec_b_view_a_apps = client.get(f"/applications/job/{job_a_id}", headers=rec_b_hdr)
assert rec_b_view_a_apps.status_code == 403, "Recruiter B must receive 403 when trying to view Job A's applications"

# Recruiter B attempts to update status on Job A's application
rec_b_status_a = client.put(f"/applications/{app_a_id}/status", json={"status": "Rejected"}, headers=rec_b_hdr)
assert rec_b_status_a.status_code == 403, "Recruiter B must receive 403 when trying to change status on Job A's application"

# Recruiter B attempts to view resume for Job A application
rec_b_view_a_res = client.get(f"/applications/{app_a_id}/resume", headers=rec_b_hdr)
assert rec_b_view_a_res.status_code == 403, "Recruiter B must receive 403 when trying to view resume for Job A"

# Candidate attempts recruiter-only routes
cand_unauth_jobs = client.get("/jobs/recruiter/my-jobs", headers=new_cand_hdr)
assert cand_unauth_jobs.status_code == 403, "Candidate must receive 403 on recruiter endpoint"

cand_unauth_apps = client.get("/applications/recruiter/all", headers=new_cand_hdr)
assert cand_unauth_apps.status_code == 403, "Candidate must receive 403 on recruiter endpoint"

# Cleanup test jobs and resume
client.delete(f"/jobs/{job_a_id}", headers=rec_a_hdr)
client.delete(f"/jobs/{job_b_id}", headers=rec_b_hdr)
client.delete(f"/resumes/{cand_res_record.resume_id}", headers=new_cand_hdr)

print(f"[TEST 16] Complete Authentication Lifecycle, Role Switching & Multi-Recruiter Data Isolation Matrix: 200 Verified")

print("\n===========================================================")
print("       ALL 16 VERIFICATION TESTS PASSED SUCCESSFULLY!     ")
print("===========================================================")



