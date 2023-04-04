from dataclasses import dataclass
from typing import Dict, List

from app.extensions import db

@dataclass
class TableMetadata(db.Model):
    table_name = db.Column(db.String, primary_key=True)
    table_metadata: Dict[str, List[object]] = db.Column(db.JSON)