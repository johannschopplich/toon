"""Example script demonstrating TOON encoding via the MCP server tools."""

import sys
from pathlib import Path

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from toon_mcp.toon_wrapper import ToonWrapper


def main():
    """Run encoding and decoding examples."""
    toon = ToonWrapper()

    # Example 1: Simple object
    print("Example 1: Simple object")
    print("-" * 50)
    data1 = {"id": 123, "name": "Ada", "active": True}
    encoded1 = toon.encode(data1)
    print("Input:", data1)
    print("Encoded:")
    print(encoded1)
    print()

    # Example 2: Array of objects
    print("Example 2: Array of objects (tabular format)")
    print("-" * 50)
    data2 = {
        "users": [
            {"id": 1, "name": "Alice", "role": "admin"},
            {"id": 2, "name": "Bob", "role": "user"},
            {"id": 3, "name": "Charlie", "role": "user"},
        ]
    }
    encoded2 = toon.encode(data2)
    print("Input:", data2)
    print("Encoded:")
    print(encoded2)
    print()

    # Example 3: Decode TOON back to JSON
    print("Example 3: Decoding TOON to JSON")
    print("-" * 50)
    toon_str = """users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user"""
    decoded = toon.decode(toon_str)
    print("TOON Input:")
    print(toon_str)
    print("\nDecoded:", decoded)
    print()

    # Example 4: Tab delimiter for better token efficiency
    print("Example 4: Tab delimiter")
    print("-" * 50)
    data4 = {
        "products": [
            {"sku": "A1", "name": "Widget", "price": 9.99},
            {"sku": "B2", "name": "Gadget", "price": 14.50},
        ]
    }
    encoded4 = toon.encode(data4, delimiter="\t")
    print("Input:", data4)
    print("Encoded with tab delimiter:")
    print(encoded4)
    print()


if __name__ == "__main__":
    main()
