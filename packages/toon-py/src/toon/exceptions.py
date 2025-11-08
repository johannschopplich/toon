"""Custom exceptions for TOON operations."""


class ToonError(Exception):
    """Base exception for TOON operations."""
    pass


class ToonEncodeError(ToonError):
    """Exception raised during encoding."""
    pass


class ToonDecodeError(ToonError):
    """Exception raised during decoding."""
    pass
