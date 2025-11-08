"""
Shared utility functions for TOON encoding/decoding.
"""


def is_valid_unquoted_key(key: str) -> bool:
    """
    Check if a string can be used as an unquoted key.
    
    Args:
        key: The key to check
        
    Returns:
        True if the key can be unquoted, False otherwise
    """
    if not key:
        return False
    
    # Reserved keywords
    keywords = {"null", "true", "false", "NaN", "Infinity", "-Infinity"}
    if key in keywords:
        return False
    
    # Check for special characters
    special_chars = {'"', "'", "\\", "\n", "\r", "\t", ":", ",", "[", "]", "{", "}", " "}
    if any(c in special_chars for c in key):
        return False
    
    # Check if starts with number
    if key[0].isdigit() or key[0] in {"-", "+"}:
        return False
    
    return True


def escape_string(value: str, quote_char: str = '"') -> str:
    """
    Escape special characters in a string.
    
    Args:
        value: The string to escape
        quote_char: The quote character being used (' or ")
        
    Returns:
        Escaped string
    """
    replacements = {
        "\\": "\\\\",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
    }
    
    for old, new in replacements.items():
        value = value.replace(old, new)
    
    # Escape the quote character being used
    value = value.replace(quote_char, f"\\{quote_char}")
    
    return value


def unescape_string(value: str) -> str:
    """
    Unescape special characters in a string.
    
    Args:
        value: The escaped string
        
    Returns:
        Unescaped string
    """
    result = []
    i = 0
    while i < len(value):
        if value[i] == "\\" and i + 1 < len(value):
            next_char = value[i + 1]
            if next_char == "n":
                result.append("\n")
            elif next_char == "r":
                result.append("\r")
            elif next_char == "t":
                result.append("\t")
            elif next_char == "\\":
                result.append("\\")
            elif next_char in {'"', "'"}:
                result.append(next_char)
            else:
                result.append(next_char)
            i += 2
        else:
            result.append(value[i])
            i += 1
    
    return "".join(result)
