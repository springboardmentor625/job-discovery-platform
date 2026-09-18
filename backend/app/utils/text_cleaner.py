# app/utils/text_cleaner.py
import re

def clean_extracted_text(raw_text: str) -> str:
    """Sanitizes messy PDF text before sending it to the AI NLP engine."""
    if not raw_text:
        return ""
    
    # 1. Remove invisible null bytes
    text = raw_text.replace('\x00', ' ')
    
    # 2. Replace multiple newlines with a single space
    text = re.sub(r'\n+', ' ', text)
    
    # 3. Remove weird special characters (keeps letters, numbers, and basic punctuation)
    text = re.sub(r'[^\w\s.,;:!?()-]', '', text)
    
    # 4. Collapse multiple consecutive spaces into a single space
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()