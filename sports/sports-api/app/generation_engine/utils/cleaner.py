import re


def clean_input(text):
    # replace all the (###)-(####) with (###) to (####), no matter how many $s there are
    text = re.sub(r"\((\d+)\)-(\d+)", r"(\1) \2", text)

    return text
