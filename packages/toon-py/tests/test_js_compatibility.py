"""
Cross-language compatibility tests.
Tests that Python TOON produces the same output as JavaScript TOON.
"""

import math
import pytest
from src.toon import encode, decode, EncodeOptions


class TestJavaScriptCompatibility:
    """Test compatibility with JavaScript TOON implementation."""
    
    def test_basic_object_encoding(self):
        """Test that basic objects encode the same way."""
        data = {"name": "Alice", "age": 30}
        result = encode(data)
        # JS output: {name:Alice, age:30} or {age:30, name:Alice}
        assert "name:Alice" in result or "name: Alice" in result
        assert "age:30" in result or "age: 30" in result
        assert result.startswith("{")
        assert result.endswith("}")
    
    def test_array_encoding(self):
        """Test that arrays encode the same way."""
        data = [1, 2, 3]
        result = encode(data)
        # JS output: [1, 2, 3]
        assert result == "[1, 2, 3]"
    
    def test_nested_structure(self):
        """Test nested structures match JS output."""
        data = {
            "user": {
                "name": "Alice",
                "tags": ["admin", "user"]
            }
        }
        result = encode(data)
        decoded = decode(result)
        assert decoded == data
    
    def test_special_values(self):
        """Test special values encode/decode correctly."""
        # Test NaN
        result = encode(math.nan)
        assert result == "NaN"
        assert math.isnan(decode(result))
        
        # Test Infinity
        result = encode(math.inf)
        assert result == "Infinity"
        assert decode(result) == math.inf
        
        # Test -Infinity
        result = encode(-math.inf)
        assert result == "-Infinity"
        assert decode(result) == -math.inf
    
    def test_null_encoding(self):
        """Test null/None encoding."""
        result = encode(None)
        assert result == "null"
        assert decode(result) is None
    
    def test_boolean_encoding(self):
        """Test boolean encoding."""
        assert encode(True) == "true"
        assert encode(False) == "false"
        assert decode("true") is True
        assert decode("false") is False
    
    def test_string_quoting(self):
        """Test string quoting matches JS behavior."""
        # Simple strings don't need quotes
        assert encode("hello") == "hello"
        
        # Strings with spaces need quotes
        assert encode("hello world") == '"hello world"'
        
        # Keywords need quotes
        assert encode("null") == '"null"'
        assert encode("true") == '"true"'
    
    def test_escape_sequences(self):
        """Test escape sequences match JS behavior."""
        # Newline
        result = encode("line1\nline2")
        assert result == '"line1\\nline2"'
        assert decode(result) == "line1\nline2"
        
        # Tab
        result = encode("col1\tcol2")
        assert result == '"col1\\tcol2"'
        assert decode(result) == "col1\tcol2"
        
        # Quote
        result = encode('say "hi"')
        assert result == '"say \\"hi\\""'
        assert decode(result) == 'say "hi"'
    
    def test_empty_collections(self):
        """Test empty collections."""
        assert encode([]) == "[]"
        assert encode({}) == "{}"
        assert decode("[]") == []
        assert decode("{}") == {}
    
    def test_compact_vs_pretty(self):
        """Test compact mode matches JS compact output."""
        data = {"a": 1, "b": 2}
        
        # Compact (default)
        compact = encode(data, EncodeOptions(compact=True))
        assert "\n" not in compact
        
        # Pretty
        pretty = encode(data, EncodeOptions(indent=2, compact=False))
        assert "\n" in pretty


class TestRoundTripWithJSExamples:
    """Test round-trip with examples that should match JS behavior."""
    
    def test_github_repos_like_structure(self):
        """Test with structure similar to benchmarks/data/github-repos.json."""
        data = {
            "repositories": [
                {
                    "name": "example-repo",
                    "stars": 1234,
                    "language": "Python",
                    "topics": ["ai", "ml"]
                }
            ],
            "total": 1
        }
        
        encoded = encode(data)
        decoded = decode(encoded)
        assert decoded == data
    
    def test_nested_config_structure(self):
        """Test nested configuration structure."""
        data = {
            "database": {
                "host": "localhost",
                "port": 5432,
                "options": {
                    "ssl": True,
                    "timeout": 30
                }
            },
            "cache": {
                "enabled": True,
                "ttl": 3600
            }
        }
        
        encoded = encode(data)
        decoded = decode(encoded)
        assert decoded == data
    
    def test_event_logs_structure(self):
        """Test event logs structure."""
        data = {
            "events": [
                {
                    "id": 1,
                    "type": "login",
                    "timestamp": 1234567890,
                    "user": "alice"
                },
                {
                    "id": 2,
                    "type": "logout",
                    "timestamp": 1234567900,
                    "user": "alice"
                }
            ]
        }
        
        encoded = encode(data)
        decoded = decode(encoded)
        assert decoded == data


class TestEdgeCasesCompatibility:
    """Test edge cases for JS compatibility."""
    
    def test_number_formats(self):
        """Test various number formats."""
        # Integers
        assert decode(encode(0)) == 0
        assert decode(encode(42)) == 42
        assert decode(encode(-17)) == -17
        
        # Floats
        assert decode(encode(3.14)) == 3.14
        assert decode(encode(-2.5)) == -2.5
        
        # Scientific notation
        assert decode(encode(1e10)) == 1e10
        assert decode(encode(1e-10)) == 1e-10
    
    def test_large_structures(self):
        """Test with larger structures."""
        data = {
            f"key{i}": {
                "value": i,
                "items": list(range(5))
            }
            for i in range(10)
        }
        
        encoded = encode(data)
        decoded = decode(encoded)
        assert decoded == data
    
    def test_mixed_types_array(self):
        """Test arrays with mixed types."""
        data = [1, "two", 3.0, True, None, [4, 5], {"six": 6}]
        
        encoded = encode(data)
        decoded = decode(encoded)
        assert decoded == data
    
    def test_unicode_strings(self):
        """Test Unicode string handling."""
        data = {
            "emoji": "🎉",
            "chinese": "你好",
            "mixed": "Hello 世界"
        }
        
        encoded = encode(data)
        decoded = decode(encoded)
        assert decoded == data
    
    def test_single_vs_double_quotes(self):
        """Test that decoder handles both quote types."""
        # Double quotes
        assert decode('{"name":"Alice"}') == {"name": "Alice"}
        
        # Single quotes
        assert decode("{'name':'Alice'}") == {"name": "Alice"}
        
        # Mixed
        assert decode('{name:"Alice"}') == {"name": "Alice"}
    
    def test_whitespace_handling(self):
        """Test whitespace is handled like JS."""
        # Should all decode to same result
        compact = "{a:1,b:2}"
        spaced = "{ a : 1 , b : 2 }"
        multiline = """
        {
            a: 1,
            b: 2
        }
        """
        
        expected = {"a": 1, "b": 2}
        assert decode(compact) == expected
        assert decode(spaced) == expected
        assert decode(multiline) == expected


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
