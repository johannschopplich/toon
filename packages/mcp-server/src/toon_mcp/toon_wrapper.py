"""Wrapper for calling the TOON CLI from Python."""

import json
import subprocess
from pathlib import Path
from typing import Any


class ToonWrapper:
    """Wrapper class to interface with TOON CLI."""

    def __init__(self):
        """Initialize the TOON wrapper."""
        # Find the TOON CLI in the workspace
        self.repo_root = Path(__file__).parent.parent.parent.parent
        self.cli_path = self.repo_root / "packages" / "cli"

    def encode(
        self,
        data: Any,
        indent: int = 2,
        delimiter: str = ",",
        key_folding: str = "off",
        flatten_depth: float = float("inf"),
    ) -> str:
        """
        Encode JSON data into TOON format.

        Args:
            data: The data to encode
            indent: Number of spaces per indentation level
            delimiter: Delimiter for array values (comma, tab, or pipe)
            key_folding: Key folding mode (off or safe)
            flatten_depth: Maximum number of segments to fold

        Returns:
            TOON formatted string
        """
        # Convert data to JSON string
        json_input = json.dumps(data)

        # Build command
        cmd = ["npx", "tsx", str(self.cli_path / "src" / "cli-entry.ts"), "--encode"]

        # Add options
        cmd.extend(["--indent", str(indent)])
        cmd.extend(["--delimiter", delimiter])
        cmd.extend(["--key-folding", key_folding])

        if flatten_depth != float("inf"):
            cmd.extend(["--flatten-depth", str(int(flatten_depth))])

        # Run command with JSON input
        result = subprocess.run(
            cmd,
            input=json_input,
            capture_output=True,
            text=True,
            check=True,
            cwd=self.repo_root,
        )

        return result.stdout

    def decode(
        self,
        toon: str,
        indent: int = 2,
        strict: bool = True,
        expand_paths: str = "off",
    ) -> Any:
        """
        Decode TOON format string back into JSON data.

        Args:
            toon: The TOON formatted string to decode
            indent: Expected number of spaces per indentation level
            strict: Enable strict validation
            expand_paths: Path expansion mode (off or safe)

        Returns:
            Decoded data as Python objects
        """
        # Build command
        cmd = ["npx", "tsx", str(self.cli_path / "src" / "cli-entry.ts"), "--decode"]

        # Add options
        cmd.extend(["--indent", str(indent)])

        if not strict:
            cmd.append("--no-strict")

        cmd.extend(["--expand-paths", expand_paths])

        # Run command with TOON input
        result = subprocess.run(
            cmd,
            input=toon,
            capture_output=True,
            text=True,
            check=True,
            cwd=self.repo_root,
        )

        # Parse JSON output
        return json.loads(result.stdout)
