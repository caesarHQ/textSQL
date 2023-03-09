from app.extensions import db
import dataclasses

@dataclasses.dataclass
class AcsFiveYear2021(db.Model):
    __tablename__ = 'acs_census_data'

    # Zip code may start with 0's
    zip_code = db.Column(db.String, primary_key=True)
    city = db.Column(db.String)
    state = db.Column(db.String)
    county = db.Column(db.String)

    tot_pop = db.Column(db.Float)
    elderly_pop = db.Column(db.Float)
    male_pop = db.Column(db.Float)
    female_pop = db.Column(db.Float)
    white_pop = db.Column(db.Float)
    black_pop = db.Column(db.Float)
    native_american_pop = db.Column(db.Float)
    asian_pop = db.Column(db.Float)
    two_or_more_pop = db.Column(db.Float)
    hispanic_pop = db.Column(db.Float)
    adult_pop = db.Column(db.Float)
    citizen_adult_pop = db.Column(db.Float)
    avg_household_size = db.Column(db.Float)
    pop_under_5_years = db.Column(db.Float)
    pop_5_to_9_years = db.Column(db.Float)
    pop_10_to_14_years = db.Column(db.Float)
    pop_15_to_19_years = db.Column(db.Float)
    pop_20_to_24_years = db.Column(db.Float)
    pop_25_to_34_years = db.Column(db.Float)
    pop_35_to_44_years = db.Column(db.Float)
    pop_45_to_54_years = db.Column(db.Float)
    pop_55_to_59_years = db.Column(db.Float)
    pop_60_to_64_years = db.Column(db.Float)
    pop_65_to_74_years = db.Column(db.Float)
    pop_75_to_84_years = db.Column(db.Float)
    pop_85_years_and_over = db.Column(db.Float)
    per_capita_income = db.Column(db.Float)
    median_income_for_workers = db.Column(db.Float)
    