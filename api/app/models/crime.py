from app.extensions import db


class CrimeByCity(db.Model):
    __tablename__ = 'crime_by_city'

    city = db.Column(db.String, primary_key=True)
    state = db.Column(db.String, primary_key=True)
    
    population = db.Column(db.Integer)
    violent_crime = db.Column(db.Integer)
    murder_and_nonnegligent_manslaughter = db.Column(db.Integer)
    robbery = db.Column(db.Integer)
    aggravated_assault = db.Column(db.Integer)
    property_crime = db.Column(db.Integer)
    burglary = db.Column(db.Integer)
    larceny_theft = db.Column(db.Integer)
    motor_vehicle_theft = db.Column(db.Integer)
    rape = db.Column(db.Integer)
    arson = db.Column(db.Integer)