# @toon-format/cli

Command-line tool for converting between JSON and TOON formats.

[TOON (Token-Oriented Object Notation)](https://toonformat.dev) is a compact, human-readable serialization format designed for passing structured data to Large Language Models with significantly reduced token usage.

## Installation

```bash
# npm
npm install -g @toon-format/cli

# pnpm
pnpm add -g @toon-format/cli

# yarn
yarn global add @toon-format/cli
```

Or use directly with `npx`:

```bash
npx @toon-format/cli [options] [input]
```

## Usage

```bash
toon [options] [input]
```

**Standard input:** Omit the input argument or use `-` to read from stdin. This enables piping data directly from other commands.

**Auto-detection:** The CLI automatically detects the operation based on file extension (`.json` → encode, `.toon` → decode). When reading from stdin, use `--encode` or `--decode` flags to specify the operation (defaults to encode).

### Basic Examples

```bash
# Encode JSON to TOON (auto-detected)
toon input.json -o output.toon

# Decode TOON to JSON (auto-detected)
toon data.toon -o output.json

# Output to stdout
toon input.json

# Pipe from stdin
cat data.json | toon
echo '{"name": "Ada"}' | toon

# Decode from stdin
cat data.toon | toon --decode
```

## Options

| Option | Description |
| ------ | ----------- |
| `-o, --output <file>` | Output file path (prints to stdout if omitted) |
| `-e, --encode` | Force encode mode (overrides auto-detection) |
| `-d, --decode` | Force decode mode (overrides auto-detection) |
| `--delimiter <char>` | Array delimiter: `,` (comma), `\t` (tab), `\|` (pipe) |
| `--indent <number>` | Indentation size (default: `2`) |
| `--length-marker` | Add `#` prefix to array lengths (e.g., `items[#3]`) |
| `--stats` | Show token count estimates and savings (encode only) |
| `--no-strict` | Disable strict validation when decoding |

## Advanced Examples

### Token Statistics

Show token savings when encoding:

```bash
toon data.json --stats -o output.toon
```

Example output:
```
✓ Encoded to TOON
  Input:  15,145 tokens (JSON)
  Output:  8,745 tokens (TOON)
  Saved:   6,400 tokens (42.3% reduction)
```

### Alternative Delimiters

#### Tab-separated (often more token-efficient)

```bash
toon data.json --delimiter "\t" -o output.toon
```

#### Pipe-separated with length markers

```bash
toon data.json --delimiter "|" --length-marker -o output.toon
```

### Lenient Decoding

Skip validation for faster processing:

```bash
toon data.toon --no-strict -o output.json
```

### Stdin Workflows

```bash
# Convert API response to TOON
curl https://api.example.com/data | toon --stats

# Process large dataset
cat large-dataset.json | toon --delimiter "\t" > output.toon

# Chain with other tools
jq '.results' data.json | toon > filtered.toon
```

## Why Use the CLI?

- **Quick conversions** between formats without writing code
- **Token analysis** to see potential savings before sending to LLMs
- **Pipeline integration** with existing JSON-based workflows
- **Flexible formatting** with delimiter and indentation options

## Troubleshooting

### Common Issues

**Error: "Cannot read file"**
- Check that the file path is correct and the file exists
- Ensure you have read permissions for the file

**Error: "Invalid JSON"**
- Verify your JSON is valid using a JSON validator
- Check for trailing commas or other syntax errors

**Error: "Invalid TOON format"**
- Ensure proper indentation (2 spaces by default)
- Check that array lengths match actual row counts
- Verify delimiter consistency in tabular arrays

**Error: "Invalid delimiter"**
- Only comma (`,`), tab (`\t`), and pipe (`|`) are supported
- Use quotes around tab: `--delimiter "\t"`

### Performance Tips

- Use tab delimiters (`--delimiter "\t"`) for maximum token efficiency
- Add `--stats` to see actual token savings
- For large files, pipe output to avoid terminal buffer issues: `toon large.json > output.toon`

### Getting Help

```bash
toon --help
```

For issues or feature requests, visit: https://github.com/toon-format/toon/issues

## Related

- [@toon-format/toon](https://www.npmjs.com/package/@toon-format/toon) - JavaScript/TypeScript library
- [Full specification](https://github.com/toon-format/spec) - Complete format documentation
- [Website](https://toonformat.dev) - Interactive examples and guides

## License

[MIT](https://github.com/toon-format/toon/blob/main/LICENSE) License © 2024-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
