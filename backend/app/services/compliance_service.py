"""
Compliance Checking Service - Indian Legal Context.

Checks contracts against basic Indian legal principles:
- Indian Contract Act, 1872
- Information Technology Act, 2000
- Employment-related clause checks

DISCLAIMER: This system provides AI-assisted analysis and does not
constitute legal advice. Always consult a qualified legal professional.
"""

from typing import Dict, List


class ComplianceService:
    """Rule-based compliance engine for Indian legal context."""

    DISCLAIMER = (
        "⚠️ LEGAL DISCLAIMER: This analysis is AI-assisted and does NOT constitute "
        "legal advice. Always consult a qualified legal professional before signing "
        "any contract."
    )

    def __init__(self):
        self.rules = self._load_rules()

    def _load_rules(self) -> List[Dict]:
        """
        Define compliance rules based on Indian law.
        Each rule has: name, reference, check_fn logic, explanation.
        """
        return [
            # ── Indian Contract Act, 1872 ────────────────────────────────
            {
                'id': 'ICA_001',
                'name': 'Lawful Consideration',
                'reference': 'Indian Contract Act, 1872 - Section 23',
                'category': 'contract_validity',
                'description': 'Contract must have lawful consideration and lawful object.',
                'keywords_present': ['consideration', 'payment', 'compensation', 'fee', 'remuneration'],
                'check_type': 'presence',
                'importance': 'mandatory',
            },
            {
                'id': 'ICA_002',
                'name': 'Free Consent',
                'reference': 'Indian Contract Act, 1872 - Section 14',
                'category': 'contract_validity',
                'description': 'Contract must be entered into with free consent — not by coercion, undue influence, fraud, or misrepresentation.',
                'keywords_fail': ['forced', 'coercion', 'compelled', 'under duress', 'no choice'],
                'check_type': 'absence',
                'importance': 'mandatory',
            },
            {
                'id': 'ICA_003',
                'name': 'Termination Notice Period',
                'reference': 'Indian Contract Act, 1872 - Section 73 & Employment norms',
                'category': 'employment',
                'description': 'Employment contracts should specify a notice period for termination.',
                'keywords_present': ['notice period', 'notice', 'termination notice', 'days notice'],
                'check_type': 'presence',
                'importance': 'recommended',
            },
            {
                'id': 'ICA_004',
                'name': 'Liquidated Damages Clause',
                'reference': 'Indian Contract Act, 1872 - Section 74',
                'category': 'liability',
                'description': 'Pre-agreed damages should be a genuine pre-estimate of loss, not a penalty.',
                'keywords_warn': ['penalty', 'liquidated damages', 'pre-determined damages'],
                'keywords_ok': ['genuine pre-estimate', 'actual loss', 'reasonable estimate'],
                'check_type': 'conditional',
                'importance': 'recommended',
            },
            {
                'id': 'ICA_005',
                'name': 'Non-Compete Reasonableness',
                'reference': 'Indian Contract Act, 1872 - Section 27 (Restraint of Trade)',
                'category': 'employment',
                'description': 'Non-compete clauses are generally void under Indian law unless reasonable in scope and duration.',
                'keywords_fail': ['non-compete', 'non compete', 'restraint of trade', 'not compete'],
                'check_type': 'warning',
                'importance': 'mandatory',
            },
            # ── IT Act, 2000 ─────────────────────────────────────────────
            {
                'id': 'ITA_001',
                'name': 'Data Privacy & Protection',
                'reference': 'Information Technology Act, 2000 - Section 43A',
                'category': 'data_privacy',
                'description': 'Contracts involving personal data must address data protection obligations.',
                'keywords_trigger': ['personal data', 'user data', 'sensitive information', 'data processing'],
                'keywords_present': ['data protection', 'privacy', 'gdpr', 'pdpa', 'data security'],
                'check_type': 'conditional_presence',
                'importance': 'mandatory',
            },
            {
                'id': 'ITA_002',
                'name': 'Electronic Contract Validity',
                'reference': 'Information Technology Act, 2000 - Section 10A',
                'category': 'digital',
                'description': 'Contracts formed electronically are legally valid under IT Act 2000.',
                'keywords_present': ['electronic', 'digital', 'e-signature', 'online'],
                'check_type': 'info',
                'importance': 'informational',
            },
            # ── Employment Norms ─────────────────────────────────────────
            {
                'id': 'EMP_001',
                'name': 'Wage/Salary Clarity',
                'reference': 'Minimum Wages Act, 1948 & Payment of Wages Act, 1936',
                'category': 'employment',
                'description': 'Employment contracts must clearly specify salary/wage amount and payment schedule.',
                'keywords_present': ['salary', 'wage', 'compensation', 'remuneration', 'per month', 'per annum', 'ctc'],
                'check_type': 'presence',
                'importance': 'mandatory',
            },
            {
                'id': 'EMP_002',
                'name': 'Working Hours Specification',
                'reference': 'Factories Act, 1948 & Shops & Establishments Act',
                'category': 'employment',
                'description': 'Employment contracts should specify working hours.',
                'keywords_present': ['working hours', 'hours per week', 'shift', 'work schedule'],
                'check_type': 'presence',
                'importance': 'recommended',
            },
            {
                'id': 'EMP_003',
                'name': 'Leave Policy',
                'reference': 'Factories Act, 1948 - Section 78',
                'category': 'employment',
                'description': 'Employment contracts should specify leave entitlements.',
                'keywords_present': ['leave', 'vacation', 'annual leave', 'sick leave', 'holiday'],
                'check_type': 'presence',
                'importance': 'recommended',
            },
            # ── General Contract Best Practices ──────────────────────────
            {
                'id': 'GEN_001',
                'name': 'Governing Law Specified',
                'reference': 'Indian Contract Act, 1872 - General Principles',
                'category': 'jurisdiction',
                'description': 'Contract should specify the governing law and jurisdiction for dispute resolution.',
                'keywords_present': ['governing law', 'jurisdiction', 'indian law', 'courts of india', 'arbitration'],
                'check_type': 'presence',
                'importance': 'mandatory',
            },
            {
                'id': 'GEN_002',
                'name': 'Dispute Resolution Mechanism',
                'reference': 'Arbitration and Conciliation Act, 1996',
                'category': 'dispute',
                'description': 'Contract should define how disputes will be resolved.',
                'keywords_present': ['dispute resolution', 'arbitration', 'mediation', 'litigation', 'court'],
                'check_type': 'presence',
                'importance': 'recommended',
            },
            {
                'id': 'GEN_003',
                'name': 'Force Majeure Clause',
                'reference': 'Indian Contract Act, 1872 - Section 56',
                'category': 'general',
                'description': 'Contract should address what happens in case of events beyond control (natural disasters, pandemics, etc.).',
                'keywords_present': ['force majeure', 'act of god', 'pandemic', 'unforeseen', 'beyond control'],
                'check_type': 'presence',
                'importance': 'recommended',
            },
            {
                'id': 'GEN_004',
                'name': 'Unlimited Liability Risk',
                'reference': 'Indian Contract Act, 1872 - Section 73',
                'category': 'liability',
                'description': 'Unlimited liability clauses may expose parties to disproportionate risk.',
                'keywords_fail': ['unlimited liability', 'no cap on liability', 'fully liable for all'],
                'check_type': 'absence',
                'importance': 'mandatory',
            },
            {
                'id': 'GEN_005',
                'name': 'Confidentiality Clause',
                'reference': 'Indian Contract Act, 1872 - General Principles',
                'category': 'confidentiality',
                'description': 'Important contracts should have a confidentiality/NDA clause.',
                'keywords_present': ['confidential', 'non-disclosure', 'proprietary', 'trade secret'],
                'check_type': 'presence',
                'importance': 'recommended',
            },
        ]

    def check_compliance(self, clauses: List[Dict], contract_text: str) -> Dict:
        """
        Run all compliance checks against the contract.

        Args:
            clauses: List of extracted clause dicts
            contract_text: Full contract text

        Returns:
            Compliance results with pass/fail/warning per rule
        """
        text_lower = contract_text.lower()
        results = []
        passed = 0
        failed = 0
        warnings = 0

        for rule in self.rules:
            result = self._evaluate_rule(rule, text_lower, clauses)
            results.append(result)
            if result['status'] == 'pass':
                passed += 1
            elif result['status'] == 'fail':
                failed += 1
            elif result['status'] in ('warning', 'info'):
                warnings += 1

        total_mandatory = sum(1 for r in self.rules if r['importance'] == 'mandatory')
        mandatory_passed = sum(
            1 for r, res in zip(self.rules, results)
            if r['importance'] == 'mandatory' and res['status'] == 'pass'
        )

        compliance_score = round(
            (mandatory_passed / total_mandatory * 100) if total_mandatory > 0 else 100, 1
        )

        return {
            'compliance_score': compliance_score,
            'overall_status': 'pass' if failed == 0 else 'partial' if failed <= 2 else 'fail',
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'checks': results,
            'disclaimer': self.DISCLAIMER,
            'jurisdiction': 'India',
            'legal_framework': [
                'Indian Contract Act, 1872',
                'Information Technology Act, 2000',
                'Minimum Wages Act, 1948',
                'Arbitration and Conciliation Act, 1996',
            ]
        }

    def _evaluate_rule(self, rule: Dict, text_lower: str, clauses: List[Dict]) -> Dict:
        """Evaluate a single compliance rule."""
        check_type = rule['check_type']
        status = 'info'
        explanation = rule['description']

        if check_type == 'presence':
            keywords = rule.get('keywords_present', [])
            found = any(kw in text_lower for kw in keywords)
            if found:
                status = 'pass'
                explanation = f"✅ Found. {rule['description']}"
            elif rule['importance'] == 'mandatory':
                status = 'fail'
                explanation = f"❌ Missing. {rule['description']}"
            else:
                status = 'warning'
                explanation = f"⚠️ Not found (recommended). {rule['description']}"

        elif check_type == 'absence':
            keywords = rule.get('keywords_fail', [])
            bad_found = [kw for kw in keywords if kw in text_lower]
            if bad_found:
                status = 'fail'
                explanation = (
                    f"❌ Problematic terms found: {', '.join(bad_found[:2])}. "
                    f"{rule['description']}"
                )
            else:
                status = 'pass'
                explanation = f"✅ No problematic terms detected. {rule['description']}"

        elif check_type == 'warning':
            keywords = rule.get('keywords_fail', [])
            found = [kw for kw in keywords if kw in text_lower]
            if found:
                status = 'warning'
                explanation = (
                    f"⚠️ Contains: {', '.join(found[:2])}. Under Indian law (ICA §27), "
                    f"non-compete clauses are generally void. Consider legal advice."
                )
            else:
                status = 'pass'
                explanation = f"✅ No restraint-of-trade clauses detected."

        elif check_type == 'conditional':
            warn_kws = rule.get('keywords_warn', [])
            ok_kws   = rule.get('keywords_ok', [])
            has_warn = any(kw in text_lower for kw in warn_kws)
            has_ok   = any(kw in text_lower for kw in ok_kws)
            if has_warn and not has_ok:
                status = 'warning'
                explanation = f"⚠️ Penalty/damages clauses found without genuine pre-estimate language. {rule['description']}"
            else:
                status = 'pass'
                explanation = f"✅ Damages clauses appear balanced. {rule['description']}"

        elif check_type == 'conditional_presence':
            trigger_kws  = rule.get('keywords_trigger', [])
            present_kws  = rule.get('keywords_present', [])
            is_triggered = any(kw in text_lower for kw in trigger_kws)
            has_required = any(kw in text_lower for kw in present_kws)
            if is_triggered and not has_required:
                status = 'fail'
                explanation = (
                    f"❌ Contract processes personal data but lacks data protection provisions. "
                    f"Required under IT Act 2000, Section 43A."
                )
            elif is_triggered and has_required:
                status = 'pass'
                explanation = f"✅ Data protection provisions found. {rule['description']}"
            else:
                status = 'pass'
                explanation = f"✅ No personal data processing detected. {rule['description']}"

        elif check_type == 'info':
            status = 'info'
            explanation = f"ℹ️ {rule['description']}"

        return {
            'rule_id': rule['id'],
            'rule_name': rule['name'],
            'reference': rule['reference'],
            'category': rule['category'],
            'status': status,
            'importance': rule['importance'],
            'explanation': explanation,
        }
