"""Encoding Python objects to TOON format."""

import math
from dataclasses import dataclass
from typing import Any, Optional, List

from .types import ToonValue
from .exceptions import ToonEncodeError


@dataclass
class EncodeOptions:
    """Options for encoding to TOON format."""
    indent: Optional[int] = None
    sort_keys: bool = False
    compact: bool = True


class ToonEncoder:
    """Encoder for converting Python objects to TOON format."""
    
    def __init__(self, options: Optional[EncodeOptions] = None):
        self.options = options or EncodeOptions()
        self._indent_level = 0
        self._buffer: List[str] = []
    
    def encode(self, value: Any) -> str:
        """Encode a Python value to TOON format."""
        self._buffer = []
        self._indent_level = 0
        self._encode_value(value)
        return "".join(self._buffer)
    
    def _encode_value(self, value: Any) -> None:
        """Encode any value."""
        if value is None:
            self._buffer.append("null")
        elif isinstance(value, bool):
            self._buffer.append("true" if value else "false")
        elif isinstance(value, int):
            self._encode_number(value)
        elif isinstance(value, float):
            self._encode_number(value)
        elif isinstance(value, str):
            self._encode_string(value)
        elif isinstance(value, list):
            self._encode_array(value)
        elif isinstance(value, dict):
            self._encode_object(value)
        else:
            raise ToonEncodeError(f"Unsupported type: {type(value).__name__}")
    
    def _encode_number(self, value: float) -> None:
        """Encode a number."""
        if math.isnan(value):
            self._buffer.append("NaN")
        elif math.isinf(value):
            self._buffer.append("Infinity" if value > 0 else "-Infinity")
        elif isinstance(value, float) and value.is_integer():
            self._buffer.append(str(int(value)))
        else:
            self._buffer.append(str(value))
    
    def _encode_string(self, value: str) -> None:
        """Encode a string with proper escaping."""
        # Check if string needs quotes
        if self._needs_quotes(value):
            escaped = self._escape_string(value)
            self._buffer.append(f'"{escaped}"')
        else:
            self._buffer.append(value)
    
    def _needs_quotes(self, value: str) -> bool:
        """Check if a string needs quotes."""
        if not value:
            return True
        
        # Keywords that need quotes
        keywords = {"null", "true", "false", "NaN", "Infinity", "-Infinity"}
        if value in keywords:
            return True
        
        # Check for special characters
        special_chars = {'"', "'", "\\", "\n", "\r", "\t", ":", ",", "[", "]", "{", "}", " "}
        if any(c in special_chars for c in value):
            return True
        
        # Check if starts with number
        if value[0].isdigit() or value[0] in {"-", "+"}:
            return True
        
        return False
    
    def _escape_string(self, value: str) -> str:
        """Escape special characters in string."""
        replacements = {
            "\\": "\\\\",
            '"': '\\"',
            "\n": "\\n",
            "\r": "\\r",
            "\t": "\\t",
        }
        for old, new in replacements.items():
            value = value.replace(old, new)
        return value
    
    def _encode_array(self, value: list) -> None:
        """Encode an array."""
        self._buffer.append("[")
        
        if not value:
            self._buffer.append("]")
            return
        
        use_multiline = not self.options.compact and self.options.indent is not None
        
        if use_multiline:
            self._indent_level += 1
        
        for i, item in enumerate(value):
            if i > 0:
                self._buffer.append(",")
            
            if use_multiline:
                self._buffer.append("\n")
                self._buffer.append(self._get_indent())
            elif i > 0:
                self._buffer.append(" ")
            
            self._encode_value(item)
        
        if use_multiline:
            self._indent_level -= 1
            self._buffer.append("\n")
            self._buffer.append(self._get_indent())
        
        self._buffer.append("]")
    
    def _encode_object(self, value: dict) -> None:
        """Encode an object."""
        self._buffer.append("{")
        
        if not value:
            self._buffer.append("}")
            return
        
        use_multiline = not self.options.compact and self.options.indent is not None
        
        if use_multiline:
            self._indent_level += 1
        
        items = sorted(value.items()) if self.options.sort_keys else value.items()
        
        for i, (key, val) in enumerate(items):
            if i > 0:
                self._buffer.append(",")
            
            if use_multiline:
                self._buffer.append("\n")
                self._buffer.append(self._get_indent())
            elif i > 0:
                self._buffer.append(" ")
            
            # Encode key
            self._encode_string(key)
            self._buffer.append(":")
            if not self.options.compact:
                self._buffer.append(" ")
            
            # Encode value
            self._encode_value(val)
        
        if use_multiline:
            self._indent_level -= 1
            self._buffer.append("\n")
            self._buffer.append(self._get_indent())
        
        self._buffer.append("}")
    
    def _get_indent(self) -> str:
        """Get current indentation string."""
        if self.options.indent is None:
            return ""
        return " " * (self.options.indent * self._indent_level)


def encode(value: Any, options: Optional[EncodeOptions] = None) -> str:
    """
    Encode a Python value to TOON format.
    
    Args:
        value: The value to encode
        options: Optional encoding options
    
    Returns:
        TOON-formatted string
    
    Raises:
        ToonEncodeError: If encoding fails
    """
    encoder = ToonEncoder(options)
    return encoder.encode(value)
