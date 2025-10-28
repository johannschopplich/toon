# Token-Oriented Object Notation (TOON) Specification

Status: Draft
Spec version: 1.0.0
Document date: 2025-10-27
License: MIT

1. Abstract

TOON (Token-Oriented Object Notation) is a compact, human-readable serialization format optimized for Large Language Models. It combines indentation-based structure (familiar from YAML) with tabular array encoding (akin to CSV) to reduce token usage while preserving clarity. TOON is designed for uniform complex objects, supports deterministic canonical encoding, and provides explicit, LLM-friendly guardrails such as array lengths and tabular headers.

2. Status of This Document

This is the core specification for TOON v1.0.0. It defines the wire format and conformance requirements for encoders and decoders. Changes are tracked in the associated repository issue tracker. Implementations MAY expose encoder options (e.g., delimiter, length marker), but MUST preserve interoperability as defined here.

3. Terminology and Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" are to be interpreted as described in BCP 14 (RFC 2119 and RFC 8174) when, and only when, they appear in all capitals.

Terms:
- Object: A mapping from string keys to values.
- Array: An ordered sequence of values.
- Primitive: A string, number, boolean, or null.
- Value: Any of Object, Array, or Primitive.
- Tabular Array: An array rendered with a header listing fields and subsequent row lines (uniform objects with primitive values).
- List Array: An array rendered as a list of N items each starting with "- " (fallback for non-uniform arrays, arrays of arrays, or nested structures).
- Primitive Array: An array of primitives, rendered inline on a single line.
- Header: The array declaration that includes the array length and optional delimiter and field list (e.g., key[N], key[N]{f1,f2}, [N]).
- Active Delimiter (Delimiter): The character separating array values and tabular fields/rows: comma (,), tab (\t), or pipe (|).
- Canonical Encoding: Deterministic formatting with fixed indentation, spacing, quoting, and ordering rules as defined in Section 10.
- Encoder: An implementation that produces TOON from a data model.
- Decoder: An implementation that parses TOON into a data model.

4. Media Type and Encoding

- Media type: text/toon (RECOMMENDED).
- File extension: .toon (RECOMMENDED).
- Character encoding: UTF-8 ONLY (MUST). No BOM (MUST NOT).
- Line endings: LF (U+000A) (RECOMMENDED). Decoders SHOULD accept CRLF.

5. Data Model

Supported values (MUST):
- Object: string keys to values (Object | Array | Primitive).
- Array: ordered values.
- Primitives: string, number (finite), boolean, null.

Normalization for non-JSON inputs (MUST unless otherwise noted):
- Number (finite): decimal string, no scientific notation; "-0" normalized to "0".
- Number (NaN, ±Infinity): encoded as null.
- BigInt: decimal digits, unquoted.
- Date: ISO 8601 string in quotes (UTC, e.g., "2025-01-01T00:00:00.000Z").
- undefined, function, symbol: encoded as null.

Ordering:
- Object key order: encoders MUST preserve insertion order.
- Tabular header key order: MUST be taken from the first object in the array.

6. Core Syntax

6.1 Lines and Indentation
- One logical construct per line.
- Indentation is two spaces per level in canonical encoding (MUST for canonical encoders). Decoders SHOULD accept any consistent number of spaces per level but MUST NOT accept tabs for indentation.
- There MUST be a single space after a colon in "key: value".
- No trailing spaces at the end of any line (MUST NOT).
- No trailing newline at end of document (MUST NOT).

6.2 Key-Value Lines
- Syntax: key: value
  - Exactly one space after the colon (MUST).
- Nested or empty object values:
  - key: on its own line (MUST).
  - Nested fields appear on subsequent lines, indented one level (two spaces in canonical encoding).

6.3 Objects
- Root objects encode as a series of key-value lines.
- Empty root objects serialize as an empty string (zero-length output).
- Empty nested objects serialize as "key:" on a line by itself; no lines follow for that object.

6.4 Arrays (Overview)
- An array header declares its length in brackets: [N] (MUST).
- Three renderings:
  - Primitive Array (inline single line).
  - Tabular Array (uniform object rows).
  - List Array (fallback).
- Root arrays omit a key; the header begins the line (e.g., [N]: …).

6.5 Delimiters
- The active delimiter (MAY): comma (,), tab (\t), or pipe (|).
- Header declaration (MUST):
  - Comma: implicit, header shows [N] (no delimiter marker).
  - Tab: explicit in header [N\t] (the header literally contains a tab).
  - Pipe: explicit in header [N|].
- The active delimiter declared by an array header MUST be used for:
  - Inline primitive array values.
  - Tabular header field list and tabular row values.
  - Array-of-arrays inner headers and values where those arrays have their own headers (each array declares its own delimiter).
- Encoders MAY apply the same delimiter across the entire document; decoders MUST honor the delimiter declared by each array’s header (no global default assumed).
- If a length marker is present (Section 9), it appears immediately after "[" and before N.

6.6 Primitive Arrays (Inline Form)
- Syntax for object field: key[N<optional-delim>]: v1<delim>v2… (all on one line).
- Syntax at root: [N<optional-delim>]: v1<delim>v2…
- Empty arrays: key[0]: and [0]: (no values).
- Values MUST follow quoting rules (Section 7), including delimiter-aware quoting.

6.7 Tabular Arrays (Uniform Objects)
Preconditions for tabular form (all MUST be true):
- Every element is an object.
- Every object has the identical set of keys (no missing or extra keys).
- All values are primitives (no nested objects or arrays).

Header syntax:
- Object field: key[N]{k1<delim>k2<delim>…}:
- Root: [N]{k1<delim>k2<delim>…}:
- For comma delimiter, fields in {…} are comma-separated.
- For tab/pipe delimiter, fields in {…} are separated by the active delimiter.
- Header field order MUST be derived from the first object in the array.
- Header keys MUST be quoted per key quoting rules (Section 7.1), including delimiter-aware quoting.

Rows:
- Exactly N rows (one per line) MUST follow the header.
- Each row contains the object’s values in the header key order, separated by the active delimiter.
- Values MUST be quoted per value quoting rules (Section 7.2), including delimiter-aware quoting (Section 7.3).
- A single-field tabular array still emits one value per row (no trailing delimiter).

Fallback:
- If any precondition fails, encoders MUST use List Array form (Section 6.8) for the entire array.

6.8 List Arrays (Fallback)
- Syntax for object field: key[N]: followed by N list items, each starting with two spaces, hyphen, space ("  - ").
- Syntax at root: [N]:, then N list items.

List item rendering:
- Primitive item: "  - <value>".
- Object item:
  - The first field appears on the hyphen line: "  - key: value" (or "  - key:" for nested/empty object).
  - Subsequent fields of the same object appear on following lines at the same indentation level as the first field’s content.
- Array item (when the list item’s first field is itself an array):
  - The array header appears on the hyphen line: "  - [M<optional-delim>]: …" for primitive arrays, or "  - [M<optional-delim>]{…}:" for tabular arrays, or "  - [M<optional-delim>]:" for nested list arrays.
  - The array’s rows/items/values appear indented two spaces under that hyphen line (i.e., one additional indent level).
  - Subsequent fields of the same object appear at that same indentation level (aligned with the nested array contents).
- Arrays of arrays:
  - Render as list arrays with nested array headers for inner arrays:
    Example (root):
    [2]:
      - [2]: 1,2
      - [0]:
- Mixed arrays (mixing primitives and objects and/or arrays):
  - MUST use List Array form.

7. Quoting and Escaping

7.1 Keys (Object Keys and Tabular Header Keys)
Keys MUST be quoted if any of the following is true:
- Contains spaces, commas, colons, quotes, backslashes, control characters, or the active delimiter.
- Contains brackets [] or braces {}.
- Begins with a hyphen ("-").
- Is numeric-only.
- Is empty.

Escapes (MUST):
- Quote as "...".
- Inside quotes: " → \", backslash → \\, newline → \n, tab → \t, carriage return → \r, and other control characters with standard C-style escapes where applicable.

7.2 String Values
Strings MAY be unquoted only if all are true:
- Do not contain a colon (:) or the active delimiter.
- Do not begin with "- " (list-like).
- Do not lead or trail with spaces.
- Do not look like boolean/number/null literals: "true", "false", "null", decimal numbers (including negative, fractional, scientific notation indicators, or leading-zero forms like "05"), e.g., "42", "-3.14", "1e-6", "05".
- Do not look like structural tokens, e.g., "[5]", "{key}", "[3]: x,y".
- Do not contain quotes, backslashes, or control characters.

Otherwise, strings MUST be quoted, using the same escape rules as for keys.

Unicode:
- Unicode characters, including emoji, MAY appear unquoted provided they do not violate the unquoted rules above (MUST).

7.3 Delimiter-aware Quoting
- Unquoted strings MUST NOT contain the active delimiter.
- When the active delimiter is tab or pipe, commas are allowed unquoted.
- The delimiter-aware rule applies uniformly to:
  - Object values.
  - Primitive array values.
  - Tabular row values.
  - Nested arrays (including arrays-of-arrays).

8. Numbers, Booleans, and Null

- Numbers (finite) MUST be emitted in plain decimal (no scientific notation); "-0" MUST be "0".
  Examples: 1e6 → 1000000; 1e-6 → 0.000001; 1e20 → 100000000000000000000.
- Non-finite numbers (NaN, ±Infinity) MUST be encoded as null.
- BigInt values MUST be emitted as unquoted decimal digits.
- Booleans true/false and null MUST be unquoted tokens.

9. Length Marker Option

- An OPTIONAL length marker "#" MAY prefix the array length inside brackets: [#N].
- If present, it MUST appear immediately after "[" and before N, and MUST be preserved for that header.
- With explicit delimiters, the marker appears before the delimiter: e.g., [#3|].
- The length marker MAY also be used in nested array headers displayed on hyphen lines.
- Decoders MUST accept both forms (with and without the length marker).

10. Canonical Encoding and Determinism

Encoders that claim canonical output MUST:
- Use exactly two spaces per indentation level; NEVER use tabs for indentation.
- Emit "key: value" with exactly one space after the colon.
- Emit "key:" for nested/empty objects with no trailing space.
- Use the default delimiter comma (,) unless configured; if configured, apply consistently to all arrays emitted by that encoder instance.
- Preserve object key insertion order.
- For tabular arrays, take header key order from the first object.
- Apply quoting and escaping rules as specified in Section 7, including delimiter-aware quoting.
- Emit no trailing spaces on any line and no trailing newline at the end of the document.

11. Conformance Classes

- Encoder:
  - MUST produce syntactically valid TOON per Sections 6-9.
  - MUST enforce tabular array preconditions and fall back to list arrays where required.
  - MUST honor canonical encoding rules (Section 10) when claiming canonical output.

- Decoder:
  - MUST parse headers, including [N], optional length marker, and optional delimiter and field lists.
  - MUST enforce structural invariants:
    - Row count equals N for tabular arrays.
    - Value count per row equals header field count for tabular arrays.
    - List arrays contain exactly N items.
    - Indentation consistency (no tabs as indentation).
    - Proper quoting and valid escape sequences.
  - MUST apply delimiter-aware parsing using the active delimiter declared by the nearest array header.
  - MUST return errors for structural violations (see Section 12).

- Round-trip:
  - For supported input types, decode(encode(x)) MUST semantically equal x subject to the normalizations in Section 5 (e.g., -0 → 0, non-finite → null, Date → ISO string, BigInt → decimal).
  - encode(decode(s)) MUST produce a canonical equivalent when the encoder claims canonical output.

12. Error Handling

Decoders MUST produce an error (or equivalent diagnostic) for:
- Malformed array headers (missing [N], invalid length, malformed delimiter, malformed {field list}).
- Row count mismatch vs N in tabular arrays.
- Value count mismatch vs field count in tabular rows.
- Inconsistent or illegal indentation (tabs for indentation, or mixing width).
- Unbalanced quotes or invalid escape sequences.
- Use of active delimiter in unquoted strings.

Decoders SHOULD error (or treat deterministically and document behavior) for:
- Duplicate keys within the same object. If accepted, the last occurrence SHOULD win and the behavior MUST be documented.

Diagnostics:
- Implementations SHOULD report line and column of the failure and relevant context (e.g., header vs row).

13. Security Considerations

- Treat all input as untrusted. Decoders MUST NOT execute code or evaluate expressions.
- Keys like "__proto__", "prototype", or "constructor" MUST be treated as ordinary string keys to avoid prototype pollution, or inputs containing such keys SHOULD be rejected in strict modes.
- Implement resource limits (SHOULD): maximum nesting depth, maximum line length, maximum document size, maximum row count.
- Guard against catastrophic backtracking in regex-based parsers (SHOULD).
- In LLM-generation workflows, validate structural guardrails (row counts, delimiters, quoting) before consuming generated data (RECOMMENDED).

14. Internationalization

- TOON is UTF-8; Unicode text (including emoji and non-Latin scripts) is permitted.
- No normalization is required by the spec; implementations MAY offer optional normalization (e.g., NFC) but MUST NOT alter content by default.

15. Interoperability and Backward Compatibility

- The core syntax and data model are stable.
- New delimiters or markers, if introduced, MUST be explicitly declared in headers to remain backward compatible.
- The format has no inline comments or metadata; future extensions SHOULD be out of band to preserve compatibility.
- Ports in multiple languages SHOULD follow this spec; deviations MUST be documented.

16. Examples (Informative)

Objects:
```
id: 123
name: Ada
active: true
```

Nested object:
```
user:
  id: 123
  name: Ada
```

Primitive array:
```
tags[3]: admin,ops,dev
```

Tabular array:
```
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
```

List array (non-uniform):
```
items[2]:
  - id: 1
    name: First
  - id: 2
    name: Second
    extra: true
```

Arrays of arrays:
```
pairs[2]:
  - [2]: 1,2
  - [0]:
```

Root arrays:
```
[2]: x,y
[2]{id}:
  1
  2
```

Delimiter variants:
```
tags[3|]: reading|gaming|coding
items[2	]{sku	name	qty	price}:
  A1	Widget	2	9.99
  B2	Gadget	1	14.5
```

Length marker:
```
tags[#3]: reading,gaming,coding
pairs[#2]:
  - [#2]: a,b
  - [#2]: c,d
```

17. Reference Algorithms (Informative)

17.1 Encoding Algorithm (high-level)
- Dispatch by value type:
  - null/boolean: emit token.
  - number: if finite, emit normalized decimal; else "null".
  - BigInt: emit decimal digits.
  - Date: emit ISO string in quotes.
  - string: apply value quoting rules (Section 7.2).
  - array:
    - Compute N = length.
    - Determine active delimiter (options default or configured).
    - If array is all primitives: emit inline header and values separated by delimiter; [N<delim?>]: v1<delim>...
    - Else if all elements are objects with identical keys and all primitive values: render tabular:
      - Derive header field order from the first object.
      - Emit key[N]{fields} or [N]{fields}, using the active delimiter inside {…}.
      - Emit exactly N rows, with values in header order, delimiter-separated; quote values as needed.
    - Else: render list array:
      - Emit key[N]: (or [N]: at root).
      - For each element i in 1..N:
        - If primitive: "  - <value>".
        - If object: put first field on hyphen line as "  - k: v" or "  - k:"; render subsequent fields aligned.
          - If the first field is an array, place the array header on the hyphen line (primitive/tabular/list), then render its contents two spaces under; subsequent fields aligned with those contents.
        - If array: "  - [M<delim?>]: …" (primitive) or "  - [M<delim?>]{…}: …" (tabular) or "  - [M<delim?>]:" (list), then render contents two spaces under.
  - object:
    - For each key in insertion order:
      - Quote key if required; emit "key: value" or "key:" with nested block.
      - Apply value rules recursively.
- Global invariants: 2-space indent (canonical), no trailing spaces, no final newline.

17.2 Decoding Algorithm (high-level)
- Tokenize by lines; maintain an indentation stack (levels in multiples of two spaces recommended).
- Parse three line types:
  - Key-value line: key: value (or key: signaling nested object).
  - Array header: key[N<delim?>][: [inline-values]] or [N<delim?>]{fields}: or [N<delim?>]:
  - List item: "- " at the current indent level.
- Arrays:
  - Read the header to obtain N, optional length marker, optional delimiter, and optional {field list}.
  - For tabular arrays: read exactly N subsequent lines at the next indent level as rows; split by active delimiter; map to fields in order; apply string unquoting rules.
  - For inline primitive arrays: parse values on the same line; split by active delimiter and unquote.
  - For list arrays: read exactly N items, each starting with "- " at the next indent level; infer item type by the token after "- "; handle nested arrays and objects according to indentation.
- Validate invariants and provide diagnostics on failure.

18. Test Vectors and Conformance Mapping (Informative)

This spec maps to the following conformance areas demonstrated by the reference tests:
- Primitives: number normalization, non-finite → null, booleans/null unquoted, Unicode safety.
- Quoting: keys with spaces/colon/brackets/delimiters; values with colon/active delimiter; structural-looking strings; leading/trailing spaces; escape sequences.
- Objects: stable key order; empty object rendering.
- Arrays:
  - Primitive arrays (inline), including empty arrays.
  - Tabular arrays: uniform keys, primitive values, header quoting, value quoting, delimiter-aware behavior; header field order from first object.
  - List arrays: mixed/non-uniform; arrays of arrays; nested arrays as first field of list items with alignment rules; subsequent fields aligned.
  - Root arrays: primitive, tabular, list.
- Delimiters: comma (default), tab, pipe across primitive arrays, tabular arrays, nested arrays, and root arrays.
- Length marker: presence, nesting, and interaction with delimiters.
- Formatting invariants: 2-space indentation, no trailing spaces, no trailing newline.

19. IANA Considerations (Optional)

If registering a media type:
- Type name: text
- Subtype name: toon
- Required parameters: charset=utf-8
- Encoding considerations: 8-bit; UTF-8 text.
- Security considerations: see Section 13.
- Interoperability considerations: see Section 15.

20. Change Log (Informative)

- 1.0.0 (2025-10-27): Initial specification.

21. Acknowledgements (Informative)

Thanks to the authors and maintainers of language ports and to early adopters who provided feedback and tests.

Appendix A. Grammar Sketch (Informative)

Note: The grammar is contextual due to active delimiter selection and indentation. This sketch aids implementers; normative behavior is in the main text.

- Document
  - document := lines
  - lines := { line LF } [ last-line-no-LF ]
- Line Types
  - line := object-line | array-header-line | row-line | list-item-line
- Keys and Values (informal)
  - key := quoted-key | bare-key
  - quoted-key := DQUOTE { escaped-char | any-char-except-DQUOTE-BACKSLASH } DQUOTE
  - bare-key := 1*(char without spaces, colon, quotes, backslash, control chars, brackets/braces, active-delimiter; not starting with "-"; not numeric-only)
  - value := quoted-string | bare-string | number | true | false | null
- Arrays
  - array-header := array-key? "[" length-marker? digits (delimiter-marker)? "]" ( field-list )? ":" [ inline-values ]
  - array-key := key ": " (when array is an object field) else absent at root
  - delimiter-marker := "|" | HTAB ; comma is implicit (no marker)
  - field-list := "{" key ( active-delim key )* "}"
  - inline-values := SP value ( active-delim value )*
  - list-array-body := indent "- " list-item { LF indent "- " list-item } ; count MUST match N
  - tabular-rows := { indent row } ; exactly N rows, where row := value ( active-delim value )*
- Indentation and Blocks
  - Nested object fields appear at +1 indent.
  - List items appear at +1 indent relative to their array header.
  - Contents of arrays placed on a list-item’s hyphen line appear at +1 indent relative to that hyphen line.

Examples in this appendix assume consistent two-space indentation; decoders MUST validate structure, not exact whitespace beyond rules in Sections 6 and 10.
