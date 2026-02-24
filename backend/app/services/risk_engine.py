from typing import List, Dict

class RiskEngine:
    def __init__(self):
        self.weights = {
            "High": 40,
            "Medium": 20,
            "Low": 10
        }

    def calculate_overall_score(self, risks: List[Dict], completeness_score: float) -> float:
        """
        Calculates a risk score from 0 (Safe) to 100 (High Risk).
        Note: The user asked for 0-100.
        Logic: Sum of risk weights + Penalty for missing clauses.
        """
        if not risks and completeness_score == 100:
            return 0.0
            
        risk_penalty = sum(self.weights.get(r["severity"], 0) for r in risks)
        missing_penalty = (100 - completeness_score) * 0.5
        
        total_risk = risk_penalty + missing_penalty
        return min(total_risk, 100.0)

    def get_heatmap_data(self, clauses: List[Dict], risks: List[Dict]):
        # Count risks per clause type
        type_risk_counts = {}
        for r in risks:
            rtype = r["risk_type"]
            type_risk_counts[rtype] = type_risk_counts.get(rtype, 0) + 1
        return type_risk_counts
