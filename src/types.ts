// #region JSON types

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [Key in string]: JsonValue } & { [Key in string]?: JsonValue | undefined }
export type JsonArray = JsonValue[] | readonly JsonValue[]
export type JsonValue = JsonPrimitive | JsonObject | JsonArray

// #endregion

// #region Encoder options

export interface EncodeOptions {
  indent?: number
  /**
   * Delimiter to use for tabular array rows and inline primitive arrays.
   * @default ','
   */
  delimiter?: ',' | '\t' | '|'
}

export type ResolvedEncodeOptions = Readonly<Required<EncodeOptions>>

// #endregion

export type Depth = number
