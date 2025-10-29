# TOON CLI

Command-line tool for converting between JSON and TOON (Token-Oriented Object Notation) formats.

## Usage

```bash
# Encode JSON to TOON
npx @byjohann/toon-cli input.json -o output.toon

# Decode TOON to JSON
npx @byjohann/toon-cli data.toon -o output.json

# Output to stdout (no -o flag)
npx @byjohann/toon-cli input.json

# Custom delimiter
npx @byjohann/toon-cli input.json --delimiter "|" -o output.toon

# Length marker
npx @byjohann/toon-cli input.json --length-marker "#" -o output.toon

# Disable strict mode (decoding)
npx @byjohann/toon-cli data.toon --no-strict -o output.json
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
