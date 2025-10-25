// #region JSON types

import type { Delimiter, DelimiterKey } from './constants'

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [Key in string]: JsonValue } & { [Key in string]?: JsonValue | undefined }
export type JsonArray = JsonValue[] | readonly JsonValue[]
export type JsonValue = JsonPrimitive | JsonObject | JsonArray

// #endregion

// #region Encoder options

export type { Delimiter, DelimiterKey }

export interface EncodeOptions {
  /**
   * Number of spaces per indentation level.
   * @default 2
   */
  indent?: number
  /**
   * Delimiter to use for tabular array rows and inline primitive arrays.
   * @default DELIMITERS.comma
   */
  delimiter?: Delimiter
  /**
   * Optional marker to prefix array lengths in headers.
   * When set to `#`, arrays render as [#N] instead of [N].
   * @default false
   */
  lengthMarker?: '#' | false
}

export type ResolvedEncodeOptions = Readonly<Required<EncodeOptions>>

// #endregion

export type Depth = number
