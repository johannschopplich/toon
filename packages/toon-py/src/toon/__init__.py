"""
TOON - TypeScript Object Notation (Python)

A Python implementation of TOON serialization format.
"""

from .encode import encode, EncodeOptions
from .decode import decode, DecodeOptions
from .types import ToonValue
from .exceptions import ToonEncodeError, ToonDecodeError

__version__ = "0.1.0"

__all__ = [
    "encode",
    "decode",
    "EncodeOptions",
    "DecodeOptions",
    "ToonValue",
    "ToonEncodeError",
    "ToonDecodeError",
]
