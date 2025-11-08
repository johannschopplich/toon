"""Type definitions for TOON."""

from typing import Union, Dict, List, Any

# Type alias for any valid TOON value
ToonValue = Union[
    None,
    bool,
    int,
    float,
    str,
    List["ToonValue"],
    Dict[str, "ToonValue"],
]

# Internal types
ToonObject = Dict[str, ToonValue]
ToonArray = List[ToonValue]
