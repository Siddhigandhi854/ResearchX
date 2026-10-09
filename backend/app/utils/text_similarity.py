import re
from collections import Counter

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "using",
    "with",
}

_PUNCT = re.compile(r"[^\w\s]+", re.UNICODE)
_SPACE = re.compile(r"\s+")


def normalize_text(value: str | None) -> str:
    text = str(value or "").lower().replace("_", " ")
    text = _PUNCT.sub(" ", text)
    return _SPACE.sub(" ", text).strip()


def tokenize(value: str | None) -> list[str]:
    tokens = [token for token in normalize_text(value).split(" ") if token]
    cleaned = [token for token in tokens if token not in STOP_WORDS and not token.isdigit()]
    return list(dict.fromkeys(cleaned))


def normalize_terms(values) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    seen: set[str] = set()
    result: list[str] = []
    for item in values:
        term = normalize_text(item)
        if not term or term in seen:
            continue
        seen.add(term)
        result.append(term)
    return result


def calculate_jaccard_similarity(left, right) -> float:
    set_a = set(normalize_terms(left))
    set_b = set(normalize_terms(right))
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def calculate_text_similarity(left: str | None, right: str | None) -> float:
    tokens_a = tokenize(left)
    tokens_b = tokenize(right)
    if not tokens_a or not tokens_b:
        return 0.0
    jaccard = calculate_jaccard_similarity(tokens_a, tokens_b)
    counts_a = Counter(tokens_a)
    counts_b = Counter(tokens_b)
    vocab = set(counts_a) | set(counts_b)
    dot = sum(counts_a[token] * counts_b[token] for token in vocab)
    mag_a = sum(value * value for value in counts_a.values()) ** 0.5
    mag_b = sum(value * value for value in counts_b.values()) ** 0.5
    cosine = (dot / (mag_a * mag_b)) if mag_a and mag_b else 0.0
    return min(1.0, (0.6 * jaccard) + (0.4 * cosine))


def overlapping_terms(left, right) -> list[str]:
    set_a = set(normalize_terms(left))
    set_b = set(normalize_terms(right))
    return sorted(set_a & set_b)
