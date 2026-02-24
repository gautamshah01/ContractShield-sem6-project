"""
NLP Service for clause extraction using spaCy.
This is AI Component #1: Clause Extraction using NLP.

Academic Value:
- Demonstrates practical NLP application using linguistic features
- Shows sentence segmentation and pattern matching
- Implements keyword-based classification
"""

import spacy
import re
from typing import List, Dict
import os


class NLPService:
    """NLP service for contract analysis using spaCy."""
    
    def __init__(self):
        """Initialize spaCy model."""
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            print("ERROR: spaCy model not found. Run: python -m spacy download en_core_web_sm")
            raise
        
        # Clause type keywords for classification
        self.clause_keywords = {
            'payment': ['payment', 'compensation', 'salary', 'fee', 'remuneration', 'wage', 'pay'],
            'termination': ['terminate', 'termination', 'notice period', 'resignation', 'dismissal', 'end'],
            'confidentiality': ['confidential', 'non-disclosure', 'proprietary', 'secret', 'nda'],
            'liability': ['liability', 'indemnify', 'indemnification', 'damages', 'responsible'],
            'jurisdiction': ['jurisdiction', 'governing law', 'arbitration', 'dispute resolution', 'court'],
            'intellectual_property': ['intellectual property', 'copyright', 'patent', 'trademark', 'ip'],
            'warranty': ['warranty', 'guarantee', 'representation', 'assurance'],
            'force_majeure': ['force majeure', 'act of god', 'unforeseen circumstances'],
            'duration': ['term', 'duration', 'period', 'commence', 'effective date'],
            'amendment': ['amendment', 'modification', 'change', 'vary', 'alter']
        }
    
    def extract_clauses(self, text: str) -> List[Dict]:
        """
        Extract and classify clauses from contract text.
        
        This method demonstrates NLP application:
        1. Text preprocessing
        2. Sentence segmentation using spaCy
        3. Clause boundary detection using patterns
        4. Keyword-based classification
        
        Args:
            text: Contract text
            
        Returns:
            List of clause dictionaries with type, text, and position
        """
        if not text or not text.strip():
            return []
        
        # Process text with spaCy NLP pipeline
        doc = self.nlp(text)
        
        # Extract sentences using spaCy's sentence segmentation
        sentences = list(doc.sents)
        
        # Detect clause boundaries
        clauses = self._detect_clause_boundaries(sentences)
        
        # Classify clauses by type
        classified_clauses = []
        for i, clause_text in enumerate(clauses):
            clause_type = self._classify_clause(clause_text)
            classified_clauses.append({
                'position': i + 1,
                'type': clause_type,
                'text': clause_text.strip()
            })
        
        return classified_clauses
    
    def _detect_clause_boundaries(self, sentences) -> List[str]:
        """
        Detect clause boundaries using pattern matching.
        
        Patterns detected:
        - Numbered clauses (1., 2., 3.)
        - Lettered clauses (A., B., C. or a., b., c.)
        - Roman numerals (i., ii., iii.)
        - ALL CAPS headings
        
        Args:
            sentences: List of spaCy sentence objects
            
        Returns:
            List of clause texts
        """
        clauses = []
        current_clause = []
        
        # Patterns for clause headings
        heading_patterns = [
            r'^\d+\.',  # 1., 2., 3.
            r'^\d+\.\d+',  # 1.1, 1.2, 2.1
            r'^[A-Z]\.',  # A., B., C.
            r'^[a-z]\.',  # a., b., c.
            r'^[ivxIVX]+\.',  # i., ii., iii., IV., V.
            r'^[A-Z][A-Z\s]+:',  # PAYMENT TERMS:, TERMINATION:
            r'^Article\s+\d+',  # Article 1, Article 2
            r'^Section\s+\d+',  # Section 1, Section 2
        ]
        
        for sent in sentences:
            sent_text = sent.text.strip()
            
            if not sent_text:
                continue
            
            # Check if this is a new clause heading
            is_heading = any(re.match(pattern, sent_text, re.IGNORECASE) for pattern in heading_patterns)
            
            if is_heading and current_clause:
                # Save previous clause
                clauses.append(' '.join(current_clause))
                current_clause = [sent_text]
            else:
                current_clause.append(sent_text)
        
        # Add last clause
        if current_clause:
            clauses.append(' '.join(current_clause))
        
        return clauses if clauses else [' '.join(sent.text for sent in sentences)]
    
    def _classify_clause(self, clause_text: str) -> str:
        """
        Classify clause type based on keyword matching.
        
        Uses keyword frequency to determine the most likely clause type.
        This demonstrates rule-based classification.
        
        Args:
            clause_text: Clause text
            
        Returns:
            Clause type (e.g., 'payment', 'termination', 'general')
        """
        clause_lower = clause_text.lower()
        
        # Count keyword matches for each type
        type_scores = {}
        for clause_type, keywords in self.clause_keywords.items():
            score = sum(1 for keyword in keywords if keyword in clause_lower)
            if score > 0:
                type_scores[clause_type] = score
        
        # Return type with highest score, or 'general' if no matches
        if type_scores:
            return max(type_scores, key=type_scores.get)
        return 'general'
    
    def extract_entities(self, text: str) -> Dict:
        """
        Extract named entities from text using spaCy's NER.
        
        Extracts:
        - Persons
        - Organizations
        - Dates
        - Money amounts
        - Locations
        
        Args:
            text: Contract text
            
        Returns:
            Dictionary of entity types and values
        """
        doc = self.nlp(text)
        
        entities = {
            'persons': [],
            'organizations': [],
            'dates': [],
            'money': [],
            'locations': []
        }
        
        for ent in doc.ents:
            if ent.label_ == 'PERSON':
                entities['persons'].append(ent.text)
            elif ent.label_ in ['ORG', 'COMPANY']:
                entities['organizations'].append(ent.text)
            elif ent.label_ == 'DATE':
                entities['dates'].append(ent.text)
            elif ent.label_ == 'MONEY':
                entities['money'].append(ent.text)
            elif ent.label_ in ['GPE', 'LOC']:
                entities['locations'].append(ent.text)
        
        # Remove duplicates while preserving order
        for key in entities:
            entities[key] = list(dict.fromkeys(entities[key]))
        
        return entities
    
    def get_clause_summary(self, clauses: List[Dict]) -> Dict:
        """
        Generate summary statistics for extracted clauses.
        
        Args:
            clauses: List of clause dictionaries
            
        Returns:
            Summary statistics
        """
        clause_types = {}
        for clause in clauses:
            clause_type = clause['type']
            clause_types[clause_type] = clause_types.get(clause_type, 0) + 1
        
        return {
            'total_clauses': len(clauses),
            'clause_types': clause_types,
            'unique_types': len(clause_types)
        }
