"""Integration tests for TOON package."""

import math
import pytest
from toon import encode, decode, EncodeOptions, DecodeOptions


class TestIntegration:
    """Integration tests for encode-decode roundtrips."""
    
    def test_simple_roundtrip(self):
        """Test simple data roundtrip."""
        original = {
            "name": "Alice",
            "age": 30,
            "active": True,
            "balance": None
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_complex_roundtrip(self):
        """Test complex nested structure roundtrip."""
        original = {
            "users": [
                {
                    "id": 1,
                    "name": "Alice",
                    "tags": ["admin", "developer"],
                    "settings": {
                        "theme": "dark",
                        "notifications": True
                    }
                },
                {
                    "id": 2,
                    "name": "Bob",
                    "tags": ["user"],
                    "settings": {
                        "theme": "light",
                        "notifications": False
                    }
                }
            ],
            "metadata": {
                "count": 2,
                "version": "1.0",
                "timestamp": None
            }
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_special_numbers_roundtrip(self):
        """Test special number values roundtrip."""
        original = {
            "normal": 42,
            "float": 3.14,
            "zero": 0,
            "negative": -17
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_special_values_roundtrip(self):
        """Test special values like NaN and Infinity."""
        original = {
            "nan_value": math.nan,
            "inf_value": math.inf,
            "neg_inf": -math.inf
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert math.isnan(decoded["nan_value"])
        assert decoded["inf_value"] == math.inf
        assert decoded["neg_inf"] == -math.inf
    
    def test_empty_collections_roundtrip(self):
        """Test empty arrays and objects."""
        original = {
            "empty_array": [],
            "empty_object": {},
            "nested_empty": {
                "arr": [],
                "obj": {}
            }
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_string_edge_cases_roundtrip(self):
        """Test various string edge cases."""
        original = {
            "simple": "hello",
            "with_space": "hello world",
            "with_colon": "key:value",
            "with_quotes": 'say "hello"',
            "with_newline": "line1\nline2",
            "with_tab": "col1\tcol2",
            "empty": "",
            "number_like": "123",
            "keyword_like": "null"
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_pretty_print_roundtrip(self):
        """Test roundtrip with pretty printing."""
        original = {
            "a": [1, 2, 3],
            "b": {"x": 1, "y": 2}
        }
        
        options = EncodeOptions(indent=2, compact=False, sort_keys=True)
        encoded = encode(original, options)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_deeply_nested_roundtrip(self):
        """Test deeply nested structures."""
        original = {
            "level1": {
                "level2": {
                    "level3": {
                        "level4": {
                            "level5": {
                                "data": [1, 2, 3]
                            }
                        }
                    }
                }
            }
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_mixed_array_roundtrip(self):
        """Test arrays with mixed types."""
        original = {
            "mixed": [
                1,
                "string",
                True,
                None,
                [1, 2],
                {"key": "value"},
                3.14
            ]
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_unicode_roundtrip(self):
        """Test Unicode string handling."""
        original = {
            "emoji": "🎉 🚀",
            "chinese": "你好世界",
            "arabic": "مرحبا",
            "mixed": "Hello 世界 🌍"
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
    
    def test_large_numbers_roundtrip(self):
        """Test large number handling."""
        original = {
            "large_int": 9007199254740991,  # Max safe integer in JS
            "small_int": -9007199254740991,
            "large_float": 1.7976931348623157e+308,
            "small_float": -1.7976931348623157e+308,
            "tiny": 5e-324
        }
        
        encoded = encode(original)
        decoded = decode(encoded)
        
        assert decoded == original
