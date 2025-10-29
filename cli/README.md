# TOON CLI

Command-line tool for converting between JSON and TOON (Token-Oriented Object Notation) formats.

## Installation

```bash
npm install -g @byjohann/toon-cli
```

## Usage

```bash
# Encode JSON to TOON
toon input.json -o output.toon

# Decode TOON to JSON
toon data.toon -o output.json

# Output to stdout (no -o flag)
toon input.json

# Custom delimiter
toon input.json --delimiter "|" -o output.toon

# Length marker
toon input.json --length-marker "#" -o output.toon

# Disable strict mode (decoding)
toon data.toon --no-strict -o output.json
```

## Options

- `-o, --output <file>` - Output file path
- `-e, --encode` - Force encode mode (auto-detected by default)
- `-d, --decode` - Force decode mode (auto-detected by default)
- `--delimiter <char>` - Delimiter for arrays: `,` (comma), `\t` (tab), `|` (pipe)
- `--indent <number>` - Indentation size (default: 2)
- `--length-marker <char>` - Length marker character (only `#` supported)
- `--no-strict` - Disable strict mode for decoding
- `-h, --help` - Show help message
- `-V, --version` - Show version

## Auto-detection

The CLI automatically detects the operation based on file extension:
- `.json` files → encode to TOON
- `.toon` files → decode to JSON

## License

MIT
