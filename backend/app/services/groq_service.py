"""
Groq LLM Integration Service.
Optional AI Enhancement — uses Groq free tier (Llama3) for clause summarization.

Architecture:
- Primary: Groq API (Llama3-8b) via REST
- Fallback: Rule-based template explanation (always works)

This is the 'Optional AI Enhancement' mentioned in the project spec.
"""

import os
import requests
from typing import Dict, Optional


class GroqService:
    """
    Groq LLM integration with automatic fallback.

    Uses Groq's free tier (up to 14,400 req/day) with Llama3-8b-8192.
    Falls back to rule-based explanations if Groq is unavailable.
    """

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    MAX_TOKENS   = 300
    TIMEOUT_SEC  = 10

    def __init__(self):
        self.api_key   = os.environ.get('GROQ_API_KEY', '')
        self.model     = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')
        self.enabled   = bool(self.api_key)
        if self.enabled:
            print(f"[GroqService] LLM enabled — model: {self.model}")
        else:
            print("[GroqService] Groq API key not set — using rule-based fallback only.")

    def explain_clause(self, clause_text: str, clause_type: str, risk_level: str) -> Dict:
        """
        Generate a plain-English explanation for a clause.

        Tries Groq first; falls back to rule-based templates.

        Args:
            clause_text: The legal clause text
            clause_type: Type of clause (e.g., 'payment', 'termination')
            risk_level: Risk level detected ('none', 'low', 'medium', 'high')

        Returns:
            {
              'explanation': str,
              'source': 'groq' | 'fallback',
              'model': str
            }
        """
        if self.enabled:
            groq_result = self._call_groq(clause_text, clause_type, risk_level)
            if groq_result:
                return {
                    'explanation': groq_result,
                    'source': 'groq',
                    'model': self.model
                }

        # Fallback to rule-based
        return {
            'explanation': self._fallback_explanation(clause_text, clause_type, risk_level),
            'source': 'fallback',
            'model': 'rule-based'
        }

    def summarize_contract(self, contract_text: str, risk_score: float, risk_level: str) -> Dict:
        """
        Generate a natural-language summary of the entire contract.

        Args:
            contract_text: First ~2000 chars of contract
            risk_score: Overall risk score (0-100)
            risk_level: Risk level string

        Returns:
            Summary dict with text and source
        """
        if self.enabled:
            prompt = self._build_summary_prompt(contract_text[:2000], risk_score, risk_level)
            result = self._call_groq_raw(prompt)
            if result:
                return {'summary': result, 'source': 'groq', 'model': self.model}

        return {
            'summary': self._fallback_summary(risk_score, risk_level),
            'source': 'fallback',
            'model': 'rule-based'
        }

    # ─── Private Methods ──────────────────────────────────────────────────────

    def _call_groq(self, clause_text: str, clause_type: str, risk_level: str) -> Optional[str]:
        """Call Groq API for clause explanation."""
        system_prompt = (
            "You are a legal assistant who explains contract clauses in plain English "
            "for non-lawyers in India. Be concise (2-3 sentences). Focus on what the "
            "clause means for the person signing it and any risks to watch out for."
        )
        user_prompt = (
            f"Explain this {clause_type.replace('_', ' ')} clause in simple terms. "
            f"Risk level: {risk_level}.\n\nClause: {clause_text[:800]}"
        )
        return self._call_groq_raw(user_prompt, system_prompt)

    def _call_groq_raw(self, user_prompt: str, system_prompt: str = None) -> Optional[str]:
        """Make raw Groq API call."""
        if system_prompt is None:
            system_prompt = (
                "You are a legal assistant who helps non-lawyers understand contracts. "
                "Be concise (3-4 sentences max)."
            )
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            payload = {
                'model': self.model,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                'max_tokens': self.MAX_TOKENS,
                'temperature': 0.3,
            }
            response = requests.post(
                self.GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=self.TIMEOUT_SEC
            )
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
            else:
                print(f"[GroqService] API error {response.status_code}: {response.text[:200]}")
                return None
        except Exception as e:
            print(f"[GroqService] Request failed: {e}")
            return None

    def _build_summary_prompt(self, text: str, score: float, level: str) -> str:
        return (
            f"Summarize this contract briefly for a non-lawyer in India. "
            f"The AI risk analysis gave it a score of {score}/100 ({level} risk). "
            f"What should the person watch out for?\n\nContract excerpt:\n{text}"
        )

    def _fallback_explanation(self, clause_text: str, clause_type: str, risk_level: str) -> str:
        """Rule-based fallback explanation when Groq is unavailable."""
        templates = {
            'payment': "This clause defines payment obligations. Check the amount, currency, due dates, and penalties for late payment.",
            'termination': "This clause defines how the contract can be ended. Note the required notice period and any penalties for early termination.",
            'confidentiality': "This clause requires you to keep certain information private. Note the duration and scope of this obligation.",
            'liability': "This clause limits financial responsibility if something goes wrong. Check if the limits seem fair and proportionate.",
            'jurisdiction': "This clause specifies which country's laws apply and where disputes must be resolved.",
            'intellectual_property': "This clause defines who owns creative work or inventions. Clarify if your existing IP remains yours.",
            'warranty': "This clause contains promises about quality or performance. Note the duration and what's excluded.",
            'force_majeure': "This clause excuses performance if unexpected events occur (e.g., natural disasters, pandemics).",
            'general': "This clause establishes specific terms of the agreement. Read carefully to understand your obligations.",
        }
        base = templates.get(clause_type, templates['general'])
        risk_suffix = {
            'high': " ⚠️ HIGH RISK: Consult a lawyer before agreeing to this clause.",
            'medium': " ⚠️ Review carefully and consider negotiating this clause.",
            'low': " 💡 Generally standard — confirm it matches your agreement.",
            'none': ""
        }
        return base + risk_suffix.get(risk_level, '')

    def _fallback_summary(self, risk_score: float, risk_level: str) -> str:
        """Rule-based fallback contract summary."""
        if risk_level == 'critical':
            return (f"This contract scored {risk_score}/100 — CRITICAL RISK. Do not sign without thorough legal review. "
                    "Multiple high-risk clauses were detected that could expose you to significant liability.")
        elif risk_level == 'high':
            return (f"This contract scored {risk_score}/100 — HIGH RISK. Legal advice is strongly recommended. "
                    "Several clauses contain unfavorable terms that should be negotiated.")
        elif risk_level == 'medium':
            return (f"This contract scored {risk_score}/100 — MODERATE RISK. Review flagged clauses carefully "
                    "and consider negotiating key terms before signing.")
        else:
            return (f"This contract scored {risk_score}/100 — LOW RISK. The contract appears relatively balanced. "
                    "Review all terms before signing.")

    def is_available(self) -> bool:
        """Check if Groq service is configured."""
        return self.enabled
