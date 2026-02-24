"""
Plain-English Explanation Service.
This is AI Component #3: Plain-English Explanation Generator.

Academic Value:
- Template-based NLP simplification (primary approach)
- Demonstrates knowledge representation for legal domain
- Hybrid system: templates + optional LLM fallback
"""

import os
from typing import Dict, List


class ExplanationService:
    """Generates plain-English explanations for legal clauses."""

    def __init__(self):
        self.clause_templates = self._load_templates()

    def _load_templates(self) -> Dict:
        """Clause-type specific plain English templates."""
        return {
            'payment': {
                'summary': 'This section covers how and when money is paid.',
                'tips': [
                    'Check the exact payment due dates.',
                    'Look for penalties if payment is late.',
                    'Confirm the currency and payment method.'
                ]
            },
            'termination': {
                'summary': 'This section explains how either party can end the contract.',
                'tips': [
                    'Note the notice period required before termination.',
                    'Check if there are penalties for early termination.',
                    'Look for conditions under which immediate termination is allowed.'
                ]
            },
            'confidentiality': {
                'summary': 'This section requires you to keep certain information secret.',
                'tips': [
                    'Check what information must be kept confidential.',
                    'Note how long the confidentiality obligation lasts.',
                    'Look for exceptions (e.g., publicly available information).'
                ]
            },
            'liability': {
                'summary': 'This section limits how much either party can be held responsible for damages.',
                'tips': [
                    'Look for caps on financial liability.',
                    'Check if the cap seems fair relative to the contract value.',
                    'Note any exclusions from the liability limit.'
                ]
            },
            'indemnification': {
                'summary': 'This section requires one party to compensate the other for certain losses.',
                'tips': [
                    'Check who has to indemnify whom.',
                    'Look for the scope — what losses are covered.',
                    'See if indemnification is mutual or one-sided.'
                ]
            },
            'intellectual_property': {
                'summary': 'This section determines who owns creative work or inventions made during the contract.',
                'tips': [
                    'Clarify if your existing IP remains yours.',
                    'Check if new work you create automatically belongs to them.',
                    'Look for license grants that may limit your future use.'
                ]
            },
            'governing_law': {
                'summary': 'This section states which country or state\'s laws apply if there is a dispute.',
                'tips': [
                    'Ensure the governing law is one you are familiar with.',
                    'If foreign law applies, consider legal costs.',
                    'Look for the dispute resolution method (arbitration vs court).'
                ]
            },
            'dispute_resolution': {
                'summary': 'This section explains how disagreements are resolved.',
                'tips': [
                    'Check if disputes go to arbitration or court.',
                    'Note the location where disputes must be resolved.',
                    'Look for any mandatory mediation step before litigation.'
                ]
            },
            'force_majeure': {
                'summary': 'This section excuses a party from performing if unexpected events occur (e.g., natural disasters).',
                'tips': [
                    'Check what events qualify as force majeure.',
                    'Note what obligations are suspended during such events.',
                    'Look for notification requirements.'
                ]
            },
            'warranty': {
                'summary': 'This section contains promises about the quality or performance of goods/services.',
                'tips': [
                    'Check the duration of warranties.',
                    'Look for what is NOT covered (exclusions).',
                    'Note remedies if warranties are breached.'
                ]
            },
            'penalty': {
                'summary': 'This section specifies financial penalties for breaching the agreement.',
                'tips': [
                    'Check if penalties are proportionate to the breach.',
                    'Look for whether penalties are in addition to or instead of damages.',
                    'Note any grace periods before penalties apply.'
                ]
            },
            'assignment': {
                'summary': 'This section controls whether parties can transfer their rights/obligations to someone else.',
                'tips': [
                    'Check if you need permission to assign the contract.',
                    'Note if the other party can assign without your consent.',
                    'Look for restrictions on assignment to competitors.'
                ]
            },
            'notice': {
                'summary': 'This section explains how official communications must be delivered.',
                'tips': [
                    'Note the required notice methods (email, registered post, etc.).',
                    'Confirm contact addresses are correct.',
                    'Check notice periods for key events.'
                ]
            },
            'general': {
                'summary': 'This is a general provision of the contract.',
                'tips': [
                    'Read carefully to understand the obligation.',
                    'Check if this clause is mutual or one-sided.',
                    'Consider seeking legal advice if unclear.'
                ]
            }
        }

    def explain_clause(self, clause: Dict) -> Dict:
        """
        Generate a plain-English explanation for a single clause.

        AI Component #3 approach:
        1. Identify clause type to select template
        2. Apply template-based simplification
        3. Add risk-specific warnings if needed
        4. Return structured explanation

        Args:
            clause: Clause dictionary with 'type', 'text', 'risk_level'

        Returns:
            Explanation dictionary
        """
        clause_type = clause.get('type', 'general').lower()
        risk_level = clause.get('risk_level', 'none')
        text = clause.get('text', '')

        # Get template for clause type
        template = self.clause_templates.get(clause_type, self.clause_templates['general'])

        # Build explanation
        explanation = {
            'summary': template['summary'],
            'what_it_means': self._generate_meaning(text, clause_type),
            'tips': template['tips'],
            'risk_warning': self._generate_risk_warning(risk_level),
            'action_required': self._get_action_required(risk_level)
        }

        return explanation

    def _generate_meaning(self, text: str, clause_type: str) -> str:
        """Generate a simple what-it-means sentence based on clause content."""
        text_lower = text.lower()

        # Type-specific interpretations based on content keywords
        meanings = {
            'payment': {
                'within 30 days': 'Payment must be made within 30 days of the invoice.',
                'advance': 'Payment is required upfront before services begin.',
                'monthly': 'Payments are due on a monthly basis.',
                'default': 'This clause defines your financial obligations.'
            },
            'termination': {
                'at will': 'Either party can end this agreement at any time without reason.',
                'notice': 'A formal notice period is required before ending the agreement.',
                'cause': 'The agreement can only be terminated for specific reasons specified here.',
                'default': 'This clause defines how the contract can be ended.'
            },
            'confidentiality': {
                'perpetual': 'Your confidentiality obligations last forever, even after the contract ends.',
                'years': 'Your confidentiality obligations last for a defined number of years.',
                'default': 'You must keep certain information private as specified.'
            }
        }

        type_meanings = meanings.get(clause_type, {})
        for keyword, meaning in type_meanings.items():
            if keyword != 'default' and keyword in text_lower:
                return meaning

        return type_meanings.get('default', f'This {clause_type} clause establishes the terms you must follow.')

    def _generate_risk_warning(self, risk_level: str) -> str:
        """Generate a risk warning based on risk level."""
        warnings = {
            'high': '⚠️ HIGH RISK: This clause may significantly impact your rights or expose you to liability. Consider negotiating or seeking legal advice before agreeing.',
            'medium': '⚠️ MODERATE RISK: This clause contains terms worth discussing. You may want to clarify or negotiate some points.',
            'low': '💡 LOW RISK: This clause is relatively standard but worth reviewing.',
            'none': '✅ NO SIGNIFICANT RISK: This clause appears standard and balanced.',
        }
        return warnings.get(risk_level, warnings['none'])

    def _get_action_required(self, risk_level: str) -> str:
        """Get recommended action based on risk level."""
        actions = {
            'high': 'Consult a lawyer before signing.',
            'medium': 'Review and consider negotiating this clause.',
            'low': 'Review and confirm you understand this obligation.',
            'none': 'Read through and confirm it matches your agreement.'
        }
        return actions.get(risk_level, actions['none'])

    def explain_all_clauses(self, clauses: List[Dict]) -> List[Dict]:
        """
        Generate explanations for all clauses.

        Args:
            clauses: List of clause dictionaries

        Returns:
            Clauses with explanations added
        """
        explained = []
        for clause in clauses:
            explanation = self.explain_clause(clause)
            explained.append({
                **clause,
                'plain_english': explanation
            })
        return explained

    def generate_executive_summary(self, analysis: Dict) -> str:
        """
        Generate a plain-English executive summary of the entire analysis.

        Args:
            analysis: Full analysis dictionary

        Returns:
            Executive summary string
        """
        risk_score = analysis.get('overall_risk_score', 0)
        risk_level = analysis.get('risk_level', 'low')
        total_clauses = analysis.get('total_clauses', 0)
        flagged = analysis.get('flagged_clauses', 0)
        missing = analysis.get('missing_clauses', [])

        level_text = {
            'critical': 'CRITICAL — Do NOT sign without thorough legal review',
            'high': 'HIGH RISK — Legal advice strongly recommended',
            'medium': 'MODERATE RISK — Careful review recommended',
            'low': 'LOW RISK — Generally safe, but review recommended'
        }

        summary = f"""📋 CONTRACT ANALYSIS SUMMARY
{'='*50}

Overall Risk: {level_text.get(risk_level, 'Unknown')}
Risk Score: {risk_score}/100

What We Found:
• {total_clauses} clauses were identified and analyzed
• {flagged} clauses contain potentially risky terms
• {len(missing)} expected clauses are missing from this contract

"""
        if missing:
            summary += "⚠️ Missing Important Clauses:\n"
            for m in missing[:5]:
                summary += f"  • {m.get('name', 'Unknown clause')}\n"
            summary += "\n"

        if risk_level in ['critical', 'high']:
            summary += "🔴 RECOMMENDATION: Do not sign this contract without consulting a qualified lawyer. The risk level is significant.\n"
        elif risk_level == 'medium':
            summary += "🟡 RECOMMENDATION: Review the flagged clauses carefully. Consider negotiating terms before signing.\n"
        else:
            summary += "🟢 RECOMMENDATION: This contract appears relatively balanced. Review highlighted clauses before signing.\n"

        return summary
