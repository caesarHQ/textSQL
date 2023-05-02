import json

from decimal import Decimal


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        # Handle Decimal objects
        if isinstance(obj, Decimal):
            return float(obj)

        elif hasattr(obj, 'isoformat'):
            return obj.isoformat()

        # Attempt to call the custom serialization method, if it exists
        elif hasattr(obj, 'to_json'):
            return obj.to_json()

        # If all else fails, use the default serialization method
        return super(CustomJSONEncoder, self).default(obj)
