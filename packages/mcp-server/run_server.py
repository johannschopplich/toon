#!/usr/bin/env python3
"""Standalone TOON MCP server runner - works without package installation."""

import sys
from pathlib import Path

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Import and run the server
from toon_mcp.server import main

if __name__ == "__main__":
    main()
