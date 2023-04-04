from dataclasses import dataclass
from typing import Dict, List

from app.extensions import db

@dataclass
class InContextExamples(db.Model):
    mode = db.Column(db.String, primary_key=True)
    examples: List[Dict[str, str]] = db.Column(db.JSON)