# TOON Specification v1.2

## Token-Oriented Object Notation

**Version:** 1.2
**Date:** 2025-10-31
**Status:** Working Draft
**Author:** Johann Schopplich ([@johannschopplich](https://github.com/johannschopplich))
**License:** MIT

---

## Abstract

Token-Oriented Object Notation (TOON) is a compact, human-readable serialization format optimized for reduced token usage in Large Language Model contexts. This specification defines the data model, encoding normalization, concrete syntax, decoding semantics, and conformance requirements for producing and consuming TOON. TOON achieves 30-60% token reduction compared to JSON for uniform tabular data while maintaining human readability and strict validation guarantees.

## Status of This Document

This document is a Working Draft v1.2 and may be updated, replaced, or obsoleted. Implementers should monitor the canonical repository at https://github.com/johannschopplich/toon for changes.

This specification is **stable for implementation** but not yet finalized. Breaking changes are unlikely but possible before v2.0.

**Transition criteria:**
- **Candidate Standard:** 3+ independent, interoperable implementations
- **Final Standard:** 12 months operational experience with no blocking issues

## Normative References

**[RFC2119]** Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997.
https://www.rfc-editor.org/rfc/rfc2119

**[RFC8174]** Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017.
https://www.rfc-editor.org/rfc/rfc8174

## Conventions and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they appear in all capitals, as shown here.

Audience: implementers of encoders/decoders/validators; tool authors; practitioners embedding TOON in LLM prompts.

## Table of Contents

1. [Terminology and Conventions](#1-terminology-and-conventions)
2. [Data Model](#2-data-model)
3. [Encoding Normalization (Reference Encoder)](#3-encoding-normalization-reference-encoder)
4. [Decoding Interpretation (Reference Decoder)](#4-decoding-interpretation-reference-decoder)
5. [Concrete Syntax and Root Form](#5-concrete-syntax-and-root-form)
6. [Header Syntax (Normative)](#6-header-syntax-normative)
7. [Strings and Keys](#7-strings-and-keys)
8. [Objects](#8-objects)
9. [Arrays](#9-arrays)
10. [Objects as List Items](#10-objects-as-list-items)
11. [Delimiters](#11-delimiters)
12. [Indentation and Whitespace](#12-indentation-and-whitespace)
13. [Conformance and Options](#13-conformance-and-options)
14. [Strict Mode Errors and Diagnostics (Authoritative Checklist)](#14-strict-mode-errors-and-diagnostics-authoritative-checklist)
15. [Security Considerations](#15-security-considerations)
16. [Internationalization](#16-internationalization)
17. [Interoperability and Mappings (Informative)](#17-interoperability-and-mappings-informative)
18. [Media Type and File Extensions (Provisional)](#18-media-type-and-file-extensions-provisional)
19. [TOON Core Profile (Normative Subset)](#19-toon-core-profile-normative-subset)
20. [Versioning and Extensibility](#20-versioning-and-extensibility)

**Appendices:**
- [Appendix A: Examples (Informative)](#appendix-a-examples-informative)
- [Appendix B: Parsing Helpers (Informative)](#appendix-b-parsing-helpers-informative)
- [Appendix C: Test Suite and Compliance (Informative)](#appendix-c-test-suite-and-compliance-informative)
- [Appendix D: Document Changelog (Informative)](#appendix-d-document-changelog-informative)
- [Appendix E: Acknowledgments and License](#appendix-e-acknowledgments-and-license)
- [Appendix F: Cross-check With Reference Behavior (Informative)](#appendix-f-cross-check-with-reference-behavior-informative)

## Scope

Defines the data model, encoding normalization (reference JS/TS), concrete syntax, decoding semantics, and conformance requirements for producing and consuming TOON.

## 1. Terminology and Conventions

- TOON document: A sequence of UTF-8 text lines formatted according to this spec.
- Line: A sequence of non-newline characters terminated by LF (U+000A) in serialized form. Encoders MUST use LF.
- Indentation level (depth): Leading indentation measured in fixed-size space units (indentSize). Depth 0 has no indentation.
- Indentation unit (indentSize): A fixed number of spaces per level (default 2). Tabs MUST NOT be used for indentation.
- Header: The bracketed declaration for arrays, optionally followed by a field list, and terminating with a colon; e.g., key[3]: or items[2]{a,b}:.
- Field list: Brace-enclosed, delimiter-separated list of field names for tabular arrays: {f1<delim>f2}.
- List item: A line beginning with "- " at a given depth representing an element in an expanded array.
- Delimiter: The character used to separate array/tabular values: comma (default), tab (HTAB, U+0009), or pipe ("|").
- Document delimiter: The encoder-selected delimiter used for quoting decisions outside any array scope (default comma).
- Active delimiter: The delimiter declared by the closest array header in scope, used to split inline primitive arrays and tabular rows under that header; it also governs quoting decisions for values within that array’s scope.
- Length marker: Optional "#" prefix for array lengths in headers, e.g., [#3]. Decoders MUST accept and ignore it semantically.
- Primitive: string, number, boolean, or null.
- Object: Mapping from string keys to JsonValue.
- Array: Ordered sequence of JsonValue.
- JsonValue: Primitive | Object | Array.
- Strict mode: Decoder mode that enforces counts, indentation, and delimiter consistency; also rejects invalid escapes and missing colons (default: true).

Notation:
- Regular expressions appear in slash-delimited form.
- ABNF snippets follow RFC 5234; HTAB means the U+0009 character.
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
  - Implementations MUST ensure decimal rendering does not use exponent notation.
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
  - MUST be unescaped per Section 7.1 (only \\, \", \n, \r, \t are valid). Any other escape or an unterminated string MUST error.
  - Quoted primitives remain strings even if they look like numbers/booleans/null.
- Unquoted value tokens:
  - true, false, null → booleans/null.
  - Numeric parsing:
    - MUST accept standard decimal and exponent forms (e.g., 42, -3.14, 1e-6, -1E+9).
    - MUST treat tokens with forbidden leading zeros (e.g., "05", "0001") as strings (not numbers).
    - Only finite numbers are expected from conforming encoders.
  - Otherwise → string.
- Keys:
  - Decoded as strings (quoted keys MUST be unescaped per Section 7.1).
  - A colon MUST follow a key; missing colon MUST error.

## 5. Concrete Syntax and Root Form

TOON is a deterministic, line-oriented, indentation-based notation.

- Objects:
  - key: value for primitives.
  - key: alone for nested or empty objects; nested fields appear at depth +1.
- Arrays:
  - Primitive arrays are inline: key[N<delim?>]: v1<delim>v2….
  - Arrays of arrays (primitives): expanded list items under a header: key[N<delim?>]: then "- [M<delim?>]: …".
  - Arrays of objects:
    - Tabular form when uniform and primitive-only: key[N<delim?>]{f1<delim>f2}: then one row per line.
    - Otherwise: expanded list items: key[N<delim?>]: with "- …" items (see Sections 9.4 and 10).
- Root form discovery:
  - If the first non-empty depth-0 line is a valid root array header per Section 6 (must include a colon), decode a root array.
  - Else if the document has exactly one non-empty line and it is neither a valid array header nor a key-value line (quoted or unquoted key), decode a single primitive.
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
  - absent for comma (","),
  - HTAB (U+0009) for tab,
  - "|" for pipe.
- Field names in braces are separated by the same active delimiter and encoded as keys (Section 7.3).

Spacing and delimiters:
- Every header line MUST end with a colon.
- When inline values follow a header on the same line (non-empty primitive arrays), there MUST be exactly one space after the colon before the first value.
- The active delimiter declared by the bracket segment applies to:
  - splitting inline primitive arrays on that header line,
  - splitting tabular field names in "{…}",
  - splitting all rows/items within the header’s scope,
  - unless a nested header changes it.
- The same delimiter symbol declared in the bracket MUST be used in the fields segment and in all row/value splits in that scope.
- Absence of a delimiter symbol in a bracket segment ALWAYS means comma, regardless of any parent header.

Normative header grammar (ABNF):
```
bracket-seg   = "[" [ "#" ] 1*DIGIT [ delimsym ] "]"
delimsym      = HTAB / "|"
; Field names are keys (quoted/unquoted) separated by the active delimiter
fields-seg    = "{" fieldname *( delim fieldname ) "}"
delim         = delimsym / ","
fieldname     = key

header        = [ key ] bracket-seg [ fields-seg ] ":"
key           = unquoted-key / quoted-key

; Unquoted keys must match identifier pattern
unquoted-key  = ( ALPHA / "_" ) *( ALPHA / DIGIT / "_" / "." )

; Quoted keys use only escapes from Section 7.1
; (Exact escaped-char repertoire is defined in Section 7.1)
; quoted-key   = DQUOTE *(escaped-char / safe-char) DQUOTE
```

Decoding requirements:
- The bracket segment MUST parse as a non-negative integer length N.
- If a trailing tab or pipe appears inside the brackets, it selects the active delimiter; otherwise comma is active.
- If a fields segment occurs between the bracket and the colon, parse field names using the active delimiter; quoted names MUST be unescaped per Section 7.1.
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

Tabs are allowed inside quoted strings and as a declared delimiter; they MUST NOT be used for indentation (Section 12).

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
- It contains the relevant delimiter:
  - Inside array scope: the active delimiter (Section 1).
  - Outside array scope: the document delimiter (Section 1).
- It equals "-" or starts with "-" (any hyphen at position 0).

Otherwise, the string MAY be emitted without quotes. Unicode, emoji, and strings with internal (non-leading/trailing) spaces are safe unquoted provided they do not violate the conditions.

### 7.3 Key Encoding (Encoding)

Object keys and tabular field names:
- MAY be unquoted only if they match: ^[A-Za-z_][\w.]*$.
- Otherwise, they MUST be quoted and escaped per Section 7.1.

### 7.4 Decoding Rules for Strings and Keys (Decoding)

- Quoted strings and keys MUST be unescaped per Section 7.1; any other escape MUST error. Quoted primitives remain strings.
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
  - In strict mode, the number of decoded values MUST equal N; otherwise MUST error.

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
- Disambiguation at row depth (unquoted tokens):
  - Compute the first unquoted occurrence of the active delimiter and the first unquoted colon.
  - If a same-depth line has no unquoted colon → row.
  - If both appear, compare first-unquoted positions:
    - Delimiter before colon → row.
    - Colon before delimiter → key-value line (end of rows).
  - If a line has an unquoted colon but no unquoted active delimiter → key-value line (end of rows).

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
- Document vs Active delimiter:
  - Encoders select a document delimiter (option) that influences quoting in contexts not governed by an array header (e.g., object values).
  - Inside an array header’s scope, the active delimiter governs splitting and quoting of inline arrays and tabular rows for that array.
  - Absence of a delimiter symbol in a header ALWAYS means comma for that array’s scope; it does not inherit from any parent.
- Delimiter-aware quoting (encoding):
  - Within an array’s scope, strings containing the active delimiter MUST be quoted to avoid splitting.
  - Outside any array scope, encoders SHOULD use the document delimiter to decide delimiter-aware quoting for values.
  - Strings containing non-active delimiters do not require quoting unless another quoting condition applies (Section 7.2).
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
    - The number of leading spaces on a line MUST be an exact multiple of indentSize; otherwise MUST error.
    - Tabs used as indentation MUST error. Tabs are allowed in quoted strings and as the HTAB delimiter.
  - Non-strict mode:
    - Depth MAY be computed as floor(indentSpaces / indentSize).
    - Tabs in indentation are non-conforming and MAY be accepted or rejected.
  - Surrounding whitespace around tokens SHOULD be tolerated; internal semantics follow quoting rules.
  - Blank lines:
    - Outside arrays/tabular rows: decoders SHOULD ignore completely blank lines (do not create/close structures).
    - Inside arrays/tabular rows: in strict mode, MUST error; in non-strict mode, MAY be ignored and not counted as a row/item.
  - Trailing newline at end-of-file: decoders SHOULD accept; validators MAY warn.

Recommended blank-line handling (normative where stated):
- Before decoding, or during scanning:
  - Track blank lines with depth.
  - For strict mode: if a blank line occurs between the first and last row/item line in an array/tabular block, this MUST error.
  - Otherwise (outside arrays/tabular rows), blank lines SHOULD be skipped and not contribute to root-form detection.
- Empty input means: after ignoring trailing newlines and ignorable blank lines outside arrays/tabular rows, there are no non-empty lines.

## 13. Conformance and Options

Conformance classes:

- Encoder:
  - MUST produce output adhering to all normative rules in Sections 2–12 and 15.
  - MUST be deterministic regarding:
    - Object field order (encounter order).
    - Tabular detection (uniform vs non-uniform).
    - Quoting decisions given values and delimiter context (document delimiter or active delimiter in array scope).

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
  - delimiter (document delimiter; default: comma; alternatives: tab, pipe)
  - lengthMarker (default: disabled)
- Decoder options:
  - indent (default: 2 spaces)
  - strict (default: true)

Note: Section 14 is authoritative for strict-mode errors; validators MAY add informative diagnostics for style and encoding invariants.

### 13.1 Encoder Conformance Checklist

Conforming encoders MUST:
- [ ] Produce UTF-8 output with LF (U+000A) line endings (§5)
- [ ] Use consistent indentation (default 2 spaces, no tabs) (§12)
- [ ] Escape \\, ", \n, \r, \t in quoted strings; reject other escapes (§7.1)
- [ ] Quote strings containing active delimiter, colon, or structural characters (§7.2)
- [ ] Emit array lengths [N] matching actual item count (§6, §9)
- [ ] Preserve object key order as encountered (§2)
- [ ] Normalize numbers to non-exponential decimal form (§2)
- [ ] Convert -0 to 0 (§2)
- [ ] Convert NaN/±Infinity to null (§3)
- [ ] Emit no trailing spaces or trailing newline (§12)

### 13.2 Decoder Conformance Checklist

Conforming decoders MUST:
- [ ] Parse array headers per §6 (length, delimiter, optional fields)
- [ ] Split inline arrays and tabular rows using active delimiter only (§11)
- [ ] Unescape quoted strings with only valid escapes (§7.1)
- [ ] Type unquoted primitives: true/false/null → booleans/null, numeric → number, else → string (§4)
- [ ] Enforce strict-mode rules when strict=true (§14)
- [ ] Accept and ignore optional # length marker (§6)
- [ ] Preserve array order and object key order (§2)

### 13.3 Validator Conformance Checklist

Validators SHOULD verify:
- [ ] Structural conformance (headers, indentation, list markers)
- [ ] Whitespace invariants (no trailing spaces/newlines)
- [ ] Delimiter consistency between headers and rows
- [ ] Array length counts match declared [N]
- [ ] All strict-mode requirements (§14)

## 14. Strict Mode Errors and Diagnostics (Authoritative Checklist)

When strict mode is enabled (default), decoders MUST error on the following conditions.

### 14.1 Array Count and Width Mismatches

- Inline primitive arrays: decoded value count ≠ declared N.
- List arrays: number of list items ≠ declared N.
- Tabular arrays: number of rows ≠ declared N.
- Tabular row width mismatches: any row's value count ≠ field count.

### 14.2 Syntax Errors

- Missing colon in key context.
- Invalid escape sequences or unterminated strings in quoted tokens.
- Delimiter mismatch (detected via width/count checks and header scope).

### 14.3 Indentation Errors

- Leading spaces not a multiple of indentSize.
- Any tab used in indentation (tabs allowed in quoted strings and as HTAB delimiter).

### 14.4 Structural Errors

- Blank lines inside arrays/tabular rows.
- Empty input (document with no non-empty lines after ignoring trailing newline(s) and ignorable blank lines outside arrays/tabular rows).

### 14.5 Recommended Error Messages and Validator Diagnostics (Informative)

Validators SHOULD additionally report:
- Trailing spaces, trailing newlines (encoding invariants).
- Headers missing delimiter marks when non-comma delimiter is in use.
- Values violating delimiter-aware quoting rules.

Recommended error messages:
- "Missing colon after key"
- "Unterminated string: missing closing quote"
- "Invalid escape sequence: \x"
- "Indentation must be an exact multiple of N spaces"
- "Tabs are not allowed in indentation"
- "Expected N tabular rows, but got M"
- "Expected N list array items, but got M"
- "Expected K values in row, but got L"

## 15. Security Considerations

- Injection and ambiguity are mitigated by quoting rules:
  - Strings with colon, the relevant delimiter (document or active), hyphen marker cases ("-" or strings starting with "-"), control characters, or brackets/braces MUST be quoted.
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

## Appendix A: Examples (Informative)

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

Quoted colons and disambiguation (rows continue; colon is inside quotes):
```
links[2]{id,url}:
  1,"http://a:b"
  2,"https://example.com?q=a:b"
```

## Appendix B: Parsing Helpers (Informative)

These sketches illustrate structure and common decoding helpers. They are informative; normative behavior is defined in Sections 4–12 and 14.

### B.1 Decoding Overview

- Split input into lines; compute depth from leading spaces and indent size (Section 12).
- Skip ignorable blank lines outside arrays/tabular rows (Section 12).
- Decide root form per Section 5.
- For objects at depth d: process lines at depth d; for arrays at depth d: read rows/list items at depth d+1.

### B.2 Array Header Parsing

- Locate the first "[ … ]" segment on the line; parse:
  - Optional leading "#" marker (ignored semantically).
  - Length N as decimal integer.
  - Optional delimiter symbol at the end: HTAB or pipe (comma otherwise).
- If a "{ … }" fields segment occurs between the "]" and the ":", parse field names using the active delimiter; unescape quoted names.
- Require a colon ":" after the bracket/fields segment.
- Return the header (key?, length, delimiter, fields?, hasLengthMarker) and any inline values after the colon.
- Absence of a delimiter symbol in the bracket segment ALWAYS means comma for that header (no inheritance).

### B.3 parseDelimitedValues

- Iterate characters left-to-right while maintaining a current token and an inQuotes flag.
- On a double quote, toggle inQuotes.
- While inQuotes, treat backslash + next char as a literal pair (string parser validates later).
- Only split on the active delimiter when not in quotes (unquoted occurrences).
- Trim surrounding spaces around each token. Empty tokens decode to empty string.

### B.4 Primitive Token Parsing

- If token starts with a quote, it MUST be a properly quoted string (no trailing characters after the closing quote). Unescape using only the five escapes; otherwise MUST error.
- Else if token is true/false/null → boolean/null.
- Else if token is numeric without forbidden leading zeros and finite → number.
- Else → string.

### B.5 Object and List Item Parsing

- Key-value line: parse a key up to the first colon; missing colon → MUST error. The remainder of the line is the primitive value (if present).
- Nested object: "key:" with nothing after colon opens a nested object. If this is:
  - A field inside a regular object: nested fields are at depth +1 relative to that line.
  - The first field on a list-item hyphen line: nested fields at depth +2 relative to the hyphen line; subsequent fields at +1.
- List items:
  - Lines start with "- " at one deeper depth than the parent array header.
  - After "- ":
    - If "[ … ]:" appears → inline array item; decode with its own header and active delimiter.
    - Else if a colon appears → object with first field on hyphen line.
    - Else → primitive token.

### B.6 Blank-Line Handling

- Track blank lines during scanning with line numbers and depth.
- For arrays/tabular rows:
  - In strict mode, any blank line between the first and last item/row line MUST error.
  - In non-strict mode, blank lines MAY be ignored and not counted as items/rows.
- Outside arrays/tabular rows:
  - Blank lines SHOULD be ignored (do not affect root-form detection or object boundaries).

## Appendix C: Test Suite and Compliance (Informative)

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

## Appendix D: Document Changelog (Informative)

### v1.2 (2025-10-31)

- Centralized decoding rules (primitives, keys) and strict-mode checklist.
- Made header grammar normative and clarified delimiter scoping.
- Tightened strict-mode indentation (exact multiples; tabs error).
- Defined blank-line and trailing-newline decoding behavior with explicit skipping rules outside arrays.
- Clarified hyphen-based quoting: "-" or any string starting with "-" MUST be quoted.
- Clarified BigInt normalization (quoted string when out of safe range).
- Unified root-form detection and row/key disambiguation language; disambiguation uses first unquoted delimiter vs colon.
- Introduced "document delimiter" vs "active delimiter" terminology.

### v1.1

Made decoding behavior normative; added strict-mode rules, delimiter-aware parsing, and reference algorithms; decoder options (indent, strict).

### v1.0

Initial encoding, normalization, and conformance rules.

## 19. TOON Core Profile (Normative Subset)

This profile captures the most common, memory-friendly rules.

- Character set: UTF-8; LF line endings.
- Indentation: 2 spaces per level (configurable indentSize).
  - Strict mode: leading spaces MUST be a multiple of indentSize; tabs in indentation MUST error.
- Keys:
  - Unquoted if they match ^[A-Za-z_][\w.]*$; otherwise quoted.
  - A colon MUST follow a key.
- Strings:
  - Only these escapes allowed in quotes: \\, \", \n, \r, \t.
  - Quote if empty; leading/trailing whitespace; equals true/false/null; numeric-like; contains colon/backslash/quote/brackets/braces/control char; contains the relevant delimiter (active inside arrays, document otherwise); equals "-" or starts with "-".
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
  - Root array if the first depth-0 line is a header (per Section 6).
  - Root primitive if exactly one non-empty line and it is not a header or key-value.
  - Otherwise object.
- Strict mode checks:
  - All count/width checks; missing colon; invalid escapes; indentation multiple-of-indentSize; delimiter mismatches via count checks; blank lines inside arrays/tabular rows; empty input.

## 20. Versioning and Extensibility

- Backward-compatible evolutions SHOULD preserve current headers, quoting rules, and indentation semantics.
- Reserved/structural characters (colon, brackets, braces, hyphen) MUST retain current meanings.
- Future work (non-normative): schemas, comments/annotations, additional delimiter profiles, optional \uXXXX escapes (if added, must be precisely defined).

## Appendix E: Acknowledgments and License

### Author

This specification was created and is maintained by Johann Schopplich, who also maintains the reference TypeScript/JavaScript implementation.

### Community Implementations

Implementations of TOON in other languages have been created by community members. For a complete list with repository links and maintainer information, see the [Other Implementations](https://github.com/johannschopplich/toon#other-implementations) section of the README.

### License

This specification and reference implementation are released under the MIT License (see repository for details).

---

## Appendix F: Cross-check With Reference Behavior (Informative)

- The reference encoder/decoder test suites implement:
  - Safe-unquoted string rules and delimiter-aware quoting (document vs active delimiter).
  - Header formation and delimiter-aware parsing with active delimiter scoping.
  - Length marker propagation (encoding) and acceptance (decoding).
  - Tabular detection requiring uniform keys and primitive-only values.
  - Objects-as-list-items parsing (+2 nested object rule; +1 siblings).
  - Whitespace invariants for encoding and strict-mode indentation enforcement for decoding.
  - Blank-line handling and trailing-newline acceptance.
