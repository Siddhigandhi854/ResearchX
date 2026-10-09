import re

_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def sanitize_text(value: str | None, max_length: int) -> str:
    text = _CONTROL.sub("", str(value or "")).strip()
    return text[:max_length]
