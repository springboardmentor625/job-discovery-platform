# app/services/ats_workflow.py
from typing import Dict, Any
from app.services.ai.matcher import analyze_ats_match
from app.utils.logger import swipex_logger

class ATSWorkflowService:
    @staticmethod
    def execute_pipeline(candidate_skills: list, job_skills: list, candidate_vector: list, job_vector: list) -> Dict[str, Any]:
        """Orchestrates the entire ATS scoring pipeline."""
        swipex_logger.info("Starting strict ATS evaluation pipeline...")
        
        try:
            report = analyze_ats_match(candidate_skills, job_skills, candidate_vector, job_vector)
            swipex_logger.success(f"ATS Evaluation complete. Score: {report['ats_score']}%")
            return report
        except Exception as e:
            swipex_logger.error(f"ATS Pipeline failed: {str(e)}")
            raise