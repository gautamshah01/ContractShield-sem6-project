"""
Risk Detection Service using rule-based AI.
This is AI Component #2: Risk & Ambiguity Detection.

Academic Value:
- Demonstrates rule-based AI system design
- Shows knowledge engineering with weighted scoring
- Implements decision logic for risk classification
"""

import json
import os
from typing import Dict, List


class RiskService:
    """Rule-based risk detection service."""
    
    def __init__(self):
        """Initialize risk keyword database."""
        self.risk_keywords = self._load_risk_keywords()
        self.ambiguous_terms = [
            'reasonable', 'appropriate', 'timely', 'substantial', 'material',
            'significant', 'adequate', 'sufficient', 'best efforts', 
            'commercially reasonable', 'promptly', 'forthwith', 'as soon as possible'
        ]
    
    def _load_risk_keywords(self) -> Dict:
        """Load risk keywords from JSON file or use defaults."""
        # Try to load from file
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'risk_keywords.json')
        
        if os.path.exists(data_path):
            try:
                with open(data_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Could not load risk keywords from file: {e}")
        
        # Default risk keywords if file not found
        return {
            'high_risk': {
                'keywords': [
                    'unlimited liability', 'perpetual', 'irrevocable', 'waive all rights',
                    'no warranty', 'as is', 'without recourse', 'sole discretion',
                    'unilateral', 'absolute', 'unconditional', 'forever'
                ],
                'weight': 10
            },
            'medium_risk': {
                'keywords': [
                    'indemnify', 'hold harmless', 'at will', 'no refund',
                    'non-refundable', 'exclusive remedy', 'limitation of liability',
                    'consequential damages', 'punitive damages'
                ],
                'weight': 5
            },
            'low_risk': {
                'keywords': [
                    'best efforts', 'reasonable notice', 'subject to approval',
                    'may be terminated', 'either party may', 'mutual agreement'
                ],
                'weight': 2
            }
        }
    
    def analyze_risk(self, clauses: List[Dict]) -> Dict:
        """
        Analyze risk for all clauses using weighted scoring.
        
        This method demonstrates rule-based AI:
        1. Pattern matching against risk keyword database
        2. Weighted scoring based on severity
        3. Risk level classification
        4. Explanation generation
        
        Args:
            clauses: List of clause dictionaries
            
        Returns:
            Risk analysis results with overall score and flagged clauses
        """
        flagged_clauses = []
        total_risk_score = 0
        
        for clause in clauses:
            clause_risk = self._analyze_clause_risk(clause['text'])
            
            if clause_risk['risk_level'] != 'none':
                flagged_clauses.append({
                    'position': clause['position'],
                    'type': clause['type'],
                    'text': clause['text'],
                    'risk_level': clause_risk['risk_level'],
                    'risk_score': clause_risk['risk_score'],
                    'flagged_reasons': clause_risk['reasons'],
                    'explanation': clause_risk['explanation']
                })
                
                total_risk_score += clause_risk['risk_score']
        
        # Calculate overall risk score (0-100)
        if clauses:
            overall_score = min(100, (total_risk_score / len(clauses)) * 10)
        else:
            overall_score = 0
        
        # Determine risk level based on score
        if overall_score >= 70:
            risk_level = 'critical'
        elif overall_score >= 50:
            risk_level = 'high'
        elif overall_score >= 30:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'overall_risk_score': round(overall_score, 2),
            'risk_level': risk_level,
            'total_clauses': len(clauses),
            'flagged_clauses': len(flagged_clauses),
            'flagged_clause_details': flagged_clauses
        }
    
    def _analyze_clause_risk(self, clause_text: str) -> Dict:
        """
        Analyze risk for a single clause using keyword matching.
        
        Implements weighted scoring algorithm:
        - High risk keywords: 10 points each
        - Medium risk keywords: 5 points each
        - Low risk keywords: 2 points each
        - Ambiguous terms: 1 point each
        
        Args:
            clause_text: Clause text
            
        Returns:
            Risk analysis for clause
        """
        clause_lower = clause_text.lower()
        risk_score = 0
        reasons = []
        risk_level = 'none'
        
        # Check for high-risk keywords
        for keyword in self.risk_keywords['high_risk']['keywords']:
            if keyword in clause_lower:
                risk_score += self.risk_keywords['high_risk']['weight']
                reasons.append(f"High risk: '{keyword}'")
                risk_level = 'high'
        
        # Check for medium-risk keywords
        for keyword in self.risk_keywords['medium_risk']['keywords']:
            if keyword in clause_lower:
                risk_score += self.risk_keywords['medium_risk']['weight']
                reasons.append(f"Medium risk: '{keyword}'")
                if risk_level == 'none':
                    risk_level = 'medium'
        
        # Check for low-risk keywords
        for keyword in self.risk_keywords['low_risk']['keywords']:
            if keyword in clause_lower:
                risk_score += self.risk_keywords['low_risk']['weight']
                reasons.append(f"Low risk: '{keyword}'")
                if risk_level == 'none':
                    risk_level = 'low'
        
        # Check for ambiguous terms
        ambiguous_found = [term for term in self.ambiguous_terms if term in clause_lower]
        if ambiguous_found:
            reasons.append(f"Ambiguous terms: {', '.join(ambiguous_found[:3])}")
            risk_score += len(ambiguous_found)
            if risk_level == 'none':
                risk_level = 'low'
        
        # Generate explanation
        explanation = self._generate_risk_explanation(reasons, risk_level)
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'reasons': reasons,
            'explanation': explanation
        }
    
    def _generate_risk_explanation(self, reasons: List[str], risk_level: str) -> str:
        """
        Generate human-readable risk explanation.
        
        Args:
            reasons: List of flagged reasons
            risk_level: Overall risk level
            
        Returns:
            Human-readable explanation
        """
        if not reasons:
            return "No significant risks detected in this clause."
        
        explanation = f"This clause has been flagged as {risk_level} risk. "
        
        if risk_level == 'high':
            explanation += "It contains terms that could expose you to significant liability or unfavorable conditions. "
        elif risk_level == 'medium':
            explanation += "It contains terms that warrant careful review and consideration. "
        else:
            explanation += "It contains terms that should be noted but may be standard practice. "
        
        # Add specific concerns (limit to top 3)
        explanation += "Specific concerns: " + "; ".join(reasons[:3])
        
        if len(reasons) > 3:
            explanation += f" (and {len(reasons) - 3} more)"
        
        return explanation
    
    def get_risk_summary(self, analysis_result: Dict) -> str:
        """
        Generate a summary of the risk analysis.
        
        Args:
            analysis_result: Risk analysis result
            
        Returns:
            Summary text
        """
        score = analysis_result['overall_risk_score']
        level = analysis_result['risk_level']
        flagged = analysis_result['flagged_clauses']
        total = analysis_result['total_clauses']
        
        summary = f"Overall Risk Score: {score}/100 ({level.upper()})\n"
        summary += f"Flagged Clauses: {flagged} out of {total}\n"
        
        if level == 'critical':
            summary += "⚠️ CRITICAL: This contract contains severe risk factors that require immediate legal review."
        elif level == 'high':
            summary += "⚠️ HIGH RISK: This contract contains significant risk factors. Legal consultation strongly recommended."
        elif level == 'medium':
            summary += "⚠️ MODERATE RISK: This contract contains some risk factors. Review carefully before signing."
        else:
            summary += "✓ LOW RISK: This contract appears to have minimal risk factors, but review is still recommended."
        
        return summary
