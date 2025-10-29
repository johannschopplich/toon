# TOON Specification (v1.2)

Status: Draft, normative where indicated. This version specifies both encoding (producer behavior) and decoding (parser behavior).

- Normative statements use RFC 2119/8174 keywords: MUST, MUST NOT, SHOULD, SHOULD NOT, MAY.
- Audience: implementers of encoders/decoders/validators; tool authors; practitioners embedding TOON in LLM prompts.

Changelog:
- v1.2:
  - Centralized decoding rules (primitives, keys) and strict-mode checklist.
  - Made header grammar normative and clarified delimiter scoping.
  - Tightened strict-mode indentation (exact multiples; tabs error).
  - Defined blank-line and trailing-newline decoding behavior.
  - Narrowed hyphen-based quoting rule to "-" and "- " only.
  - Clarified BigInt normalization (quoted string when out of safe range).
  - Unified root-form detection and row/key disambiguation language.
- v1.1: Made decoding behavior normative; added strict-mode rules, delimiter-aware parsing, and reference algorithms; decoder options (indent, strict).
- v1: Initial encoding, normalization, and conformance rules.

Scope:
- Defines the data model, encoding normalization (reference JS/TS), concrete syntax, decoding semantics, and conformance requirements for producing and consuming TOON.

## 1. Terminology and Conventions

- TOON document: A sequence of UTF-8 text lines formatted according to this spec.
- Line: A sequence of non-newline characters terminated by LF (U+000A) in serialized form. Encoders MUST use LF.
- Indentation level (depth): Leading indentation measured in fixed-size space units (indentSize). Depth 0 has no indentation.
- Indentation unit (indentSize): A fixed number of spaces per level (default 2). Tabs MUST NOT be used for indentation.
- Header: The bracketed declaration for arrays, optionally followed by a field list, and terminating with a colon; e.g., key[3]: or items[2]{a,b}:.
- Field list: Brace-enclosed, delimiter-separated list of field names for tabular arrays: {f1<delim>f2}.
- List item: A line beginning with "- " at a given depth representing an element in an expanded array.
- Delimiter: The character used to separate array/tabular values: comma (default), tab, or pipe.
- Active delimiter: The delimiter declared by the closest array header in scope, used to split inline primitive arrays and tabular rows under that header.
- Length marker: Optional "#" prefix for array lengths in headers, e.g., [#3]. Decoders MUST accept and ignore it semantically.
- Primitive: string, number, boolean, or null.
- Object: Mapping from string keys to JsonValue.
- Array: Ordered sequence of JsonValue.
- JsonValue: Primitive | Object | Array.
- Strict mode: Decoder mode that enforces counts, indentation, and delimiter consistency; also rejects invalid escapes and missing colons (default: true).

Notation:
- Regular expressions appear in slash-delimited form.
- Examples are informative unless stated otherwise.

## 2. Data Model

- TOON models data as:
  - JsonPrimitive: string | number | boolean | null
  - JsonObject: { [string]: JsonValue }
  - JsonArray: JsonValue[]
- Ordering:
  - Array order MUST be preserved.
  - Object key order MUST be preserved as encountered by the encoder.
- Numbers (encoding):
  - -0 MUST be normalized to 0.
  - Finite numbers MUST be rendered without scientific notation (e.g., 1e6 → 1000000; 1e-6 → 0.000001).
- Null: Represented as the literal null.

## 3. Encoding Normalization (Reference Encoder)

The reference encoder normalizes non-JSON values to the data model:

- Number:
  - Finite → number (non-exponential). -0 → 0.
  - NaN, +Infinity, -Infinity → null.
- BigInt (JavaScript):
  - If within Number.MIN_SAFE_INTEGER..Number.MAX_SAFE_INTEGER → converted to number.
  - Otherwise → converted to a decimal string (e.g., "9007199254740993") and encoded as a string (quoted because it is numeric-like).
- Date → ISO string (e.g., "2025-01-01T00:00:00.000Z").
- Set → array by iterating entries and normalizing each element.
- Map → object using String(key) for keys and normalizing values.
- Plain object → own enumerable string keys in encounter order; values normalized recursively.
- Function, symbol, undefined, or unrecognized types → null.

Note: Other language ports SHOULD apply analogous normalization consistent with this spec’s data model and encoding rules.

## 4. Decoding Interpretation (Reference Decoder)

Decoders map text tokens to host values:

- Quoted tokens (strings and keys):
  - MUST be unescaped using only these escape sequences:
    - "\\" (backslash), "\"" (double quote), "\n" (newline), "\r" (carriage), "\t" (tab)
  - Any other escape (e.g., "\x", "\u", trailing backslash) MUST error.
  - Unterminated strings MUST error.
  - Quoted primitives remain strings even if they look like numbers/booleans/null.
- Unquoted value tokens:
  - true, false, null → booleans/null.
  - Numeric parsing:
    - MUST accept standard decimal and exponent forms (e.g., 42, -3.14, 1e-6, -1E+9).
    - MUST treat tokens with forbidden leading zeros (e.g., "05", "0001") as strings (not numbers).
    - Only finite numbers are expected from conforming encoders.
  - Otherwise → string.
- Keys:
  - Decoded as strings (quoted keys MUST be unescaped as above).
  - A colon MUST follow a key; missing colon MUST error.

## 5. Concrete Syntax and Root Form

TOON is a deterministic, line-oriented, indentation-based notation.

- Objects:
  - key: value for primitives.
  - key: alone for nested or empty objects; nested fields appear at depth +1.
- Arrays:
  - Primitive arrays are inline: key[N<delim?>]: v1<delim>v2…
  - Arrays of arrays (primitives): expanded list items under a header: key[N<delim?>]: then "- [M<delim?>]: …"
  - Arrays of objects:
    - Tabular form when uniform and primitive-only: key[N<delim?>]{f1<delim>f2}: then one row per line.
    - Otherwise: expanded list items: key[N<delim?>]: with "- …" items (see Section 10.4 and Section 10.5).
- Root form discovery:
  - If the first non-empty depth-0 line is a valid root array header ("[ … ]:"), decode a root array.
  - Else if the document has exactly one non-empty line and it is neither a valid array header nor a key-value line, decode a single primitive.
  - Otherwise, decode an object.
  - In strict mode, multiple non-key/value non-header lines at depth 0 is invalid.

## 6. Header Syntax (Normative)

Array headers declare length and active delimiter, and optionally field names.

General forms:
- Root header (no key): [<marker?>N<delim?>]:
- With key: key[<marker?>N<delim?>]:
- Tabular fields: key[<marker?>N<delim?>]{field1<delim>field2<delim>…}:

Where:
- N is the non-negative integer length.
- <marker?> is optional "#"; decoders MUST accept and ignore it semantically.
- <delim?> is:
  - absent for comma,
  - HTAB for tab,
  - "|" for pipe.
- Field names in braces are separated by the same active delimiter and encoded as keys (Section 8.3).

Spacing and delimiters:
- Every header line MUST end with a colon.
- When inline values follow a header on the same line (non-empty primitive arrays), there MUST be exactly one space after the colon before the first value.
- The active delimiter declared by the bracket segment applies to:
  - splitting inline primitive arrays on that header line,
  - splitting tabular field names in "{…}",
  - splitting all rows/items within the header’s scope,
  - unless a nested header changes it.
- The same delimiter symbol declared in the bracket MUST be used in the fields segment and in all row/value splits in that scope.

Normative header grammar (ABNF):
```
bracket-seg   = "[" [ "#" ] 1*DIGIT [ delimsym ] "]"
delimsym      = HTAB / "|"
fields-seg    = "{" fieldname *( delim fieldname ) "}"
delim         = delimsym / ","   ; actual active delimiter for the array

header        = [ key ] bracket-seg [ fields-seg ] ":"
key           = unquoted-key / quoted-key
unquoted-key  = ALPHA / "_" , *( ALPHA / DIGIT / "_" / "." )
quoted-key    = DQUOTE *(escaped-char / safe-char) DQUOTE
```

Decoding requirements:
- The bracket segment MUST parse as a non-negative integer length N.
- If a trailing tab or pipe appears inside the brackets, it selects the active delimiter; otherwise comma is active.
- If a fields segment occurs between the bracket and the colon, parse field names using the active delimiter; quoted names MUST be unescaped (Section 4).
- A colon MUST follow the bracket and optional fields; missing colon MUST error.

## 7. Strings and Keys

### 7.1 Escaping (Encoding and Decoding)

In quoted strings and keys, the following characters MUST be escaped:
- "\\" → "\\\\"
- "\"" → "\\\""
- U+000A newline → "\\n"
- U+000D carriage return → "\\r"
- U+0009 tab → "\\t"

Decoders MUST reject any other escape sequence and unterminated strings.

### 7.2 Quoting Rules for String Values (Encoding)

A string value MUST be quoted if any of the following is true:
- It is empty ("").
- It has leading or trailing whitespace.
- It equals true, false, or null (case-sensitive).
- It is numeric-like:
  - Matches /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i (e.g., "42", "-3.14", "1e-6").
  - Or matches /^0\d+$/ (leading-zero decimals such as "05").
- It contains a colon (:), double quote ("), or backslash (\).
- It contains brackets or braces ([, ], {, }).
- It contains control characters: newline, carriage return, or tab.
- It contains the active delimiter (comma, tab, or pipe).
- It equals "-" or starts with "- " (hyphen + space).

Otherwise, the string MAY be emitted without quotes. Unicode, emoji, and strings with internal (non-leading/trailing) spaces are safe unquoted provided they do not violate the conditions.

### 7.3 Key Encoding (Encoding)

Object keys and tabular field names:
- MAY be unquoted only if they match: ^[A-Za-z_][\w.]*$.
- Otherwise, they MUST be quoted and escaped per Section 7.1.

### 7.4 Decoding Rules for Strings and Keys (Decoding)

- Quoted strings and keys MUST be unescaped using only the five escapes in Section 7.1; any other escape MUST error. Quoted primitives remain strings.
- Unquoted values:
  - true/false/null → boolean/null
  - Numeric tokens → numbers (with the leading-zero rule in Section 4)
  - Otherwise → strings
- Keys (quoted or unquoted) MUST be followed by ":"; missing colon MUST error.

## 8. Objects

- Encoding:
  - Primitive fields: key: value (single space after colon).
  - Nested or empty objects: key: on its own line. If non-empty, nested fields appear at depth +1.
  - Key order: Implementations MUST preserve encounter order when emitting fields.
  - An empty object at the root yields an empty document (no lines).
- Decoding:
  - A line "key:" with nothing after the colon at depth d opens an object; subsequent lines at depth > d belong to that object until the depth decreases to ≤ d.
  - Lines "key: value" at the same depth are sibling fields.
  - Missing colon after a key MUST error.

## 9. Arrays

### 9.1 Primitive Arrays (Inline)

- Encoding:
  - Non-empty arrays: key[N<delim?>]: v1<delim>v2<delim>… where each vi is encoded as a primitive (Section 7) with delimiter-aware quoting.
  - Empty arrays: key[0<delim?>]: (no values following).
  - Root arrays: [N<delim?>]: v1<delim>…
- Decoding:
  - Split using the active delimiter declared by the header; non-active delimiters MUST NOT split values.
  - In strict mode, the number of decoded values MUST equal N; otherwise error.

### 9.2 Arrays of Arrays (Primitives Only) — Expanded List

- Encoding:
  - Parent header: key[N<delim?>]: on its own line.
  - Each inner primitive array is a list item:
    - - [M<delim?>]: v1<delim>v2<delim>…
    - Empty inner arrays: - [0<delim?>]:
- Decoding:
  - Items appear at depth +1, each starting with "- " and an inner array header "[M<delim?>]: …".
  - Inner arrays are split using their own active delimiter; in strict mode, counts MUST match M.
  - In strict mode, the number of list items MUST equal outer N.

### 9.3 Arrays of Objects — Tabular Form

Tabular detection (encoding; MUST hold for all elements):
- Every element is an object.
- All objects have the same set of keys (order per object MAY vary).
- All values across these keys are primitives (no nested arrays/objects).

When satisfied (encoding):
- Header: key[N<delim?>]{f1<delim>f2<delim>…}: where field order is the first object’s key encounter order.
- Field names encoded per Section 7.3.
- Rows: one line per object at depth +1 under the header; values are encoded primitives (Section 7) and joined by the active delimiter.
- Root tabular arrays omit the key: [N<delim?>]{…}: followed by rows.

Decoding:
- A tabular header declares the active delimiter and ordered field list.
- Rows appear at depth +1 as delimiter-separated value lines.
- Strict mode MUST enforce:
  - Each row’s value count equals the field count.
  - The number of rows equals N.
- Disambiguation at row depth:
  - If a same-depth line has no colon → row.
  - If a line has both the active delimiter and a colon, compare first occurrences:
    - Delimiter before colon → row.
    - Colon before delimiter → key-value line (end of rows).
  - If a line has a colon but no active delimiter → key-value line (end of rows).

### 9.4 Mixed / Non-Uniform Arrays — Expanded List

When tabular requirements are not met (encoding):
- Header: key[N<delim?>]:
- Each element is rendered as a list item at depth +1 under the header:
  - Primitive: - <primitive>
  - Primitive array: - [M<delim?>]: v1<delim>…
  - Object: formatted per Section 10 (objects as list items).
  - Complex arrays: - key'[M<delim?>]: followed by nested items as appropriate.

Decoding:
- Header declares list length N and the active delimiter for any nested inline arrays.
- Each list item starts with "- " at depth +1 and is parsed as:
  - Primitive (no colon and no array header),
  - Inline primitive array (- [M<delim?>]: …),
  - Object with first field on the hyphen line (- key: … or - key[N…]{…}: …),
  - Or nested arrays via nested headers.
- In strict mode, the number of list items MUST equal N.

## 10. Objects as List Items

For an object appearing as a list item:

- Empty object list item: a single "-" at the list-item indentation level.
- First field on the hyphen line:
  - Primitive: - key: value
  - Primitive array: - key[M<delim?>]: v1<delim>…
  - Tabular array: - key[N<delim?>]{fields}:
    - Followed by tabular rows at depth +1 (relative to the hyphen line).
  - Non-uniform array: - key[N<delim?>]:
    - Followed by list items at depth +1.
  - Object: - key:
    - Nested object fields appear at depth +2 (i.e., one deeper than subsequent sibling fields of the same list item).
- Remaining fields of the same object appear at depth +1 under the hyphen line in encounter order, using normal object field rules.

Decoding:
- The first field is parsed from the hyphen line. If it is a nested object (- key:), nested fields are at +2 relative to the hyphen line; subsequent fields of the same list item are at +1.
- If the first field is a tabular header on the hyphen line, its rows are at +1; subsequent sibling fields continue at +1 after the rows.

## 11. Delimiters

- Supported delimiters:
  - Comma (default): header omits the delimiter symbol.
  - Tab: header includes HTAB inside brackets and braces (e.g., [N<TAB>], {a<TAB>b}); rows/inline arrays use tabs.
  - Pipe: header includes "|" inside brackets and braces; rows/inline arrays use "|".
- Delimiter-aware quoting (encoding):
  - Strings containing the active delimiter MUST be quoted across object values, array values, and tabular rows.
  - Strings containing non-active delimiters do not require quoting unless another quoting condition applies.
- Delimiter-aware parsing (decoding):
  - Inline arrays and tabular rows MUST be split only on the active delimiter declared by the nearest array header.
  - Strings containing the active delimiter MUST be quoted to avoid splitting; non-active delimiters MUST NOT cause splits.
  - Nested headers may change the active delimiter; decoding MUST use the delimiter declared by the nearest header.
  - If the bracket declares tab or pipe, the same symbol MUST be used in the fields segment and for splitting all rows/values in that scope.

## 12. Indentation and Whitespace

- Encoding:
  - Encoders MUST use a consistent number of spaces per level (default 2; configurable).
  - Tabs MUST NOT be used for indentation.
  - Exactly one space after ": " in key: value lines.
  - Exactly one space after array headers when followed by inline values.
  - No trailing spaces at the end of any line.
  - No trailing newline at the end of the document.
- Decoding:
  - Strict mode:
    - The number of leading spaces on a line MUST be an exact multiple of indentSize; otherwise error.
    - Tabs used as indentation MUST error.
  - Non-strict mode:
    - Depth MAY be computed as floor(indentSpaces / indentSize).
    - Tabs in indentation are non-conforming and MAY be accepted or rejected.
  - Surrounding whitespace around tokens SHOULD be tolerated; internal semantics follow quoting rules.
  - Blank lines:
    - Outside arrays/tabular rows: MAY be ignored.
    - Inside arrays/tabular rows: in strict mode, MUST error; in non-strict mode, MAY be ignored and not counted as a row/item.
  - Trailing newline at end-of-file: decoders SHOULD accept; validators MAY warn.

## 13. Conformance and Options

Conformance classes:

- Encoder:
  - MUST produce output adhering to all normative rules in Sections 2–12 and 15.
  - MUST be deterministic regarding:
    - Object field order (encounter order).
    - Tabular detection (uniform vs non-uniform).
    - Quoting decisions given values and active delimiter.

- Decoder:
  - MUST implement tokenization, escaping, and type interpretation per Sections 4 and 7.4.
  - MUST parse array headers per Section 6 and apply the declared active delimiter to inline arrays and tabular rows.
  - MUST implement structure and depth rules per Sections 8–11, including objects-as-list-items placement.
  - MUST enforce strict-mode rules in Section 14 when strict = true.

- Validator:
  - SHOULD verify structural conformance (headers, indentation, list markers).
  - SHOULD verify whitespace invariants.
  - SHOULD verify delimiter consistency between headers and rows.
  - SHOULD verify length counts vs declared [N].

Options:
- Encoder options:
  - indent (default: 2 spaces)
  - delimiter (default: comma; alternatives: tab, pipe)
  - lengthMarker (default: disabled)
- Decoder options:
  - indent (default: 2 spaces)
  - strict (default: true)

## 14. Strict Mode Errors and Diagnostics (Authoritative Checklist)

When strict mode is enabled (default), decoders MUST error on:

- Array count mismatches:
  - Inline primitive arrays: decoded value count ≠ declared N.
  - List arrays: number of list items ≠ declared N.
  - Tabular arrays: number of rows ≠ declared N.
- Tabular row width mismatches:
  - Any row’s value count ≠ field count.
- Missing colon in key context.
- Invalid escape sequences or unterminated strings in quoted tokens.
- Indentation errors:
  - Leading spaces not a multiple of indentSize.
  - Any tab used in indentation.
- Delimiter mismatch (e.g., rows joined by a different delimiter than declared), detected via count checks and header scope.
- Blank lines inside arrays/tabular rows.
- Empty input (document with no non-empty lines).

Validators SHOULD additionally report:
- Trailing spaces, trailing newlines (encoding invariants).
- Headers missing delimiter marks when non-comma delimiter is in use.
- Values violating delimiter-aware quoting rules.

## 15. Security Considerations

- Injection and ambiguity are mitigated by quoting rules:
  - Strings with colon, the active delimiter, hyphen marker cases ("-" or "- "), control characters, or brackets/braces MUST be quoted.
- Strict-mode checks (Section 14) detect malformed strings, truncation, or injected rows/items via length and width mismatches.
- Encoders SHOULD avoid excessive memory on large inputs; implement streaming/tabular row emission where feasible.
- Unicode:
  - Encoders SHOULD avoid altering Unicode beyond required escaping; decoders SHOULD accept valid UTF-8 in quoted strings/keys (with only the five escapes).

## 16. Internationalization

- Full Unicode is supported in keys and values, subject to quoting and escaping rules.
- Encoders MUST NOT apply locale-dependent formatting for numbers or booleans (e.g., no thousands separators).
- ISO 8601 strings SHOULD be used for Date normalization.

## 17. Interoperability and Mappings (Informative)

- JSON:
  - TOON deterministically encodes JSON-compatible data (after normalization).
  - Arrays of uniform objects map to CSV-like rows; other structures map to YAML-like nested forms.
- CSV:
  - TOON tabular sections generalize CSV with explicit lengths, field lists, and flexible delimiter choice.
- YAML:
  - TOON borrows indentation and list-item patterns but uses fewer quotes and explicit array headers.

## 18. Media Type and File Extensions (Provisional)

- Suggested media type: text/toon
- Suggested file extension: .toon
- Encoding: UTF-8
- Line endings: LF (U+000A)

## 19. Examples (Informative)

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

## 20. Parsing Helpers (Informative)

These sketches illustrate structure and common decoding helpers. They are informative; normative behavior is defined in Sections 4–12 and 14.

### 20.1 Decoding Overview

- Split input into lines; compute depth from leading spaces and indent size (Section 12).
- Decide root form per Section 5.
- For objects at depth d: process lines at depth d; for arrays at depth d: read rows/list items at depth d+1.

### 20.2 Array Header Parsing

- Locate the first "[ … ]" segment on the line; parse:
  - Optional leading "#" marker (ignored semantically).
  - Length N as decimal integer.
  - Optional delimiter symbol at the end: HTAB or pipe (comma otherwise).
- If a "{ … }" fields segment occurs between the "]" and the ":", parse field names using the active delimiter; unescape quoted names.
- Require a colon ":" after the bracket/fields segment.
- Return the header (key?, length, delimiter, fields?, hasLengthMarker) and any inline values after the colon.

### 20.3 parseDelimitedValues

- Iterate characters left-to-right while maintaining a current token and an inQuotes flag.
- On a double quote, toggle inQuotes.
- While inQuotes, treat backslash + next char as a literal pair (string parser validates later).
- Only split on the active delimiter when not in quotes.
- Trim surrounding spaces around each token. Empty tokens decode to empty string.

### 20.4 Primitive Token Parsing

- If token starts with a quote, it MUST be a properly quoted string (no trailing characters after the closing quote). Unescape using only the five escapes; otherwise error.
- Else if token is true/false/null → boolean/null.
- Else if token is numeric without forbidden leading zeros and finite → number.
- Else → string.

### 20.5 Object and List Item Parsing

- Key-value line: parse a key up to the first colon; missing colon → error. The remainder of the line is the primitive value (if present).
- Nested object: "key:" with nothing after colon opens a nested object. If this is:
  - A field inside a regular object: nested fields are at depth +1 relative to that line.
  - The first field on a list-item hyphen line: nested fields at depth +2 relative to the hyphen line; subsequent fields at +1.
- List items:
  - Lines start with "- " at one deeper depth than the parent array header.
  - After "- ":
    - If "[ … ]:" appears → inline array item; decode with its own header and active delimiter.
    - Else if a colon appears → object with first field on hyphen line.
    - Else → primitive token.

## 21. Test Suite and Compliance (Informative)

Implementations are encouraged to validate against a comprehensive test suite covering:
- Primitive encoding/decoding, quoting, control-character escaping.
- Object key encoding/decoding and order preservation.
- Primitive arrays (inline), empty arrays.
- Arrays of arrays (expanded), mixed-length and empty inner arrays.
- Tabular detection and formatting, including delimiter variations.
- Mixed arrays and objects-as-list-items behavior, including nested arrays and objects.
- Whitespace invariants (no trailing spaces/newline).
- Normalization (BigInt, Date, undefined, NaN/Infinity, functions, symbols).
- Decoder strict-mode errors: count mismatches, invalid escapes, missing colon, delimiter mismatches, indentation errors, blank-line handling.

## 22. TOON Core Profile (Normative Subset)

This profile captures the most common, memory-friendly rules.

- Character set: UTF-8; LF line endings.
- Indentation: 2 spaces per level (configurable indentSize).
  - Strict mode: leading spaces MUST be a multiple of indentSize; tabs in indentation MUST error.
- Keys:
  - Unquoted if they match ^[A-Za-z_][\w.]*$; otherwise quoted.
  - A colon MUST follow a key.
- Strings:
  - Only these escapes allowed in quotes: \\, \", \n, \r, \t.
  - Quote if empty; leading/trailing whitespace; equals true/false/null; numeric-like; contains colon/backslash/quote/brackets/braces/control char; contains the active delimiter; equals "-" or starts with "- ".
- Numbers:
  - Encoder emits non-exponential decimal; -0 → 0.
  - Decoder accepts decimal and exponent forms; tokens with forbidden leading zeros decode as strings.
- Arrays and headers:
  - Header: [#?N[delim?]] where delim is absent (comma), HTAB (tab), or "|" (pipe).
  - Keyed header: key[#?N[delim?]]:. Optional fields: {f1<delim>f2}.
  - Primitive arrays inline: key[N]: v1<delim>v2. Empty arrays: key[0]: (no values).
  - Tabular arrays: key[N]{fields}: then N rows at depth +1.
  - Otherwise list form: key[N]: then N items, each starting with "- ".
- Delimiters:
  - Only split on the active delimiter from the nearest header. Non-active delimiters never split.
- Objects as list items:
  - "- value" (primitive), "- [M]: …" (inline array), or "- key: …" (object).
  - If first field is "- key:" with nested object: nested fields at +2; subsequent sibling fields at +1.
- Root form:
  - Root array if the first depth-0 line is a header.
  - Root primitive if exactly one non-empty line and it is not a header or key-value.
  - Otherwise object.
- Strict mode checks:
  - All count/width checks; missing colon; invalid escapes; indentation multiple-of-indentSize; delimiter mismatches via count checks; blank lines inside arrays/tabular rows; empty input.

## 23. Versioning and Extensibility

- Backward-compatible evolutions SHOULD preserve current headers, quoting rules, and indentation semantics.
- Reserved/structural characters (colon, brackets, braces, hyphen) MUST retain current meanings.
- Future work (non-normative): schemas, comments/annotations, additional delimiter profiles, optional \uXXXX escapes (if added, must be precisely defined).

## 24. Acknowledgments and License

- Credits: Author and contributors; ports in other languages (Elixir, PHP, Python, Ruby, Java, .NET, Swift, Go).
- License: MIT (see repository for details).

---

Appendix: Cross-check With Reference Behavior (Informative)

- The reference encoder/decoder test suites implement:
  - Safe-unquoted string rules and delimiter-aware quoting.
  - Header formation and delimiter-aware parsing with active delimiter scoping.
  - Length marker propagation (encoding) and acceptance (decoding).
  - Tabular detection requiring uniform keys and primitive-only values.
  - Objects-as-list-items parsing (+2 nested object rule; +1 siblings).
  - Whitespace invariants for encoding and strict-mode indentation enforcement for decoding.
  - Blank-line handling and trailing-newline acceptance.
