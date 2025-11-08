# TOON - Python Implementation

Python implementation of TOON (TypeScript Object Notation), a lightweight, human-readable serialization format.

## Installation

```bash
# From source
cd packages/toon-py
pip install -e .

# From PyPI (when published)
pip install toon
```

## Quick Start

```python
from toon import encode, decode

# Encode Python data to TOON
data = {
    "name": "Alice",
    "age": 30,
    "active": True,
    "tags": ["python", "developer"]
}

toon_str = encode(data)
print(toon_str)
# Output: {name:Alice, age:30, active:true, tags:[python, developer]}

# Decode TOON back to Python
decoded = decode(toon_str)
print(decoded)
# Output: {'name': 'Alice', 'age': 30, 'active': True, 'tags': ['python', 'developer']}
```

## Features

- ✅ All primitive types (str, int, float, bool, None)
- ✅ Collections (list, dict)
- ✅ Special values (NaN, Infinity, -Infinity)
- ✅ Nested structures
- ✅ Compact and pretty-print modes
- ✅ Command-line interface
- ✅ Zero runtime dependencies

## CLI Usage

```bash
# Encode JSON to TOON
python -m toon.cli encode input.json -o output.toon

# Decode TOON to JSON
python -m toon.cli decode input.toon -o output.json

# Pipe support
echo '{"name":"Alice"}' | python -m toon.cli encode
```

## Advanced Usage

### Custom Encoding Options

```python
from toon import encode, EncodeOptions

data = {"z": 1, "a": 2, "m": 3}

# Pretty print with sorted keys
options = EncodeOptions(
    indent=2,
    sort_keys=True,
    compact=False
)

result = encode(data, options)
```

### Supported Types

- **Primitives**: `str`, `int`, `float`, `bool`, `None`
- **Collections**: `list`, `dict`
- **Special Numbers**: `math.nan`, `math.inf`, `-math.inf`

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run tests with coverage
pytest --cov=toon --cov-report=html
```

## Examples

See [examples.py](./examples.py) for more usage examples.

## Requirements

- Python 3.8+
- No runtime dependencies

## License

MIT License - see LICENSE file for details
