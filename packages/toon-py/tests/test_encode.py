"""Tests for TOON encoding."""

import math
import pytest
from toon import encode, EncodeOptions, ToonEncodeError


class TestEncodeBasicTypes:
    """Test encoding of basic types."""
    
    def test_encode_null(self):
        assert encode(None) == "null"
    
    def test_encode_boolean(self):
        assert encode(True) == "true"
        assert encode(False) == "false"
    
    def test_encode_integer(self):
        assert encode(0) == "0"
        assert encode(42) == "42"
        assert encode(-17) == "-17"
    
    def test_encode_float(self):
        assert encode(3.14) == "3.14"
        assert encode(-2.5) == "-2.5"
        assert encode(1.0) == "1"
    
    def test_encode_special_numbers(self):
        assert encode(math.nan) == "NaN"
        assert encode(math.inf) == "Infinity"
        assert encode(-math.inf) == "-Infinity"
    
    def test_encode_simple_string(self):
        assert encode("hello") == "hello"
        assert encode("test") == "test"
    
    def test_encode_quoted_string(self):
        assert encode("hello world") == '"hello world"'
        assert encode("test:value") == '"test:value"'
        assert encode("") == '""'
    
    def test_encode_escaped_string(self):
        assert encode('hello"world') == '"hello\\"world"'
        assert encode("line1\nline2") == '"line1\\nline2"'
        assert encode("tab\there") == '"tab\\there"'


class TestEncodeArrays:
    """Test encoding of arrays."""
    
    def test_encode_empty_array(self):
        assert encode([]) == "[]"
    
    def test_encode_simple_array(self):
        assert encode([1, 2, 3]) == "[1, 2, 3]"
    
    def test_encode_mixed_array(self):
        result = encode([1, "test", True, None])
        assert result == '[1, test, true, null]'
    
    def test_encode_nested_array(self):
        result = encode([[1, 2], [3, 4]])
        assert result == '[[1, 2], [3, 4]]'


class TestEncodeObjects:
    """Test encoding of objects."""
    
    def test_encode_empty_object(self):
        assert encode({}) == "{}"
    
    def test_encode_simple_object(self):
        result = encode({"name": "Alice", "age": 30})
        assert "name:Alice" in result or "name: Alice" in result
        assert "age:30" in result or "age: 30" in result
    
    def test_encode_nested_object(self):
        data = {
            "user": {
                "name": "Alice",
                "age": 30
            }
        }
        result = encode(data)
        assert "user:" in result
        assert "name:Alice" in result or "name: Alice" in result
    
    def test_encode_object_with_array(self):
        data = {"tags": ["python", "coding"]}
        result = encode(data)
        assert "tags:" in result
        assert "python" in result
        assert "coding" in result


class TestEncodeOptions:
    """Test encoding with options."""
    
    def test_sort_keys(self):
        data = {"z": 1, "a": 2, "m": 3}
        result = encode(data, EncodeOptions(sort_keys=True))
        # a should come before m, m before z
        assert result.index("a:") < result.index("m:")
        assert result.index("m:") < result.index("z:")
    
    def test_compact_mode(self):
        data = {"a": 1, "b": 2}
        result = encode(data, EncodeOptions(compact=True))
        assert result == "{a:1, b:2}"
    
    def test_indented_object(self):
        data = {"a": 1, "b": 2}
        result = encode(data, EncodeOptions(indent=2, compact=False))
        assert "\n" in result
        assert "  " in result
    
    def test_indented_array(self):
        data = [1, 2, 3]
        result = encode(data, EncodeOptions(indent=2, compact=False))
        assert "\n" in result


class TestEncodeErrors:
    """Test encoding error cases."""
    
    def test_unsupported_type(self):
        with pytest.raises(ToonEncodeError):
            encode(object())
    
    def test_unsupported_set(self):
        with pytest.raises(ToonEncodeError):
            encode({1, 2, 3})


class TestEncodeComplex:
    """Test complex encoding scenarios."""
    
    def test_encode_complex_structure(self):
        data = {
            "users": [
                {"id": 1, "name": "Alice", "active": True},
                {"id": 2, "name": "Bob", "active": False}
            ],
            "count": 2,
            "metadata": None
        }
        result = encode(data)
        assert "users:" in result
        assert "Alice" in result
        assert "Bob" in result
        assert "count:" in result
        assert "metadata:null" in result or "metadata: null" in result
