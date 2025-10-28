# TOON Specification (v1)

Status: Draft, normative where indicated. This version specifies encoding (producer behavior). A formal decoding spec is out of scope for v1.

- Normative statements use RFC 2119/8174 keywords: MUST, MUST NOT, SHOULD, SHOULD NOT, MAY.
- This spec targets implementers of encoders/validators, tool authors, and practitioners embedding TOON in LLM prompts.

Changelog:
- v1: Initial encoding + normalization + conformance rules based on reference encoder and test suite.

Scope:
- This document defines the data model, normalization (for the reference JavaScript/TypeScript encoder), concrete syntax, and conformance requirements for producing TOON. Decoding is informative only and not standardized in v1.

## 1. Terminology and Conventions

- TOON document: A sequence of UTF-8 text lines formatted according to this spec.
- Line: A sequence of non-newline characters terminated by LF (U+000A) in serialized form. TOON output MUST use LF line endings.
- Indentation level (depth): The number of indentation units (spaces) applied to a line. Depth 0 lines have no leading indentation.
- Indentation unit: A fixed number of spaces per level (default 2). Tabs MUST NOT be used for indentation.
- Header: The bracketed declaration for arrays, optionally followed by a field list, and terminating with a colon: e.g., key[3]: or items[2]{a,b}:.
- Field list: The brace-enclosed, delimiter-separated list of field names for tabular arrays: {f1<delim>f2}.
- List item: A line beginning with a hyphen and a space at a given depth (“- ”), representing an element in an expanded array form.
- Delimiter: The character used to separate array/tabular values: comma (default), tab, or pipe.
- Length marker: An optional “#” prefix for array lengths in headers, e.g., [#3].
- Primitive: string, number, boolean, or null.
- Object: Mapping from string keys to JsonValue.
- Array: Ordered sequence of JsonValue.
- JsonValue: Primitive | Object | Array.

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
- Numeric canonicalization:
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

## 4. Concrete Syntax Overview

TOON is a deterministic, line-oriented, indentation-based notation:

- Objects:
  - key: value for primitives.
  - key: alone for nested or empty objects, with nested fields indented one level.
- Arrays:
  - Primitive arrays are inline: key[N<delim?>]: v1<delim>v2.
  - Arrays of arrays (primitives): expanded list under a header: key[N<delim?>]: then “- [M<delim?>]: …” lines.
  - Arrays of objects:
    - Tabular form when uniform and primitive-only: key[N<delim?>]{f1<delim>f2}: then one row per line.
    - Otherwise expanded list: key[N<delim?>]: with “- …” items, following object-as-list-item rules.
- Whitespace invariants:
  - No trailing spaces at the end of any line.
  - No trailing newline at the end of the document.
  - One space after “: ” in key: value lines and after array headers when followed by inline values (non-empty primitive arrays).

## 5. Tokens and Lexical Elements

- Structural characters: colon (:), hyphen (-), brackets ([ ]), braces ({ }), double-quote ("), backslash (\).
- Delimiters:
  - Comma (,) is the default.
  - Tab (\t) and pipe (|) are supported alternatives.
  - The active delimiter MAY appear inside array headers (see Section 7).
- Indentation unit: default 2 spaces per level; configurable at encode-time.
- List item markers: “- ” (hyphen + single space) at the appropriate indentation level. An empty object as a list item is represented as a lone hyphen (“-”).
- Character set: UTF-8. Tabs MUST NOT appear as indentation but MAY appear as the chosen delimiter or inside quoted strings via escapes.

## 6. String and Key Encoding

6.1 Escaping

The following characters in quoted strings and keys MUST be escaped:
- Backslash: "\\" → "\\\\"
- Double quote: "\"" → "\\\""
- Newline: U+000A → "\\n"
- Carriage return: U+000D → "\\r"
- Tab: U+0009 → "\\t"

6.2 Quoting Rules for String Values

A string value MUST be quoted (with escaping as above) if any of the following is true:
- It is empty ("").
- It has leading or trailing whitespace.
- It equals true, false, or null (case-sensitive matches of these literals).
- It is numeric-like:
  - Matches /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i (e.g., "42", "-3.14", "1e-6").
  - Or matches /^0\d+$/ (leading-zero decimals such as "05").
- It contains a colon (:), double quote ("), or backslash (\).
- It contains brackets or braces ([, ], {, }).
- It contains control characters such as newline, carriage return, or tab.
- It contains the active delimiter (comma, tab, or pipe).
- It starts with a hyphen (-), to avoid ambiguity with list markers.

If none of the conditions above apply, the string MAY be emitted without quotes. Unicode, emoji, and strings with internal (non-leading/trailing) spaces are safe unquoted provided they do not violate the conditions.

6.3 Key Encoding

Object keys and tabular field names:
- MAY be unquoted only if they match the pattern: ^[A-Za-z_][\w.]*$.
- Otherwise, they MUST be quoted using the escaping rules above.

Note: Keys containing spaces, punctuation (e.g., colon, pipe, hyphen), or starting with a digit MUST be quoted.

## 7. Array Headers

General header syntax:

- Without key (root arrays): [<marker?>N<delim?>]:
- With key: key[<marker?>N<delim?>]:
- With tabular fields: key[<marker?>N<delim?>]{field1<delim>field2}:

Where:
- N is the array length (non-negative integer).
- <marker?> is optional “#” when the length marker option is enabled (Section 10).
- <delim?> is:
  - Absent when the delimiter is comma.
  - Present and equal to the active delimiter when the delimiter is tab or pipe.
- Field names within braces are separated by the active delimiter and encoded using key rules (Section 6.3).
- Every header line MUST end with a colon.

Spacing:
- When an inline list of values follows a header on the same line (non-empty primitive arrays), there MUST be exactly one space after the colon before the first value.
- Otherwise, no trailing space follows the colon on the header line.

## 8. Primitive Encoding

- null: literal null.
- boolean: true or false (lowercase).
- number:
  - Finite: base-10 non-exponential representation, preserving sign except -0 normalized to 0.
  - Non-finite (NaN, ±Infinity): treated as null via normalization (Section 3).
- string: encoded per Section 6 with delimiter-aware quoting.

## 9. Object Syntax

- Primitive fields: key: value (single space after colon).
- Nested or empty objects: key: on its own line; if non-empty, nested fields appear at one more indentation level.
- Key order: Implementations MUST preserve the encounter order when emitting fields.
- An empty object at the root results in an empty document (no lines).

## 10. Arrays

10.1 Primitive Arrays (Inline)

- Non-empty arrays: key[N<delim?>]: v1<delim>v2<delim>… where each vi is encoded as a primitive (Section 8) with delimiter-aware quoting (Section 6).
- Empty arrays: key[0<delim?>]: (no values following).
- Root arrays use the same rules without a key: [N<delim?>]: v1<delim>…

10.2 Arrays of Arrays (Primitives Only) — Expanded List

- Parent header: key[N<delim?>]: on its own line.
- Each inner primitive array is a list item:
  - - [M<delim?>]: v1<delim>v2<delim>…
  - Empty inner arrays: - [0<delim?>]:
- Root arrays of arrays use [N<delim?>]: as the parent header with the same rules.

10.3 Arrays of Objects — Tabular Form

Tabular detection (MUST hold for all rows):
- Every element is an object.
- All objects have the same set of keys (order per object MAY vary).
- All values across these keys are primitives (no nested arrays/objects).

When satisfied:
- Header: key[N<delim?>]{f1<delim>f2<delim>…}: where the field order is the encounter order of the first object’s keys.
- Field names encoded as keys (Section 6.3), delimiter-aware.
- Rows: one line per object at one indentation level under the header, values joined by the active delimiter. Each value encoded as a primitive (Section 8) with delimiter-aware quoting (Section 6).
- Root tabular arrays omit the key: [N<delim?>]{…}: then rows.

10.4 Mixed / Non-Uniform Arrays — Expanded List

When tabular requirements are not met:
- Header: key[N<delim?>]:
- Each element is rendered as a list item at one indentation level under the header:
  - Primitive: - <primitive>
  - Primitive array: - [M<delim?>]: v1<delim>…
  - Object: formatted using “objects as list items” (Section 11).
  - Complex arrays (e.g., arrays of arrays with mixed shapes): - key'[M<delim?>]: followed by nested items as appropriate.

## 11. Objects as List Items

For an object appearing as a list item:

- If the object is empty, render a single “-” at the list item indentation level.

- Otherwise, place the first field on the hyphen line using the following rules:
  - If the first field’s value is a primitive: - key: value
  - If the first field’s value is a primitive array: - key[M<delim?>]: v1<delim>…
  - If the first field’s value is an array of objects that qualifies for tabular form:
    - - key[N<delim?>]{fields}:
    - Followed by tabular rows at one more indentation level.
  - If the first field’s value is a non-uniform array of objects:
    - - key[N<delim?>]:
    - Followed by list items at one more indentation level (apply these same rules recursively).
  - If the first field’s value is a complex array (e.g., arrays of arrays, nested mixed arrays):
    - - key[N<delim?>]:
    - Followed by nested encodings (e.g., “- [M<delim?>]: …”) at one more indentation level.
  - If the first field’s value is an object:
    - - key:
    - Nested object fields appear at two more indentation levels (i.e., one deeper than subsequent sibling fields of the same list item).

- Remaining fields of the same object appear at one indentation level under the hyphen line, in encounter order, using normal object field rules.

## 12. Delimiters

- Supported delimiters:
  - Comma (default): header omits the delimiter symbol.
  - Tab: header includes the tab character inside brackets and braces (e.g., [N<TAB>], {a<TAB>b}); rows/inline arrays use tabs to separate values.
  - Pipe: header includes “|” inside brackets and braces; rows/inline arrays use “|”.
- Delimiter-aware quoting:
  - Strings containing the active delimiter MUST be quoted across object values, array values, and tabular rows.
  - Strings containing non-active delimiters (e.g., commas when using tab) do not require quoting unless another quoting condition applies.
- Changing the delimiter does not relax other quoting rules (colon, brackets/braces, leading hyphen, numeric-like, boolean/null-like).

## 13. Length Marker

- When enabled, the length marker “#” MUST appear immediately before the length in every array header, including nested arrays and tabular headers:
  - key[#N<delim?>]: …
  - key[#N<delim?>]{…}:
  - - [#M<delim?>]: …
- Semantics: purely informational to emphasize counts; no change to other parsing or formatting rules.

## 14. Indentation and Whitespace Invariants

- Indentation:
  - The encoder MUST use a consistent number of spaces per level (default 2; configurable).
  - Tabs MUST NOT be used for indentation.
- Spacing:
  - Exactly one space after “: ” in key: value lines.
  - Exactly one space after array headers when followed by inline values (non-empty primitive arrays).
- End-of-line:
  - No trailing spaces at the end of any line.
  - No trailing newline at the end of the document.

## 15. Conformance

Conformance classes:

- Encoder:
  - MUST produce output adhering to all normative rules in Sections 2–14.
  - MUST be deterministic with respect to:
    - Object field order (encounter order).
    - Tabular detection (either uniformly tabular or not, given the input).
    - Quoting decisions for given values and active delimiter.

- Validator:
  - SHOULD verify structural conformance (headers, indentation, list markers).
  - SHOULD verify whitespace invariants.
  - SHOULD verify delimiter consistency between headers and rows.

- Parser/Decoder:
  - Out of scope for v1; MAY be implemented. Implementers SHOULD follow the invariants in this spec for robust parsing (e.g., delimiter discovery from headers, length counts as consistency checks).

Options:
- indent (default: 2 spaces)
- delimiter (default: comma; alternatives: tab, pipe)
- lengthMarker (default: disabled)

## 16. Error Handling and Diagnostics

- Inputs that cannot be represented in the data model (Section 2) are normalized (Section 3) before encoding (e.g., NaN → null).
- Tabular fallback:
  - If any tabular condition fails (Section 10.3), encoders MUST use expanded list format (Section 10.4).
- Validators SHOULD report:
  - Trailing spaces, trailing newlines.
  - Headers missing delimiters when non-comma is active.
  - Mismatched row counts vs. declared [N].
  - Values violating delimiter-aware quoting rules.

## 17. Security Considerations

- Injection and ambiguity are mitigated by quoting rules:
  - Strings with colon, active delimiter, leading hyphen, control characters, brackets/braces MUST be quoted.
- Encoders SHOULD avoid excessive memory use on large inputs; implement streaming/tabular row emission where feasible.
- Unicode inputs:
  - Encoders SHOULD avoid altering Unicode content beyond required escaping; validators SHOULD accept all valid Unicode in quoted strings and keys (with escapes as required).

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

22.1 Tabular Detection

Given an array rows:
- If rows is empty → not tabular (fall back to expanded format).
- Let header = keys of the first row in encounter order; if header is empty → not tabular.
- For each row:
  - If row’s key count ≠ header length → not tabular.
  - For each key in header:
    - If key missing in row → not tabular.
    - If row[key] is not a primitive → not tabular.
- Otherwise tabular with header from the first row.

22.2 Safe-Unquoted String Decision

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

22.3 Header Formatting

- Start with optional key (encoded as per key rules).
- Append “[<marker?>N<delim?>]”, where:
  - <marker?> is “#” if enabled.
  - <delim?> is absent for comma, or is the delimiter symbol for tab/pipe.
- If tabular, append “{field1<delim>field2}” where field names are key-encoded and joined by the active delimiter.
- Append “:”.
- For non-empty primitive arrays on a single line, append a space and the joined values (each primitive-encoded with delimiter-aware quoting), joined by the active delimiter.

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
- Safe-unquoted-string constraints are defined in Section 6.2.
- Actual tokenization relies on the declared header delimiter and quoting rules.

## 24. Test Suite and Compliance (Informative)

- Implementations are encouraged to validate against a comprehensive test suite covering:
  - Primitive encoding, quoting, control-character escaping.
  - Object key encoding and order preservation.
  - Primitive arrays (inline), empty arrays.
  - Arrays of arrays (expanded), mixed-length and empty inner arrays.
  - Tabular detection and encoding, including delimiter variations.
  - Mixed arrays and objects-as-list-items behavior, including nested arrays and objects.
  - Whitespace invariants (no trailing spaces/newline).
  - Normalization (BigInt, Date, undefined, NaN/Infinity, functions, symbols).

The provided reference tests in the repository mirror these conditions and SHOULD be used to ensure conformance.

## 25. Rationale (Informative)

- Token efficiency: Removing repeated keys and braces for uniform arrays markedly reduces tokens vs. JSON.
- LLM-friendly guardrails: Declared lengths and field lists help models parse and validate structure.
- Determinism: Strict quoting/spacing/ordering yields outputs that are easy to compare, cache, and validate.
- Delimiters: Tab and pipe often reduce quoting needs (e.g., commas in natural language), and can tokenize more efficiently.

## 26. Versioning and Extensibility

- Backward-compatible evolutions SHOULD preserve current headers, quoting rules, and indentation semantics.
- Reserved/structural characters (colon, brackets, braces, hyphen) MUST retain current meanings.
- Future work (non-normative): decoding/parsing spec, schemas, comments/annotations, additional delimiter profiles.

## 27. Acknowledgments and License

- Credits: Author and contributors; ports in other languages (Elixir, PHP, Python, Ruby, Java, .NET, Swift).
- License: MIT (see repository for details).

---

Appendix: Cross-check With Reference Behavior (Informative)

- All normative behaviors specified herein are implemented and validated by the reference encoder and its test suite, including:
  - Safe-unquoted string rules and delimiter-aware quoting.
  - Object and tabular header formation using the active delimiter (comma implicit; tab/pipe explicit).
  - Length marker propagation to nested arrays.
  - Tabular detection requiring uniform keys and primitive-only values.
  - Objects-as-list-items formatting (first field on hyphen line, subsequent fields at +1 indent; nested object content at +2).
  - Whitespace invariants and no trailing newline.
