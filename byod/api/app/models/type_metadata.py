from dataclasses import dataclass
from typing import Dict, List

from app.extensions import db

@dataclass
class TypeMetadata(db.Model):
    type_name = db.Column(db.String, primary_key=True)
    type_metadata: Dict[str, List[object]] = db.Column(db.JSON)