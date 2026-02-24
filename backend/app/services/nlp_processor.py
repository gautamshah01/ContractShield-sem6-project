import spacy
import re
from typing import List, Dict

# Load lightweight model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

class NLPProcessor:
    def __init__(self):
        self.clause_keywords = {
            "Payment": ["pay", "payment", "fees", "invoice", "price", "amount", "billing"],
            "Termination": ["terminate", "termination", "cancel", "notice period", "expiry"],
            "Confidentiality": ["confidential", "privacy", "disclosure", "non-disclosure", "secret"],
            "Liability": ["liable", "liability", "indemnify", "indemnification", "damages", "responsible"],
            "Jurisdiction": ["jurisdiction", "governing law", "dispute", "arbitration", "courts"]
        }
        
        self.risk_patterns = [
            {"pattern": r"unlimited liability", "severity": "High", "type": "Liability", "explanation": "Unlimited liability exposes the party to extreme financial risk."},
            {"pattern": r"indemnify.*against all claims", "severity": "High", "type": "Liability", "explanation": "Broad indemnification clauses can be very risky and costly."},
            {"pattern": r"perpetual", "severity": "Medium", "type": "Term", "explanation": "Perpetual obligations can be difficult to terminate."},
            {"pattern": r"right to terminate at any time without notice", "severity": "High", "type": "Termination", "explanation": "One-sided termination rights create instability."},
            {"pattern": r"sole discretion", "severity": "Medium", "type": "Control", "explanation": "Gives one party excessive control over decisions."}
        ]

    def segment_clauses(self, text: str) -> List[Dict]:
        doc = nlp(text)
        clauses = []
        
        # Simple segmentation by double newlines or significant punctuation
        # For a more advanced version, we could use sentence boundaries
        raw_clauses = re.split(r'\n\n|\r\n\r\n', text)
        
        current_pos = 0
        for rc in raw_clauses:
            rc = rc.strip()
            if not rc: continue
            
            start = text.find(rc, current_pos)
            end = start + len(rc)
            current_pos = end
            
            clause_type = self._classify_clause(rc)
            
            clauses.append({
                "text": rc,
                "type": clause_type,
                "start": start,
                "end": end
            })
            
        return clauses

    def _classify_clause(self, text: str) -> str:
        text_lower = text.lower()
        for category, keywords in self.clause_keywords.items():
            if any(kw in text_lower for kw in keywords):
                return category
        return "General"

    def detect_risks(self, clauses: List[Dict]) -> List[Dict]:
        risks = []
        for clause in clauses:
            text_lower = clause["text"].lower()
            for rp in self.risk_patterns:
                if re.search(rp["pattern"], text_lower):
                    risks.append({
                        "clause_text": clause["text"],
                        "severity": rp["severity"],
                        "risk_type": rp["type"],
                        "explanation": rp["explanation"]
                    })
        return risks

    def get_completeness_score(self, clauses: List[Dict]) -> Dict:
        found_types = set(c["type"] for c in clauses)
        mandatory = ["Payment", "Termination", "Liability", "Jurisdiction"]
        missing = [t for t in mandatory if t not in found_types]
        
        score = (len(mandatory) - len(missing)) / len(mandatory) * 100
        return {
            "score": score,
            "missing": missing
        }

    def simplify_clause(self, text: str) -> str:
        # Rule-based simplification (Simplified "AI")
        text = re.sub(r"notwithstanding", "even though", text, flags=re.IGNORECASE)
        text = re.sub(r"prior to", "before", text, flags=re.IGNORECASE)
        text = re.sub(r"subsequent to", "after", text, flags=re.IGNORECASE)
        text = re.sub(r"terminate and stay", "stop", text, flags=re.IGNORECASE)
        text = re.sub(r"herein", "in this agreement", text, flags=re.IGNORECASE)
        return text
