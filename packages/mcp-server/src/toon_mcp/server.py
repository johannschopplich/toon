"""TOON MCP Server - FastMCP server for TOON format encoding and decoding."""

from typing import Any

from fastmcp import FastMCP

from .toon_wrapper import ToonWrapper

# Create FastMCP server instance
mcp = FastMCP(
    name="toon-mcp-server",
    version="1.0.0",
)

# Initialize TOON wrapper
toon = ToonWrapper()


@mcp.tool()
def toon_encode(
    data: Any,
    indent: int = 2,
    delimiter: str = ",",
    key_folding: str = "off",
    flatten_depth: int | None = None,
) -> str:
    """
    Encode JSON data into TOON format.

    TOON (Token-Oriented Object Notation) is a compact format designed for LLM
    prompts with reduced token usage (typically 30-60% fewer tokens than JSON
    on large uniform arrays).

    Args:
        data: The JSON data to encode into TOON format (objects, arrays, primitives)
        indent: Number of spaces per indentation level (default: 2)
        delimiter: Delimiter for array values - comma (','), tab ('\\t'), or pipe ('|'). Default: comma
        key_folding: Enable key folding to collapse single-key wrapper chains into dotted paths. Options: 'off' (default) or 'safe'
        flatten_depth: Maximum number of segments to fold when keyFolding is enabled (default: None for Infinity)

    Returns:
        TOON formatted string

    Examples:
        >>> toon_encode({"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]})
        'users[2]{id,name}:\\n  1,Alice\\n  2,Bob'

        >>> toon_encode({"items": ["a", "b", "c"]})
        'items[3]: a,b,c'

        >>> toon_encode({"id": 123, "name": "Ada", "active": True})
        'id: 123\\nname: Ada\\nactive: true'
    """
    depth = float("inf") if flatten_depth is None else flatten_depth

    return toon.encode(
        data=data,
        indent=indent,
        delimiter=delimiter,
        key_folding=key_folding,
        flatten_depth=depth,
    )


@mcp.tool()
def toon_decode(
    toon_string: str,
    indent: int = 2,
    strict: bool = True,
    expand_paths: str = "off",
) -> dict[str, Any] | list[Any] | str | int | float | bool | None:
    """
    Decode TOON format string back into JSON data.

    Args:
        toon_string: The TOON formatted string to decode
        indent: Expected number of spaces per indentation level (default: 2)
        strict: Enable strict validation during decoding (default: True). When False, allows lenient parsing
        expand_paths: Enable path expansion to reconstruct dotted keys into nested objects. Options: 'off' (default) or 'safe'

    Returns:
        Decoded data as Python objects (dict, list, str, int, float, bool, or None)

    Examples:
        >>> toon_decode('users[2]{id,name}:\\n  1,Alice\\n  2,Bob')
        {'users': [{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': 'Bob'}]}

        >>> toon_decode('items[3]: a,b,c')
        {'items': ['a', 'b', 'c']}

        >>> toon_decode('id: 123\\nname: Ada\\nactive: true')
        {'id': 123, 'name': 'Ada', 'active': True}
    """
    return toon.decode(
        toon=toon_string,
        indent=indent,
        strict=strict,
        expand_paths=expand_paths,
    )


def main():
    """Run the TOON MCP server."""
    mcp.run()


if __name__ == "__main__":
    main()
