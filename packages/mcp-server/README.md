# TOON MCP Server

Model Context Protocol (MCP) server for [TOON format](https://toonformat.dev) encoding and decoding.

## Overview

This MCP server provides tools for converting between JSON and TOON (Token-Oriented Object Notation) format. TOON is a compact, human-readable serialization format designed for passing structured data to Large Language Models with **30-60% fewer tokens** compared to JSON on large uniform arrays.

## Features

- **`toon_encode`**: Convert JSON data to TOON format
- **`toon_decode`**: Convert TOON format back to JSON
- Built with [FastMCP](https://github.com/jlowin/fastmcp) for easy integration
- Supports all TOON encoding options (delimiters, key folding, etc.)

## Installation

### From Source

```bash
cd packages/mcp-server
pip install -e .
```

### Requirements

- Python 3.10+
- Node.js and pnpm (for the underlying TOON CLI)

## Usage

### Running the Server

```bash
toon-mcp
```

Or using Python directly:

```bash
python -m toon_mcp.server
```

### Configuring in Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "toon": {
      "command": "toon-mcp",
      "args": []
    }
  }
}
```

Or if running from source:

```json
{
  "mcpServers": {
    "toon": {
      "command": "python",
      "args": ["-m", "toon_mcp.server"],
      "cwd": "/path/to/toonMCP/packages/mcp-server"
    }
  }
}
```

## Available Tools

### `toon_encode`

Encode JSON data into TOON format.

**Parameters:**
- `data` (required): The JSON data to encode
- `indent` (optional, default: 2): Number of spaces per indentation level
- `delimiter` (optional, default: ","): Delimiter for array values - comma (','), tab ('\\t'), or pipe ('|')
- `key_folding` (optional, default: "off"): Key folding mode - 'off' or 'safe'
- `flatten_depth` (optional, default: null): Maximum segments to fold (null = Infinity)

**Example:**

```python
# Input
{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"}
  ]
}

# Output
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

### `toon_decode`

Decode TOON format string back into JSON data.

**Parameters:**
- `toon_string` (required): The TOON formatted string to decode
- `indent` (optional, default: 2): Expected indentation level
- `strict` (optional, default: true): Enable strict validation
- `expand_paths` (optional, default: "off"): Path expansion mode - 'off' or 'safe'

**Example:**

```python
# Input
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user

# Output
{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"}
  ]
}
```

## Why Use TOON?

TOON is optimized for LLM contexts:

- **Token-efficient**: 30-60% fewer tokens on large uniform arrays vs formatted JSON
- **LLM-friendly**: Explicit lengths and fields enable better validation
- **Minimal syntax**: Removes redundant punctuation
- **Tabular arrays**: Declare keys once, stream data as rows
- **Human-readable**: Like YAML but more compact

## Use Cases

- Passing large datasets to LLM prompts
- Reducing token costs for API calls
- Structured data in AI applications
- Data serialization for LLM fine-tuning

## Best Use Cases

TOON excels with:
- **Uniform arrays of objects** (same fields, primitive values)
- **Large tabular datasets** with consistent structure
- **Semi-uniform data** with ~60%+ tabular eligibility

For deeply nested or non-uniform structures, JSON may be more efficient.

## Development

### Project Structure

```
packages/mcp-server/
├── src/
│   └── toon_mcp/
│       ├── __init__.py
│       ├── server.py         # FastMCP server implementation
│       └── toon_wrapper.py   # Wrapper for TOON CLI
├── pyproject.toml
└── README.md
```

### Building

The server wraps the TypeScript TOON CLI from `packages/cli`. Ensure the monorepo is properly set up:

```bash
# From repository root
pnpm install
pnpm build
```

## License

MIT License © 2025 Johann Schopplich

## Links

- [TOON Specification](https://github.com/toon-format/spec)
- [TOON Documentation](https://toonformat.dev)
- [FastMCP](https://github.com/jlowin/fastmcp)
- [Model Context Protocol](https://modelcontextprotocol.io)
