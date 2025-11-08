"""Example usage of TOON Python package."""

from toon import encode, decode, EncodeOptions


def basic_example():
    """Basic encoding and decoding."""
    print("=== Basic Example ===")
    
    data = {
        "name": "Alice",
        "age": 30,
        "active": True,
        "tags": ["python", "developer"]
    }
    
    # Encode
    toon_str = encode(data)
    print("Encoded:", toon_str)
    
    # Decode
    decoded = decode(toon_str)
    print("Decoded:", decoded)
    print()


def pretty_print_example():
    """Pretty printing with indentation."""
    print("=== Pretty Print Example ===")
    
    data = {
        "users": [
            {"id": 1, "name": "Alice", "role": "admin"},
            {"id": 2, "name": "Bob", "role": "user"}
        ],
        "count": 2
    }
    
    options = EncodeOptions(
        indent=2,
        sort_keys=True,
        compact=False
    )
    
    toon_str = encode(data, options)
    print(toon_str)
    print()


def special_values_example():
    """Handling special values."""
    print("=== Special Values Example ===")
    
    import math
    
    data = {
        "null_value": None,
        "boolean": True,
        "integer": 42,
        "float": 3.14,
        "nan": math.nan,
        "infinity": math.inf,
        "neg_infinity": -math.inf
    }
    
    toon_str = encode(data)
    print("Encoded:", toon_str)
    
    decoded = decode(toon_str)
    print("Decoded null:", decoded["null_value"])
    print("Decoded boolean:", decoded["boolean"])
    print("Decoded NaN:", math.isnan(decoded["nan"]))
    print("Decoded Infinity:", decoded["infinity"] == math.inf)
    print()


def nested_structures_example():
    """Working with nested structures."""
    print("=== Nested Structures Example ===")
    
    data = {
        "organization": {
            "name": "Tech Corp",
            "departments": [
                {
                    "name": "Engineering",
                    "employees": [
                        {"name": "Alice", "level": "senior"},
                        {"name": "Bob", "level": "junior"}
                    ]
                },
                {
                    "name": "Sales",
                    "employees": [
                        {"name": "Charlie", "level": "manager"}
                    ]
                }
            ]
        }
    }
    
    toon_str = encode(data, EncodeOptions(indent=2, compact=False))
    print(toon_str)
    
    decoded = decode(toon_str)
    print("\nFirst department:", decoded["organization"]["departments"][0]["name"])
    print()


def roundtrip_example():
    """Demonstrating encode-decode roundtrip."""
    print("=== Roundtrip Example ===")
    
    original = {
        "config": {
            "timeout": 30,
            "retries": 3,
            "enabled": True,
            "endpoints": ["api.example.com", "backup.example.com"]
        }
    }
    
    # Encode
    toon_str = encode(original)
    print("Encoded:", toon_str)
    
    # Decode
    decoded = decode(toon_str)
    
    # Verify
    print("Match:", original == decoded)
    print()


if __name__ == "__main__":
    basic_example()
    pretty_print_example()
    special_values_example()
    nested_structures_example()
    roundtrip_example()
