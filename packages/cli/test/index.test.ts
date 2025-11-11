import process from 'node:process'
import { consola } from 'consola'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_DELIMITER, encode } from '../../toon/src'
import { version } from '../package.json' with { type: 'json' }
import { createCliTestContext, runCli } from './utils'
import { Readable } from 'node:stream'

export function mockStdin(input: string): () => void {
  const mockStream = new Readable()
  mockStream.push(input)
  mockStream.push(null)
  
  const originalStdin = process.stdin
  Object.defineProperty(process, 'stdin', {
    value: mockStream,
    writable: true,
  })
  
  // Return cleanup function
  return () => {
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
    })
  }
}
describe('toon CLI', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => 0 as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('version', () => {
    it('prints the version when using --version', async () => {
      const consolaLog = vi.spyOn(consola, 'log').mockImplementation(() => undefined)

      await runCli({ rawArgs: ['--version'] })

      expect(consolaLog).toHaveBeenCalledWith(version)
    })
  })

  describe('encode (JSON → TOON)', () => {
    it('encodes JSON from stdin', async () => {
      const data = {
        title: 'TOON test',
        count: 3,
        nested: { ok: true },
      }
      const cleanup = mockStdin(JSON.stringify(data))

      const stdout: string[] = []
      const logSpy = vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
        stdout.push(String(message ?? ''))
      })

      try {
        await runCli()
        expect(stdout).toHaveLength(1)
        expect(stdout[0]).toBe(encode(data))
      }
      finally {
        logSpy.mockRestore()
        cleanup()
      }
    })

    it('encodes a JSON file into a TOON file', async () => {
      const data = {
        title: 'TOON test',
        count: 3,
        nested: { ok: true },
      }
      const context = await createCliTestContext({
        'input.json': JSON.stringify(data, undefined, 2),
      })

      const consolaSuccess = vi.spyOn(consola, 'success').mockImplementation(() => undefined)

      try {
        await context.run(['input.json', '--output', 'output.toon'])

        const output = await context.read('output.toon')
        const expected = encode(data, {
          delimiter: DEFAULT_DELIMITER,
          indent: 2,
        })

        expect(output).toBe(expected)
        expect(consolaSuccess).toHaveBeenCalledWith(expect.stringMatching(/Encoded .* → .*/))
      }
      finally {
        await context.cleanup()
      }
    })

    it('writes to stdout when output not specified', async () => {
      const data = { ok: true }
      const context = await createCliTestContext({
        'input.json': JSON.stringify(data),
      })

      const stdout: string[] = []
      const logSpy = vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
        stdout.push(String(message ?? ''))
      })

      try {
        await context.run(['input.json'])

        expect(stdout).toHaveLength(1)
        expect(stdout[0]).toBe(encode(data))
      }
      finally {
        logSpy.mockRestore()
        await context.cleanup()
      }
    })
  })

  describe('decode (TOON → JSON)', () => {
    it('decodes a TOON file into a JSON file', async () => {
      const data = {
        items: ['alpha', 'beta'],
        meta: { done: false },
      }
      const toonInput = encode(data)
      const context = await createCliTestContext({
        'input.toon': toonInput,
      })

      const consolaSuccess = vi.spyOn(consola, 'success').mockImplementation(() => undefined)

      try {
        await context.run(['input.toon', '--output', 'output.json'])

        const output = await context.read('output.json')
        expect(JSON.parse(output)).toEqual(data)
        expect(consolaSuccess).toHaveBeenCalledWith(expect.stringMatching(/Decoded .* → .*/))
      }
      finally {
        await context.cleanup()
      }
    })
    it('decodes TOON from stdin', async () => {
      const data = { items: ['a', 'b'], count: 2 }
      const toonInput = encode(data)
      
      const cleanup = mockStdin(toonInput)
      
      const stdout: string[] = []
      const logSpy = vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
        stdout.push(String(message ?? ''))
      })
      
      try {
        await runCli({ rawArgs: ['--decode'] })
        expect(stdout).toHaveLength(1)
        const result = JSON.parse(stdout?.at(0) ?? '')
        expect(result).toEqual(data)
      }
      finally {
        logSpy.mockRestore()
        cleanup()
      }
      
    })
  })

  describe('error handling', () => {
    it('rejects invalid delimiter', async () => {
      const context = await createCliTestContext({
        'input.json': JSON.stringify({ value: 1 }),
      })

      const consolaError = vi.spyOn(consola, 'error').mockImplementation(() => undefined)
      const exitSpy = vi.mocked(process.exit)

      try {
        await context.run(['input.json', '--delimiter', ';'])

        expect(exitSpy).toHaveBeenCalledWith(1)

        const errorCall = consolaError.mock.calls.at(0)
        expect(errorCall).toBeDefined()
        const [error] = errorCall!
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('Invalid delimiter')
      }
      finally {
        await context.cleanup()
      }
    })

    it('rejects invalid indent value', async () => {
      const context = await createCliTestContext({
        'input.json': JSON.stringify({ value: 1 }),
      })

      const consolaError = vi.spyOn(consola, 'error').mockImplementation(() => undefined)
      const exitSpy = vi.mocked(process.exit)

      try {
        await context.run(['input.json', '--indent', 'abc'])

        expect(exitSpy).toHaveBeenCalledWith(1)

        const errorCall = consolaError.mock.calls.at(0)
        expect(errorCall).toBeDefined()
        const [error] = errorCall!
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('Invalid indent value')
      }
      finally {
        await context.cleanup()
      }
    })

    it('handles missing input file', async () => {
      const context = await createCliTestContext({})

      const consolaError = vi.spyOn(consola, 'error').mockImplementation(() => undefined)
      const exitSpy = vi.mocked(process.exit)

      try {
        await context.run(['nonexistent.json'])

        expect(exitSpy).toHaveBeenCalledWith(1)
        expect(consolaError).toHaveBeenCalled()
      }
      finally {
        await context.cleanup()
      }
    })
  })
})
