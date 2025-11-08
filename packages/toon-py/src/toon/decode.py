"""Decoding TOON format to Python objects."""

import math
from dataclasses import dataclass
from typing import Any, Optional, Dict, List, Union

from .types import ToonValue
from .exceptions import ToonDecodeError


@dataclass
class DecodeOptions:
    """Options for decoding from TOON format."""
    strict: bool = True


class ToonDecoder:
    """Decoder for converting TOON format to Python objects."""
    
    def __init__(self, options: Optional[DecodeOptions] = None):
        self.options = options or DecodeOptions()
        self._text = ""
        self._pos = 0
        self._length = 0
    
    def decode(self, text: str) -> Any:
        """Decode a TOON-formatted string to Python value."""
        self._text = text
        self._pos = 0
        self._length = len(text)
        
        self._skip_whitespace()
        if self._pos >= self._length:
            raise ToonDecodeError("Empty input")
        
        value = self._parse_value()
        
        self._skip_whitespace()
        if self._pos < self._length and self.options.strict:
            raise ToonDecodeError(f"Unexpected content after value at position {self._pos}")
        
        return value
    
    def _parse_value(self) -> Any:
        """Parse any value."""
        self._skip_whitespace()
        
        if self._pos >= self._length:
            raise ToonDecodeError("Unexpected end of input")
        
        char = self._text[self._pos]
        
        if char == "{":
            return self._parse_object()
        elif char == "[":
            return self._parse_array()
        elif char == '"':
            return self._parse_quoted_string()
        elif char == "'":
            return self._parse_single_quoted_string()
        elif char == "-":
            # Check if it's -Infinity or a negative number
            if self._pos + 1 < self._length and self._text[self._pos + 1].isdigit():
                return self._parse_number()
            else:
                return self._parse_unquoted()
        elif char.isdigit():
            return self._parse_number()
        else:
            return self._parse_unquoted()
    
    def _parse_object(self) -> Dict[str, Any]:
        """Parse an object."""
        obj: Dict[str, Any] = {}
        self._pos += 1  # Skip {
        
        self._skip_whitespace()
        
        # Empty object
        if self._pos < self._length and self._text[self._pos] == "}":
            self._pos += 1
            return obj
        
        while self._pos < self._length:
            self._skip_whitespace()
            
            # Parse key
            key = self._parse_key()
            
            self._skip_whitespace()
            
            # Expect colon
            if self._pos >= self._length or self._text[self._pos] != ":":
                raise ToonDecodeError(f"Expected ':' at position {self._pos}")
            self._pos += 1
            
            self._skip_whitespace()
            
            # Parse value
            value = self._parse_value()
            obj[key] = value
            
            self._skip_whitespace()
            
            # Check for comma or end
            if self._pos >= self._length:
                raise ToonDecodeError("Unexpected end of input in object")
            
            if self._text[self._pos] == "}":
                self._pos += 1
                break
            elif self._text[self._pos] == ",":
                self._pos += 1
            else:
                raise ToonDecodeError(f"Expected ',' or '}}' at position {self._pos}")
        
        return obj
    
    def _parse_array(self) -> List[Any]:
        """Parse an array."""
        arr: List[Any] = []
        self._pos += 1  # Skip [
        
        self._skip_whitespace()
        
        # Empty array
        if self._pos < self._length and self._text[self._pos] == "]":
            self._pos += 1
            return arr
        
        while self._pos < self._length:
            self._skip_whitespace()
            
            # Parse value
            value = self._parse_value()
            arr.append(value)
            
            self._skip_whitespace()
            
            # Check for comma or end
            if self._pos >= self._length:
                raise ToonDecodeError("Unexpected end of input in array")
            
            if self._text[self._pos] == "]":
                self._pos += 1
                break
            elif self._text[self._pos] == ",":
                self._pos += 1
            else:
                raise ToonDecodeError(f"Expected ',' or ']' at position {self._pos}")
        
        return arr
    
    def _parse_key(self) -> str:
        """Parse an object key."""
        char = self._text[self._pos]
        
        if char == '"':
            return self._parse_quoted_string()
        elif char == "'":
            return self._parse_single_quoted_string()
        else:
            return self._parse_unquoted_key()
    
    def _parse_quoted_string(self) -> str:
        """Parse a double-quoted string."""
        self._pos += 1  # Skip opening quote
        result = []
        
        while self._pos < self._length:
            char = self._text[self._pos]
            
            if char == '"':
                self._pos += 1
                return "".join(result)
            elif char == "\\":
                self._pos += 1
                if self._pos >= self._length:
                    raise ToonDecodeError("Unexpected end in string escape")
                
                escape_char = self._text[self._pos]
                if escape_char == "n":
                    result.append("\n")
                elif escape_char == "r":
                    result.append("\r")
                elif escape_char == "t":
                    result.append("\t")
                elif escape_char == "\\":
                    result.append("\\")
                elif escape_char == '"':
                    result.append('"')
                elif escape_char == "'":
                    result.append("'")
                else:
                    result.append(escape_char)
                self._pos += 1
            else:
                result.append(char)
                self._pos += 1
        
        raise ToonDecodeError("Unterminated string")
    
    def _parse_single_quoted_string(self) -> str:
        """Parse a single-quoted string."""
        self._pos += 1  # Skip opening quote
        result = []
        
        while self._pos < self._length:
            char = self._text[self._pos]
            
            if char == "'":
                self._pos += 1
                return "".join(result)
            elif char == "\\":
                self._pos += 1
                if self._pos >= self._length:
                    raise ToonDecodeError("Unexpected end in string escape")
                
                escape_char = self._text[self._pos]
                if escape_char == "n":
                    result.append("\n")
                elif escape_char == "r":
                    result.append("\r")
                elif escape_char == "t":
                    result.append("\t")
                elif escape_char == "\\":
                    result.append("\\")
                elif escape_char == "'":
                    result.append("'")
                elif escape_char == '"':
                    result.append('"')
                else:
                    result.append(escape_char)
                self._pos += 1
            else:
                result.append(char)
                self._pos += 1
        
        raise ToonDecodeError("Unterminated string")
    
    def _parse_unquoted(self) -> Any:
        """Parse unquoted value (keyword, number, or unquoted string)."""
        start = self._pos
        
        # Read until delimiter
        while self._pos < self._length:
            char = self._text[self._pos]
            if char in {",", ":", "[", "]", "{", "}", " ", "\n", "\r", "\t"}:
                break
            self._pos += 1
        
        value = self._text[start:self._pos]
        
        # Try to parse as keyword
        if value == "null":
            return None
        elif value == "true":
            return True
        elif value == "false":
            return False
        elif value == "NaN":
            return math.nan
        elif value == "Infinity":
            return math.inf
        elif value == "-Infinity":
            return -math.inf
        
        # Try to parse as number
        try:
            if "." in value or "e" in value.lower():
                return float(value)
            else:
                return int(value)
        except ValueError:
            # It's an unquoted string
            return value
    
    def _parse_unquoted_key(self) -> str:
        """Parse an unquoted object key."""
        start = self._pos
        
        while self._pos < self._length:
            char = self._text[self._pos]
            if char in {":", " ", "\n", "\r", "\t"}:
                break
            self._pos += 1
        
        return self._text[start:self._pos]
    
    def _parse_number(self) -> Union[float, int]:
        """Parse a number."""
        start = self._pos
        
        # Handle sign
        if self._pos < self._length and self._text[self._pos] == "-":
            self._pos += 1
        
        # Read digits
        if self._pos >= self._length or not self._text[self._pos].isdigit():
            raise ToonDecodeError(f"Invalid number at position {start}")
        
        while self._pos < self._length and self._text[self._pos].isdigit():
            self._pos += 1
        
        # Check for decimal
        is_float = False
        if self._pos < self._length and self._text[self._pos] == ".":
            is_float = True
            self._pos += 1
            while self._pos < self._length and self._text[self._pos].isdigit():
                self._pos += 1
        
        # Check for exponent
        if self._pos < self._length and self._text[self._pos] in {"e", "E"}:
            is_float = True
            self._pos += 1
            if self._pos < self._length and self._text[self._pos] in {"+", "-"}:
                self._pos += 1
            while self._pos < self._length and self._text[self._pos].isdigit():
                self._pos += 1
        
        value_str = self._text[start:self._pos]
        
        try:
            if is_float:
                return float(value_str)
            else:
                return int(value_str)
        except ValueError:
            raise ToonDecodeError(f"Invalid number: {value_str}")
    
    def _skip_whitespace(self) -> None:
        """Skip whitespace characters."""
        while self._pos < self._length and self._text[self._pos] in {" ", "\n", "\r", "\t"}:
            self._pos += 1


def decode(text: str, options: Optional[DecodeOptions] = None) -> Any:
    """
    Decode a TOON-formatted string to Python value.
    
    Args:
        text: The TOON-formatted string
        options: Optional decoding options
    
    Returns:
        Decoded Python value
    
    Raises:
        ToonDecodeError: If decoding fails
    """
    decoder = ToonDecoder(options)
    return decoder.decode(text)
