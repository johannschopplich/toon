import type {
  EncodeOptions,
  ResolvedEncodeOptions,
} from './types'
import { encodeValue } from './encoders'
import { normalizeValue } from './normalize'

export type {
  EncodeOptions,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ResolvedEncodeOptions,
} from './types'

export function encode(input: unknown, options?: EncodeOptions): string {
  const normalizedValue = normalizeValue(input)
  const resolvedOptions = resolveOptions(options)
  return encodeValue(normalizedValue, resolvedOptions)
}

function resolveOptions(options?: EncodeOptions): ResolvedEncodeOptions {
  return {
    indent: options?.indent ?? 2,
    delimiter: options?.delimiter ?? ',',
  }
}
