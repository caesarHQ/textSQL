import re


def clean_input(text):

    # replace YYYY-YYYY with YY-YY; may not be best for historical data (centuries)
    text = re.sub(r"(\d{2})(\d{2})-(\d{2})(\d{2})", r"\2-\4", text)

    return text
