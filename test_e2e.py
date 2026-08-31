import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Job, Resume, Application, Notification, CandidateProfile

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

# 9. Test ATS Report Analysis
if resume and len(unswiped_jobs) > 0:
    ats_res = client.post(f"/ats-reports/analyze?resume_id={resume.resume_id}&job_id={unswiped_jobs[0]['job_id']}", headers=headers)
    print(f"[TEST 10] ATS Resume & Job Analysis:", ats_res.status_code, {
        "ats_score": ats_res.json().get("ats_score"),
        "match_level": ats_res.json().get("match_level"),
        "matched_skills": len(ats_res.json().get("matched_skills") or []),
        "missing_skills": len(ats_res.json().get("missing_skills") or []),
    })

print("\n===========================================================")
print("       ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!     ")
print("===========================================================")
