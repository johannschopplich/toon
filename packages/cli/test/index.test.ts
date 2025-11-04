import process from 'node:process'
import { consola } from 'consola'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { version } from '../../toon/package.json' with { type: 'json' }
import { DEFAULT_DELIMITER, encode } from '../../toon/src'
import { createCliTestContext, runCli } from './utils'

describe('toon CLI', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => 0 as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints the version when using --version', async () => {
    const consolaLog = vi.spyOn(consola, 'log').mockImplementation(() => undefined)
    const consolaError = vi.spyOn(consola, 'error').mockImplementation(() => undefined)

    await runCli({ rawArgs: ['--version'] })

    expect(consolaLog).toHaveBeenCalledWith(version)
    expect(consolaError).not.toHaveBeenCalled()
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
        lengthMarker: false,
      })

      expect(output).toBe(expected)
      expect(consolaSuccess).toHaveBeenCalledWith('Encoded `input.json` → `output.toon`')
    }
    finally {
      await context.cleanup()
    }
  })

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
      expect(consolaSuccess).toHaveBeenCalledWith('Decoded `input.toon` → `output.json`')
    }
    finally {
      await context.cleanup()
    }
  })

  it('writes encoded TOON to stdout when no output file is provided', async () => {
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

  it('throws on an invalid delimiter argument', async () => {
    const context = await createCliTestContext({
      'input.json': JSON.stringify({ value: 1 }),
    })

    const consolaError = vi.spyOn(consola, 'error').mockImplementation(() => undefined)

    try {
      await expect(context.run(['input.json', '--delimiter', ';'])).resolves.toBeUndefined()

      const exitMock = vi.mocked(process.exit)
      expect(exitMock).toHaveBeenCalledWith(1)

      const errorCall = consolaError.mock.calls.at(0)
      expect(errorCall).toBeDefined()
      const [error] = errorCall!
      expect(error.message).toContain('Invalid delimiter')
    }
    finally {
      await context.cleanup()
    }
  })
})
