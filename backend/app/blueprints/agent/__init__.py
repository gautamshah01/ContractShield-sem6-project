"""
AI Legal Agent Blueprint
Provides a multi-turn chat endpoint backed by Groq/Llama3
using an Expert Employment Contract Lawyer system prompt.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import requests

agent_bp = Blueprint('agent', __name__)

# ── System prompt ─────────────────────────────────────────────────────────────
LAWYER_SYSTEM_PROMPT = """You are a senior employment lawyer with 20+ years of experience in employment contracts and workplace law.

Your role is to:
- Review and analyze employment agreements and clauses
- Explain legal terms in plain English
- Identify risks, unfair terms, and enforceability issues
- Suggest improved or protective wording
- Provide practical negotiation strategies
- Offer dispute-resolution guidance

Focus Areas:
Employment agreements, contractor agreements, non-compete/non-solicitation clauses, NDAs, IP ownership, termination, severance, bonuses, equity, arbitration clauses, wrongful termination.

Response Structure (ALWAYS use these exact headings when relevant):
## Issue Summary
## Legal Analysis
## Risks
## Recommendations
## Negotiation Strategy
## Clarifying Questions

Guidelines:
- Be precise, structured, and practical.
- Do not fabricate laws or case citations.
- If jurisdiction is unclear, ask for it before giving enforceability conclusions.
- Clearly state that this guidance is general information, not a substitute for licensed legal advice.
- Avoid unnecessary verbosity or legal jargon.
- Format responses in clean Markdown.

Tone: Professional, calm, strategic, solution-oriented."""

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _get_groq_key():
    key = os.environ.get('GROQ_API_KEY', '').strip()
    return key


def _call_groq(messages: list) -> str:
    """Call Groq API with a full conversation history."""
    api_key = _get_groq_key()
    if not api_key:
        raise ValueError("Groq API key not configured.")

    # Prefer env var but fall back to a known-good current model
    env_model = os.environ.get('GROQ_MODEL', '').strip()
    model = env_model if env_model else 'llama-3.3-70b-versatile'
    # Safe guard: deprecated model names → upgrade automatically
    if model in ('llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'):
        model = 'llama-3.3-70b-versatile'

    payload = {
        'model': model,
        'messages': [{'role': 'system', 'content': LAWYER_SYSTEM_PROMPT}] + messages,
        'max_tokens': 1500,
        'temperature': 0.4,
    }
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    resp = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)

    if resp.status_code != 200:
        raise RuntimeError(f"Groq error {resp.status_code}: {resp.text[:300]}")

    return resp.json()['choices'][0]['message']['content'].strip(), model


# ── Routes ────────────────────────────────────────────────────────────────────

@agent_bp.route('/chat', methods=['POST'])
@jwt_required()
def agent_chat():
    """
    POST /api/agent/chat
    Body: { messages: [{role: 'user'|'assistant', content: str}, ...] }
    Returns: { reply: str, model: str }
    """
    try:
        data = request.get_json()
        messages = data.get('messages', [])

        if not messages:
            return jsonify({'success': False, 'error': 'No messages provided'}), 400

        # Validate message format
        for m in messages:
            if m.get('role') not in ('user', 'assistant') or not m.get('content'):
                return jsonify({'success': False, 'error': 'Invalid message format'}), 400

        reply, model_used = _call_groq(messages)

        return jsonify({
            'success': True,
            'reply': reply,
            'model': model_used,
        }), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 503
    except RuntimeError as e:
        return jsonify({'success': False, 'error': str(e)}), 502
    except Exception as e:
        return jsonify({'success': False, 'error': f'Agent error: {str(e)}'}), 500


@agent_bp.route('/status', methods=['GET'])
@jwt_required()
def agent_status():
    """Check if the AI agent is available."""
    key = _get_groq_key()
    return jsonify({
        'available': bool(key),
        'model': os.environ.get('GROQ_MODEL', 'llama3-8b-8192'),
    }), 200
