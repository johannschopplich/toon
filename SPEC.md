# TOON Specification (v1.1)

Status: Draft, normative where indicated. This version specifies both encoding (producer behavior) and decoding (parser behavior).

- Normative statements use RFC 2119/8174 keywords: MUST, MUST NOT, SHOULD, SHOULD NOT, MAY.
- This spec targets implementers of encoders/decoders/validators, tool authors, and practitioners embedding TOON in LLM prompts.

Changelog:
- v1.1: Made decoding behavior normative; added decoding semantics, strict-mode validation rules, delimiter-aware parsing, and reference decoding algorithms. Added decoder options (indent, strict).
- v1: Initial encoding + normalization + conformance rules based on reference encoder and test suite.

Scope:
- This document defines the data model, encoding normalization (for the reference JavaScript/TypeScript encoder), concrete syntax, decoding semantics, and conformance requirements for producing and consuming TOON.

## 1. Terminology and Conventions

- TOON document: A sequence of UTF-8 text lines formatted according to this spec.
- Line: A sequence of non-newline characters terminated by LF (U+000A) in serialized form. Encoders MUST use LF line endings.
- Indentation level (depth): The number of indentation units (spaces) applied to a line. Depth 0 lines have no leading indentation.
- Indentation unit: A fixed number of spaces per level (default 2). Tabs MUST NOT be used for indentation.
- Header: The bracketed declaration for arrays, optionally followed by a field list, and terminating with a colon: e.g., key[3]: or items[2]{a,b}:.
- Field list: The brace-enclosed, delimiter-separated list of field names for tabular arrays: {f1<delim>f2}.
- List item: A line beginning with a hyphen and a space at a given depth ("- "), representing an element in an expanded array form.
- Delimiter: The character used to separate array/tabular values: comma (default), tab, or pipe.
- Active delimiter: The delimiter declared by the closest array header in scope. Used to split inline primitive arrays and tabular rows under that header.
- Length marker: An optional "#" prefix for array lengths in headers, e.g., [#3]. Decoders MUST accept and ignore the marker semantically.
- Primitive: string, number, boolean, or null.
- Object: Mapping from string keys to JsonValue.
- Array: Ordered sequence of JsonValue.
- JsonValue: Primitive | Object | Array.
- Strict mode: Decoder mode that enforces array lengths, tabular row counts, and delimiter consistency; also rejects invalid escapes and missing colons (default: true).

Notation:
- Regular expressions appear in slash-delimited form.
- Examples are informative unless stated otherwise.

## 2. Data Model

- TOON models data as:
  - JsonPrimitive: string | number | boolean | null
  - JsonObject: { [string]: JsonValue }
  - JsonArray: JsonValue[]
- Ordering:
  - Array order is preserved.
  - Object key order is preserved as encountered by the encoder.
- Numeric canonicalization (encoding):
  - -0 MUST be normalized to 0.
  - Finite numbers MUST be rendered without scientific notation (e.g., 1e6 → 1000000, 1e-6 → 0.000001), as per host-language number-to-string rules that avoid exponent notation in these cases.
- Null semantics: null is represented as the literal null.

## 3. Host-Language Normalization (Reference Encoder)

The reference encoder normalizes non-JSON values to the data model as follows:

- Number:
  - Finite: retained as number. -0 → 0. Non-exponential canonical form is required.
  - NaN, +Infinity, -Infinity: normalized to null.
- BigInt (JavaScript):
  - If within Number.MIN_SAFE_INTEGER..Number.MAX_SAFE_INTEGER: converted to number.
  - Otherwise: converted to a decimal string (e.g., "9007199254740993"). This string is then encoded using the string rules (see Section 6), and because it is numeric-like, it will be quoted.
- Date: converted to ISO string (e.g., "2025-01-01T00:00:00.000Z").
- Set: converted to array by iterating entries and normalizing each element.
- Map: converted to object using String(key) for keys and normalizing values.
- Plain object: own enumerable string keys are preserved in encounter order, values normalized recursively.
- Function, symbol, undefined, or unrecognized types: normalized to null.

Note: Other language ports SHOULD apply analogous normalization strategies consistent with this spec’s data model and encoding rules.

## 3A. Host-Language Interpretation (Reference Decoder)

Decoders map text tokens to host values as follows:

- Quoted tokens (strings and keys):
  - MUST be unescaped using only these escape sequences:
    - "\\" → backslash
    - "\"" → double quote
    - "\n" → newline
    - "\r" → carriage return
    - "\t" → tab
  - Any other escape (e.g., "\x", trailing backslash) MUST be rejected.
  - Unterminated quotes MUST be rejected.
  - Quoted primitives remain strings even if they lexically resemble numbers, booleans, or null (e.g., "true" → "true").
- Unquoted value tokens:
  - The exact tokens true, false, null map to booleans/null.
  - Numeric parsing:
    - MUST accept standard decimal and exponent forms (e.g., 42, -3.14, 1e-6).
    - MUST reject leading-zero decimals (e.g., "05", "0001"); such tokens MUST be treated as strings.
    - Only finite numbers are represented in TOON text; non-finite are not expected from conforming encoders.
  - Otherwise, the token is a string.
- Keys:
  - Decoded as strings. Quoted keys MUST be unescaped as above.
  - Missing colon after a (quoted or unquoted) key MUST be treated as an error.

## 4. Concrete Syntax Overview

TOON is a deterministic, line-oriented, indentation-based notation:

- Objects:
  - key: value for primitives.
  - key: alone for nested or empty objects, with nested fields indented one level.
- Arrays:
  - Primitive arrays are inline: key[N<delim?>]: v1<delim>v2.
  - Arrays of arrays (primitives): expanded list under a header: key[N<delim?>]: then "- [M<delim?>]: …" lines.
  - Arrays of objects:
    - Tabular form when uniform and primitive-only: key[N<delim?>]{f1<delim>f2}: then one row per line.
    - Otherwise expanded list: key[N<delim?>]: with "- …" items, following object-as-list-item rules.
- Whitespace invariants (encoding):
  - No trailing spaces at the end of any line.
  - No trailing newline at the end of the document.
  - One space after ": " in key: value lines and after array headers when followed by inline values (non-empty primitive arrays).
- Decoder discovery:
  - If the first non-empty depth-0 line is a valid root array header ("[ … ]:"), decode a root array.
  - If the document has a single line that is neither a valid array header nor a key-value line, decode it as a single primitive.
  - Otherwise, decode an object.

## 5. Tokens and Lexical Elements

- Structural characters: colon (:), hyphen (-), brackets ([ ]), braces ({ }), double-quote ("), backslash (\).
- Delimiters:
  - Comma (,) is the default.
  - Tab (\t) and pipe (|) are supported alternatives.
  - The active delimiter MAY appear inside array headers (see Section 7).
- Indentation unit: default 2 spaces per level; configurable at encode-time and decode-time. Tabs MUST NOT be used for indentation.
- List item markers: "- " (hyphen + single space) at the appropriate indentation level. An empty object as a list item is represented as a lone hyphen ("-").
- Character set: UTF-8. Tabs MUST NOT appear as indentation but MAY appear as the chosen delimiter or inside quoted strings via escapes.
- Decoding constraints:
  - Quoted strings and keys MUST use only the five escapes listed in Section 3A; others MUST error.
  - Decoders MUST locate the colon that follows the header (after any [..] and optional {..}) for arrays; missing colon MUST error.

## 6. Strings and Keys (Encoding and Decoding)

6.1 Escaping (Encoding and Decoding)

The following characters in quoted strings and keys MUST be escaped:
- Backslash: "\\" → "\\\\"
- Double quote: "\"" → "\\\""
- Newline: U+000A → "\\n"
- Carriage return: U+000D → "\\r"
- Tab: U+0009 → "\\t"

Decoders MUST reject any other escape sequence and unterminated strings.

6.2 Quoting Rules for String Values (Encoding)

A string value MUST be quoted (with escaping as above) if any of the following is true:
- It is empty ("").
- It has leading or trailing whitespace.
- It equals true, false, or null (case-sensitive).
- It is numeric-like:
  - Matches /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i (e.g., "42", "-3.14", "1e-6").
  - Or matches /^0\d+$/ (leading-zero decimals such as "05").
- It contains a colon (:), double quote ("), or backslash (\).
- It contains brackets or braces ([, ], {, }).
- It contains control characters such as newline, carriage return, or tab.
- It contains the active delimiter (comma, tab, or pipe).
- It starts with a hyphen (-), to avoid ambiguity with list markers.

If none of the conditions above apply, the string MAY be emitted without quotes. Unicode, emoji, and strings with internal (non-leading/trailing) spaces are safe unquoted provided they do not violate the conditions.

6.3 Key Encoding (Encoding)

Object keys and tabular field names:
- MAY be unquoted only if they match the pattern: ^[A-Za-z_][\w.]*$.
- Otherwise, they MUST be quoted using the escaping rules above.

Note: Keys containing spaces, punctuation (e.g., colon, pipe, hyphen), or starting with a digit MUST be quoted.

6.4 Decoding Rules for Strings and Keys (Decoding)

- Quoted strings and keys MUST be unescaped using only the five escapes in 6.1. Any other escape MUST error. Quoted primitives remain strings.
- Unquoted values:
  - true/false/null → boolean/null
  - Numeric tokens → numbers (with the leading-zero rule from 3A)
  - Otherwise → strings
- Keys (quoted or unquoted) MUST be followed by ":"; missing colon MUST error.

## 7. Array Headers

General header syntax:

- Without key (root arrays): [<marker?>N<delim?>]:
- With key: key[<marker?>N<delim?>]:
- With tabular fields: key[<marker?>N<delim?>]{field1<delim>field2}:

Where:
- N is the array length (non-negative integer).
- <marker?> is optional "#" when the length marker option is enabled (Section 13).
- <delim?> is:
  - Absent when the delimiter is comma.
  - Present and equal to the active delimiter when the delimiter is tab or pipe.
- Field names within braces are separated by the active delimiter and encoded using key rules (Section 6.3).
- Every header line MUST end with a colon.

Spacing:
- When an inline list of values follows a header on the same line (non-empty primitive arrays), there MUST be exactly one space after the colon before the first value.
- Otherwise, no trailing space follows the colon on the header line.

Decoding requirements:
- The bracket segment "[ … ]" MUST parse as a non-negative integer length. If present, a trailing tab or pipe inside the brackets selects the active delimiter for the header; otherwise comma is the active delimiter.
- An optional "#" MAY precede the length and MUST be ignored semantically.
- If a brace-enclosed fields segment "{ … }" is present, field names MUST be parsed using the active delimiter, and quoted field names MUST be unescaped per Section 6.1.
- A colon MUST follow the bracket (and fields) segment; missing colon MUST error.
- Inline values, if present on the same line, are split using the header’s active delimiter.

## 8. Primitive Encoding

- null: literal null.
- boolean: true or false (lowercase).
- number:
  - Finite: base-10 non-exponential representation, preserving sign except -0 normalized to 0.
  - Non-finite (NaN, ±Infinity): treated as null via normalization (Section 3).
- string: encoded per Section 6 with delimiter-aware quoting.

Decoding note:
- Primitive tokens are interpreted per Section 3A (quoted → string; unquoted → boolean/null/number/string with leading-zero rule).

## 9. Object Syntax

- Encoding:
  - Primitive fields: key: value (single space after colon).
  - Nested or empty objects: key: on its own line; if non-empty, nested fields appear at one more indentation level.
  - Key order: Implementations MUST preserve the encounter order when emitting fields.
  - An empty object at the root results in an empty document (no lines).
- Decoding:
  - A line "key:" with nothing after the colon at depth d opens an object; subsequent lines at depth > d belong to that object until the depth decreases to ≤ d.
  - Lines with "key: value" at the same depth are sibling fields.
  - Missing colon after a key (quoted or unquoted) MUST error.
  - Quoted keys MUST be followed immediately by ":"; missing colon MUST error.

## 10. Arrays

10.1 Primitive Arrays (Inline)

- Encoding:
  - Non-empty arrays: key[N<delim?>]: v1<delim>v2<delim>… where each vi is encoded as a primitive (Section 8) with delimiter-aware quoting (Section 6).
  - Empty arrays: key[0<delim?>]: (no values following).
  - Root arrays use the same rules without a key: [N<delim?>]: v1<delim>…
- Decoding:
  - Inline arrays are split using the active delimiter declared by the header; non-active delimiters MUST NOT split values.
  - In strict mode, the number of decoded values MUST equal N; otherwise error.

10.2 Arrays of Arrays (Primitives Only) — Expanded List

- Encoding:
  - Parent header: key[N<delim?>]: on its own line.
  - Each inner primitive array is a list item:
    - - [M<delim?>]: v1<delim>v2<delim>…
    - Empty inner arrays: - [0<delim?>]:
- Decoding:
  - Items appear at one deeper depth, each starting with "- " and an inner array header "[M<delim?>]: …".
  - Inner arrays are split using their own active delimiter; in strict mode, counts MUST match M.
  - In strict mode, the number of list items MUST equal outer N.

10.3 Arrays of Objects — Tabular Form

Tabular detection (encoding; MUST hold for all rows):
- Every element is an object.
- All objects have the same set of keys (order per object MAY vary).
- All values across these keys are primitives (no nested arrays/objects).

When satisfied (encoding):
- Header: key[N<delim?>]{f1<delim>f2<delim>…}: where the field order is the encounter order of the first object’s keys.
- Field names encoded as keys (Section 6.3), delimiter-aware.
- Rows: one line per object at one indentation level under the header, values joined by the active delimiter. Each value encoded as a primitive (Section 8) with delimiter-aware quoting (Section 6).
- Root tabular arrays omit the key: [N<delim?>]{…}: then rows.

Decoding:
- A tabular header declares the active delimiter and the ordered field list.
- Rows appear at one deeper depth as value lines separated by the active delimiter.
- Each row’s value count MUST equal the field count in strict mode; otherwise error.
- The number of rows MUST equal N in strict mode; otherwise error.
- Disambiguation at row depth:
  - If a line has no colon → it is a data row.
  - If a line has both a colon and the active delimiter, compare first occurrences:
    - Delimiter before colon → row.
    - Colon before delimiter → key-value line (end of rows).
  - If a line has a colon but no active delimiter → key-value line (end of rows).

10.4 Mixed / Non-Uniform Arrays — Expanded List

When tabular requirements are not met (encoding):
- Header: key[N<delim?>]:
- Each element is rendered as a list item at one indentation level under the header:
  - Primitive: - <primitive>
  - Primitive array: - [M<delim?>]: v1<delim>…
  - Object: formatted using "objects as list items" (Section 11).
  - Complex arrays (e.g., arrays of arrays with mixed shapes): - key'[M<delim?>]: followed by nested items as appropriate.

Decoding:
- Header declares the list length N and active delimiter for nested inline arrays.
- Each list item starts with "- " at one deeper depth and is parsed as:
  - Primitive (no colon or array header),
  - Inline primitive array (- [M<delim?>]: …),
  - First-field-on-hyphen object (- key: … or - key[N…]{…}: …),
  - Or complex nested arrays (e.g., arrays of arrays) using nested headers.
- In strict mode, the number of list items MUST equal N; otherwise error.

## 11. Objects as List Items

For an object appearing as a list item:

- Empty object list item: a single "-" at the list item indentation level.
- First field on the hyphen line:
  - Primitive: - key: value
  - Primitive array: - key[M<delim?>]: v1<delim>…
  - Tabular array: - key[N<delim?>]{fields}:
    - Followed by tabular rows at one more indentation level (relative to the hyphen line).
  - Non-uniform array of objects: - key[N<delim?>]:
    - Followed by list items at one more indentation level.
  - Object: - key:
    - Nested object fields appear at two more indentation levels (i.e., one deeper than subsequent sibling fields of the same list item).
- Remaining fields of the same object appear at one indentation level under the hyphen line, in encounter order, using normal object field rules.

Decoding:
- The first field is parsed from the hyphen line. If it is a nested object (- key:), nested fields are at +2 depth relative to the hyphen line; subsequent fields of the same list item are at +1 depth.
- If the first field is a tabular header on the hyphen line, its rows are at +1 depth and then subsequent sibling fields continue at +1 depth after the rows.

## 12. Delimiters

- Supported delimiters:
  - Comma (default): header omits the delimiter symbol.
  - Tab: header includes the tab character inside brackets and braces (e.g., [N<TAB>], {a<TAB>b}); rows/inline arrays use tabs to separate values.
  - Pipe: header includes "|" inside brackets and braces; rows/inline arrays use "|".
- Delimiter-aware quoting (encoding):
  - Strings containing the active delimiter MUST be quoted across object values, array values, and tabular rows.
  - Strings containing non-active delimiters (e.g., commas when using tab) do not require quoting unless another quoting condition applies.
- Delimiter-aware parsing (decoding):
  - Inline arrays and tabular rows MUST be split only on the active delimiter declared by the nearest array header.
  - Strings containing the active delimiter MUST be quoted to avoid splitting; non-active delimiters MUST NOT cause splits.
  - Nested headers may change the active delimiter; decoding MUST use the delimiter declared by the nearest header.

## 13. Length Marker

- When enabled by an encoder, the length marker "#" MUST appear immediately before the length in every array header, including nested arrays and tabular headers:
  - key[#N<delim?>]: …
  - key[#N<delim?>]{…}:
  - - [#M<delim?>]: …
- Decoding:
  - The marker MUST be accepted and ignored semantically.
  - In strict mode, declared lengths MUST match actual counts (rows/items/inline values); mismatches MUST error.

## 14. Indentation and Whitespace Invariants

- Encoding:
  - The encoder MUST use a consistent number of spaces per level (default 2; configurable).
  - Tabs MUST NOT be used for indentation.
  - Exactly one space after ": " in key: value lines.
  - Exactly one space after array headers when followed by inline values (non-empty primitive arrays).
  - No trailing spaces at the end of any line.
  - No trailing newline at the end of the document.
- Decoding:
  - Depth is derived from the number of leading spaces and the configured indent size. Implementations SHOULD accept inputs where depth is computed as floor(indentSpaces / indentSize).
  - Decoders SHOULD be resilient to surrounding whitespace around tokens; internal token semantics follow quoting rules.
  - Tabs used as indentation are non-conforming; behavior is undefined (validators MAY flag this).

## 15. Conformance

Conformance classes:

- Encoder:
  - MUST produce output adhering to all normative rules in Sections 2–14.
  - MUST be deterministic with respect to:
    - Object field order (encounter order).
    - Tabular detection (either uniformly tabular or not, given the input).
    - Quoting decisions for given values and active delimiter.

- Decoder:
  - MUST implement tokenization, escaping, and type interpretation per Sections 3A and 6.4.
  - MUST parse array headers per Section 7 and apply the declared active delimiter to inline arrays and tabular rows.
  - MUST implement structures and depth rules per Sections 9–12, including objects-as-list-items placement.
  - In strict mode (default true), MUST enforce:
    - Inline primitive array value count equals the declared length.
    - Tabular row count equals the declared length.
    - Tabular row value count equals the field count.
    - Invalid escapes and unterminated strings error.
    - Missing colon in key-value context errors.
    - Delimiter mismatches (e.g., rows not split by the active delimiter) provoke errors via count checks.

- Validator:
  - SHOULD verify structural conformance (headers, indentation, list markers).
  - SHOULD verify whitespace invariants.
  - SHOULD verify delimiter consistency between headers and rows.
  - SHOULD verify length counts vs. declared [N].

Options:
- Encoder options:
  - indent (default: 2 spaces)
  - delimiter (default: comma; alternatives: tab, pipe)
  - lengthMarker (default: disabled)
- Decoder options:
  - indent (default: 2 spaces)
  - strict (default: true)

## 16. Error Handling and Diagnostics

- Encoding normalization:
  - Inputs that cannot be represented in the data model (Section 2) are normalized (Section 3) before encoding (e.g., NaN → null).
- Tabular fallback (encoding):
  - If any tabular condition fails (Section 10.3), encoders MUST use expanded list format (Section 10.4).
- Decoding errors (strict mode):
  - Array length mismatch (inline arrays and list/tabular forms) MUST error.
  - Tabular row value count mismatch vs. field count MUST error.
  - Tabular row count mismatch vs. declared length MUST error.
  - Invalid escape sequences or unterminated strings MUST error.
  - Missing colon in key-value context MUST error.
  - Delimiter mismatch (e.g., rows joined by a different delimiter) MUST error via count checks.
  - Empty input is invalid and SHOULD error.
- Validators SHOULD report:
  - Trailing spaces, trailing newlines (encoder invariants).
  - Headers missing delimiter marks when non-comma delimiter is in use.
  - Mismatched row counts vs. declared [N].
  - Values violating delimiter-aware quoting rules.

## 17. Security Considerations

- Injection and ambiguity are mitigated by quoting rules:
  - Strings with colon, the active delimiter, leading hyphen, control characters, brackets/braces MUST be quoted.
- Decoders in strict mode reject malformed strings/escapes and structural inconsistencies (length/row counts), helping detect truncation or injected rows.
- Encoders SHOULD avoid excessive memory use on large inputs; implement streaming/tabular row emission where feasible.
- Unicode inputs:
  - Encoders SHOULD avoid altering Unicode content beyond required escaping; decoders SHOULD accept all valid Unicode in quoted strings and keys (with escapes as required).

## 18. Internationalization

- TOON supports full Unicode in keys and values, subject to quoting and escaping rules.
- Encoders MUST NOT apply locale-dependent formatting for numbers or booleans (e.g., no thousands separators).
- ISO 8601 strings SHOULD be used for date representations when normalizing host Date types.

## 19. Interoperability and Mappings (Informative)

- JSON:
  - TOON is designed for deterministic encoding of JSON-compatible data (after normalization).
  - Arrays of uniform objects map to CSV-like rows; other structures map to YAML-like nested forms.
- CSV:
  - TOON tabular sections generalize CSV with explicit lengths, field lists, and flexible delimiter choice.
- YAML:
  - TOON borrows indentation and list-item patterns but uses fewer quotes and explicit array headers to constrain ambiguity in LLM contexts.

## 20. Media Type and File Extensions (Provisional)

- Suggested media type: text/toon
- Suggested file extension: .toon
- Encoding: UTF-8
- Line endings: LF (U+000A)

## 21. Examples (Informative)

Objects:
```
id: 123
name: Ada
active: true
```

Nested objects:
```
user:
  id: 123
  name: Ada
```

Primitive arrays:
```
tags[3]: admin,ops,dev
```

Arrays of arrays (primitives):
```
pairs[2]:
  - [2]: 1,2
  - [2]: 3,4
```

Tabular arrays:
```
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
```

Mixed arrays:
```
items[3]:
  - 1
  - a: 1
  - text
```

Objects as list items (first field on hyphen line):
```
items[2]:
  - id: 1
    name: First
  - id: 2
    name: Second
    extra: true
```

Nested tabular inside a list item:
```
items[1]:
  - users[2]{id,name}:
    1,Ada
    2,Bob
    status: active
```

Delimiter variations:
```
# Tab delimiter
items[2	]{sku	name	qty	price}:
  A1	Widget	2	9.99
  B2	Gadget	1	14.5

# Pipe delimiter
tags[3|]: reading|gaming|coding
```

Length marker:
```
tags[#3]: reading,gaming,coding
pairs[#2]:
  - [#2]: a,b
  - [#2]: c,d
```

## 22. Reference Algorithms (Informative)

22.1 Tabular Detection (Encoding)

Given an array rows:
- If rows is empty → not tabular (fall back to expanded format).
- Let header = keys of the first row in encounter order; if header is empty → not tabular.
- For each row:
  - If row’s key count ≠ header length → not tabular.
  - For each key in header:
    - If key missing in row → not tabular.
    - If row[key] is not a primitive → not tabular.
- Otherwise tabular with header from the first row.

22.2 Safe-Unquoted String Decision (Encoding)

Given a string s and active delimiter d:
- If s is empty or s !== s.trim() → quote.
- If s ∈ {true,false,null} → quote.
- If s is numeric-like (regexes in Section 6.2) → quote.
- If s contains ":" or "\"" or "\\" → quote.
- If s contains any of "[", "]", "{", "}" → quote.
- If s contains any of "\n", "\r", "\t" → quote.
- If s contains the active delimiter d → quote.
- If s starts with "-" → quote.
- Else unquoted.

22.3 Header Formatting (Encoding)

- Start with optional key (encoded as per key rules).
- Append "[<marker?>N<delim?>]", where:
  - <marker?> is "#" if enabled.
  - <delim?> is absent for comma, or is the delimiter symbol for tab/pipe.
- If tabular, append "{field1<delim>field2}" where field names are key-encoded and joined by the active delimiter.
- Append ":".
- For non-empty primitive arrays on a single line, append a space and the joined values (each primitive-encoded with delimiter-aware quoting), joined by the active delimiter.

22.4 Decoding Overview

- Split input into lines; compute depth from leading spaces and indent size (default 2). Depth computation MAY be floor(indentSpaces / indentSize).
- Decide root form:
  - If first non-empty depth-0 line is a valid root array header: decode a root array.
  - Else if exactly one line and it is not a key-value line: decode a single primitive.
  - Else: decode an object.
- For objects at depth d: process lines at depth d; for arrays at depth d: read rows/list items at depth d+1.

22.5 Array Header Parsing (Decoding)

- Locate the first "[ … ]" segment on the line; parse:
  - Optional leading "#" marker (ignored semantically).
  - Length N as decimal integer.
  - Optional delimiter marker at the end: tab or pipe (comma otherwise).
- If a "{ … }" fields segment occurs between the "]" and the ":", parse field names using the active delimiter; for each name, if quoted, unescape it (Section 6.1).
- A colon MUST appear after the bracket/fields segment; otherwise error.
- Return the header (key, length, delimiter, fields?, hasLengthMarker) and any inline values after the colon.

22.6 parseDelimitedValues (Decoding)

- Iterate characters left-to-right keeping:
  - current token, inQuotes flag.
- If encountering a double quote, toggle inQuotes.
- While inQuotes, treat backslash + next char as a literal pair (to be validated later by the string parser).
- Only split on the active delimiter when not in quotes.
- Trim surrounding spaces around each token.

22.7 Primitive Token Parsing (Decoding)

- If token starts with a quote, it MUST be a properly quoted string (no trailing characters after the closing quote). Unescape it using only the five escapes; otherwise error.
- Else if token is true/false/null → boolean/null.
- Else if token is numeric without forbidden leading zeros and finite → number.
- Else → string.
- Empty tokens decode to empty string.

22.8 Object and List Item Parsing (Decoding)

- Key-value line: parse a (quoted or unquoted) key up to the first colon; missing colon → error. Rest of the line is the primitive value (if present).
- Nested object: "key:" with nothing after colon opens a nested object. If this is:
  - A field inside a regular object: nested fields at +1 depth relative to that line.
  - The first field on a list-item hyphen line: nested fields at +2 depth relative to the hyphen line; subsequent sibling fields at +1 depth.
- List items:
  - Lines start with "- " at one deeper depth than the parent array header.
  - After "- ":
    - If "[ … ]:" appears → an inline array item; decode with its own header and active delimiter.
    - Else if a colon appears → object with first field on hyphen line; parse first field and then subsequent fields as above.
    - Else → primitive token.

22.9 Strict Mode Count Checks (Decoding)

- After decoding:
  - Inline arrays: item count MUST equal N.
  - List arrays: number of items MUST equal N.
  - Tabular arrays: number of rows MUST equal N; each row’s value count MUST equal field count.
- For tabular arrays, at row depth after N rows, if another same-depth line looks like a row (per disambiguation in 10.3), it MUST error in strict mode.

## 23. ABNF Sketch (Informative)

This sketch omits full Unicode and escaping details; it illustrates structure only.

```
document       = *(line LF) [line]
line           = indent (object-line / array-header / list-item / row)
indent         = *SP        ; multiple of indent unit (default 2 SP)

object-line    = key ":" [SP primitive]
array-header   = [key] "[" [marker] length [delimsym] "]" [fields] ":" [SP inline-values]
marker         = "#"
length         = 1*DIGIT
delimsym       = "|" / HTAB
fields         = "{" fieldname *(delim fieldname) "}"
fieldname      = key
inline-values  = primitive *(delim primitive)
delim          = delimsym / ","  ; actual active delimiter for the array

list-item      = "- " ( primitive
                       / inline-array
                       / object-head
                       / nested-array-head )
inline-array   = "[" [marker] length [delimsym] "]" ":" [SP inline-values]
object-head    = key ":"          ; followed by nested object at deeper indent
nested-array-head = key "[" [marker] length [delimsym] "]" ":" [LF] ; followed by nested items

row            = primitive *(delim primitive)

key            = unquoted-key / quoted
unquoted-key   = ALPHA / "_" , *( ALPHA / DIGIT / "_" / "." )
quoted         = DQUOTE *(escaped-char / safe-char) DQUOTE

primitive      = null / boolean / number / string
null           = "null"
boolean        = "true" / "false"
number         = 1*DIGIT / "-" 1*DIGIT / 1*DIGIT "." 1*DIGIT / ...
string         = quoted / safe-unquoted-string
```

Notes:
- Safe-unquoted-string constraints are defined in Section 6.2 (encoding).
- Quoted strings/keys accept only the five escapes in Section 6.1; others MUST error in decoding.
- Row/key-value disambiguation at tabular row depth is defined in 10.3.

## 24. Test Suite and Compliance (Informative)

- Implementations are encouraged to validate against a comprehensive test suite covering:
  - Primitive encoding/decoding, quoting, control-character escaping.
  - Object key encoding/decoding and order preservation.
  - Primitive arrays (inline), empty arrays.
  - Arrays of arrays (expanded), mixed-length and empty inner arrays.
  - Tabular detection and formatting, including delimiter variations.
  - Mixed arrays and objects-as-list-items behavior, including nested arrays and objects.
  - Whitespace invariants (no trailing spaces/newline).
  - Normalization (BigInt, Date, undefined, NaN/Infinity, functions, symbols).
  - Decoder strict-mode errors: count mismatches, invalid escapes, missing colon, delimiter mismatches.

The provided reference tests in the repository mirror these conditions and SHOULD be used to ensure conformance.

## 25. Rationale (Informative)

- Token efficiency: Removing repeated keys and braces for uniform arrays markedly reduces tokens vs. JSON.
- LLM-friendly guardrails: Declared lengths and field lists help models parse and validate structure.
- Determinism: Strict quoting/spacing/ordering yields outputs that are easy to compare, cache, and validate.
- Delimiters: Tab and pipe often reduce quoting needs (e.g., commas in natural language), and can tokenize more efficiently.

## 26. Versioning and Extensibility

- Backward-compatible evolutions SHOULD preserve current headers, quoting rules, and indentation semantics.
- Reserved/structural characters (colon, brackets, braces, hyphen) MUST retain current meanings.
- Future work (non-normative): schemas, comments/annotations, additional delimiter profiles.

## 27. Acknowledgments and License

- Credits: Author and contributors; ports in other languages (Elixir, PHP, Python, Ruby, Java, .NET, Swift, Go).
- License: MIT (see repository for details).

---

Appendix: Cross-check With Reference Behavior (Informative)

- All normative behaviors specified herein are implemented and validated by the reference encoder and decoder test suites, including:
  - Safe-unquoted string rules and delimiter-aware quoting.
  - Object and tabular header formation using the active delimiter (comma implicit; tab/pipe explicit), and delimiter-aware parsing.
  - Length marker propagation (encoding) and acceptance (decoding).
  - Tabular detection requiring uniform keys and primitive-only values (encoding).
  - Objects-as-list-items formatting and decoding (first field on hyphen line, nested object content at +2; subsequent fields at +1).
  - Whitespace invariants for encoding and depth-based parsing for decoding.
