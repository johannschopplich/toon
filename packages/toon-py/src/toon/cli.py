#!/usr/bin/env python3
"""Command-line interface for TOON."""

import argparse
import sys
import json
from typing import Optional

try:
    from toon import encode, decode, EncodeOptions, __version__
except ImportError:
    # For development
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
    from toon import encode, decode, EncodeOptions, __version__


def main() -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='TOON - TypeScript Object Notation for Python',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    
    parser.add_argument('--version', action='version', version=f'toon {__version__}')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Encode command
    encode_parser = subparsers.add_parser('encode', help='Encode JSON to TOON')
    encode_parser.add_argument('input', nargs='?', help='Input JSON file (default: stdin)')
    encode_parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    encode_parser.add_argument('--indent', type=int, help='Indentation spaces')
    encode_parser.add_argument('--sort-keys', action='store_true', help='Sort object keys')
    encode_parser.add_argument('--compact', action='store_true', default=True, help='Compact output')
    
    # Decode command
    decode_parser = subparsers.add_parser('decode', help='Decode TOON to JSON')
    decode_parser.add_argument('input', nargs='?', help='Input TOON file (default: stdin)')
    decode_parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    decode_parser.add_argument('--indent', type=int, default=2, help='JSON indentation')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    try:
        if args.command == 'encode':
            return handle_encode(args)
        elif args.command == 'decode':
            return handle_decode(args)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    
    return 0


def handle_encode(args: argparse.Namespace) -> int:
    """Handle encode command."""
    # Read input
    if args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)
    
    # Encode to TOON
    options = EncodeOptions(
        indent=args.indent,
        sort_keys=args.sort_keys,
        compact=args.compact
    )
    result = encode(data, options)
    
    # Write output
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(result)
    else:
        print(result)
    
    return 0


def handle_decode(args: argparse.Namespace) -> int:
    """Handle decode command."""
    # Read input
    if args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            toon_str = f.read()
    else:
        toon_str = sys.stdin.read()
    
    # Decode from TOON
    data = decode(toon_str)
    
    # Write output as JSON
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=args.indent)
    else:
        print(json.dumps(data, indent=args.indent))
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
