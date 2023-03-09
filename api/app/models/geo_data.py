from app.extensions import db



class GeoData(db.Model):
    __tablename__ = 'zip_code_by_city_county_state'

    zip_code = db.Column(db.String, primary_key=True)
    city = db.Column(db.String, primary_key=True)
    state = db.Column(db.String, primary_key=True)
    county = db.Column(db.String, primary_key=True)
    # area_code = db.Column(db.Integer)
    