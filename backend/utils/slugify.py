"""AgencyOS V2 — Slug generation utility."""

import re
import unicodedata


def slugify(value: str, separator: str = "-") -> str:
    """
    Convert a string to a URL-friendly slug.

    Examples:
        slugify("AgencyOS V2") → "agencyos-v2"
        slugify("Hello World!") → "hello-world"
    """
    # Normalize unicode characters
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")

    # Lowercase
    value = value.lower()

    # Replace non-alphanumeric characters with separator
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[-\s]+", separator, value)

    # Strip leading/trailing separators
    return value.strip(separator)
