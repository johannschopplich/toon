"""Tests for TOON decoding."""

import math
import pytest
from toon import decode, DecodeOptions, ToonDecodeError


class TestDecodeBasicTypes:
    """Test decoding of basic types."""
    
    def test_decode_null(self):
        assert decode("null") is None
    
    def test_decode_boolean(self):
        assert decode("true") is True
        assert decode("false") is False
    
    def test_decode_integer(self):
        assert decode("0") == 0
        assert decode("42") == 42
        assert decode("-17") == -17
    
    def test_decode_float(self):
        assert decode("3.14") == 3.14
        assert decode("-2.5") == -2.5
    
    def test_decode_special_numbers(self):
        assert math.isnan(decode("NaN"))
        assert decode("Infinity") == math.inf
        assert decode("-Infinity") == -math.inf
    
    def test_decode_simple_string(self):
        assert decode("hello") == "hello"
        assert decode("test") == "test"
    
    def test_decode_quoted_string(self):
        assert decode('"hello world"') == "hello world"
        assert decode('"test:value"') == "test:value"
        assert decode('""') == ""
    
    def test_decode_single_quoted_string(self):
        assert decode("'hello world'") == "hello world"
        assert decode("'test'") == "test"
    
    def test_decode_escaped_string(self):
        assert decode('"hello\\"world"') == 'hello"world'
        assert decode('"line1\\nline2"') == "line1\nline2"
        assert decode('"tab\\there"') == "tab\there"


class TestDecodeArrays:
    """Test decoding of arrays."""
    
    def test_decode_empty_array(self):
        assert decode("[]") == []
    
    def test_decode_simple_array(self):
        assert decode("[1, 2, 3]") == [1, 2, 3]
    
    def test_decode_mixed_array(self):
        result = decode('[1, test, true, null]')
        assert result == [1, "test", True, None]
    
    def test_decode_nested_array(self):
        result = decode('[[1, 2], [3, 4]]')
        assert result == [[1, 2], [3, 4]]
    
    def test_decode_array_with_whitespace(self):
        assert decode("[ 1 , 2 , 3 ]") == [1, 2, 3]


class TestDecodeObjects:
    """Test decoding of objects."""
    
    def test_decode_empty_object(self):
        assert decode("{}") == {}
    
    def test_decode_simple_object(self):
        result = decode("{name:Alice, age:30}")
        assert result == {"name": "Alice", "age": 30}
    
    def test_decode_object_with_quoted_keys(self):
        result = decode('{"name":"Alice", "age":30}')
        assert result == {"name": "Alice", "age": 30}
    
    def test_decode_nested_object(self):
        result = decode("{user:{name:Alice, age:30}}")
        assert result == {"user": {"name": "Alice", "age": 30}}
    
    def test_decode_object_with_array(self):
        result = decode("{tags:[python, coding]}")
        assert result == {"tags": ["python", "coding"]}
    
    def test_decode_object_with_whitespace(self):
        result = decode("{ name : Alice , age : 30 }")
        assert result == {"name": "Alice", "age": 30}


class TestDecodeErrors:
    """Test decoding error cases."""
    
    def test_empty_input(self):
        with pytest.raises(ToonDecodeError):
            decode("")
    
    def test_unterminated_string(self):
        with pytest.raises(ToonDecodeError):
            decode('"hello')
    
    def test_unterminated_array(self):
        with pytest.raises(ToonDecodeError):
            decode("[1, 2")
    
    def test_unterminated_object(self):
        with pytest.raises(ToonDecodeError):
            decode("{name:Alice")
    
    def test_missing_colon(self):
        with pytest.raises(ToonDecodeError):
            decode("{name Alice}")
    
    def test_invalid_number(self):
        # In strict mode, this should raise an error because of trailing content
        # The number "12.34" is valid but ".56" is extra content
        with pytest.raises(ToonDecodeError):
            decode("12.34.56")
        
        # In non-strict mode, it parses the first valid number
        result = decode("12.34.56", DecodeOptions(strict=False))
        assert result == 12.34


class TestDecodeComplex:
    """Test complex decoding scenarios."""
    
    def test_decode_complex_structure(self):
        toon = """{
            users: [
                {id: 1, name: Alice, active: true},
                {id: 2, name: Bob, active: false}
            ],
            count: 2,
            metadata: null
        }"""
        result = decode(toon)
        assert result["count"] == 2
        assert result["metadata"] is None
        assert len(result["users"]) == 2
        assert result["users"][0]["name"] == "Alice"
        assert result["users"][1]["name"] == "Bob"
    
    def test_decode_multiline_array(self):
        toon = """[
            1,
            2,
            3
        ]"""
        assert decode(toon) == [1, 2, 3]


class TestRoundTrip:
    """Test encode-decode round trips."""
    
    def test_roundtrip_simple(self):
        from toon import encode
        
        original = {"name": "Alice", "age": 30, "active": True}
        encoded = encode(original)
        decoded = decode(encoded)
        assert decoded == original
    
    def test_roundtrip_complex(self):
        from toon import encode
        
        original = {
            "users": [
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"}
            ],
            "count": 2
        }
        encoded = encode(original)
        decoded = decode(encoded)
        assert decoded == original
    
    def test_roundtrip_nested(self):
        from toon import encode
        
        original = {
            "a": {
                "b": {
                    "c": [1, 2, 3]
                }
            }
        }
        encoded = encode(original)
        decoded = decode(encoded)
        assert decoded == original
