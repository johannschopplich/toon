import { execSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const CLI_PATH = join(__dirname, '../dist/cli.js')

describe('tOON CLI', () => {
  let tempFiles: string[] = []

  beforeEach(() => {
    tempFiles = []
  })

  afterEach(() => {
    // Clean up temp files
    tempFiles.forEach((file) => {
      if (existsSync(file)) {
        unlinkSync(file)
      }
    })
  })

  function createTempFile(content: string, extension = '.json'): string {
    const tempFile = join(tmpdir(), `toon-test-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`)
    writeFileSync(tempFile, content)
    tempFiles.push(tempFile)
    return tempFile
  }

  function runCli(args: string): { stdout: string, stderr: string, exitCode: number } {
    try {
      const stdout = execSync(`node ${CLI_PATH} ${args}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      return { stdout, stderr: '', exitCode: 0 }
    }
    catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.status || 1,
      }
    }
  }

  describe('basic encoding', () => {
    it('should encode simple JSON from file', () => {
      const jsonContent = JSON.stringify({ name: 'test', value: 42 })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(inputFile)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('name: test')
      expect(result.stdout).toContain('value: 42')
    })

    it('should encode JSON with output file', () => {
      const jsonContent = JSON.stringify({ items: [{ id: 1, name: 'test' }] })
      const inputFile = createTempFile(jsonContent)
      const outputFile = createTempFile('', '.toon')

      const result = runCli(`${inputFile} -o ${outputFile}`)

      expect(result.exitCode).toBe(0)
      const output = readFileSync(outputFile, 'utf8')
      expect(output).toContain('items[1]{id,name}:')
      expect(output).toContain('1,test')
    })

    it('should handle stdin input', () => {
      const jsonContent = JSON.stringify({ hello: 'world' })

      const result = runCli('--encode < /dev/stdin', jsonContent)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('hello: world')
    })
  })

  describe('basic decoding', () => {
    it('should decode TOON from file', () => {
      const toonContent = 'name: test\\nvalue: 42'
      const inputFile = createTempFile(toonContent, '.toon')

      const result = runCli(inputFile)

      expect(result.exitCode).toBe(0)
      const parsed = JSON.parse(result.stdout)
      expect(parsed).toEqual({ name: 'test', value: 42 })
    })

    it('should decode TOON with output file', () => {
      const toonContent = 'items[1]{id,name}:\\n  1,test'
      const inputFile = createTempFile(toonContent, '.toon')
      const outputFile = createTempFile('', '.json')

      const result = runCli(`${inputFile} -o ${outputFile}`)

      expect(result.exitCode).toBe(0)
      const output = JSON.parse(readFileSync(outputFile, 'utf8'))
      expect(output).toEqual({ items: [{ id: 1, name: 'test' }] })
    })
  })

  describe('options', () => {
    it('should use tab delimiter', () => {
      const jsonContent = JSON.stringify({ items: [{ a: 1, b: 2 }] })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(`${inputFile} --delimiter "\\t"`)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('items[1\\t]{a\\tb}:')
    })

    it('should use pipe delimiter', () => {
      const jsonContent = JSON.stringify({ items: [{ a: 1, b: 2 }] })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(`${inputFile} --delimiter "|"`)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('items[1|]{a|b}:')
    })

    it('should add length markers', () => {
      const jsonContent = JSON.stringify({ items: [{ a: 1 }] })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(`${inputFile} --length-marker`)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('items[#1]{a}:')
    })

    it('should show stats', () => {
      const jsonContent = JSON.stringify({ items: [{ a: 1, b: 2, c: 3 }] })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(`${inputFile} --stats`)

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toContain('tokens')
      expect(result.stderr).toContain('reduction')
    })

    it('should use custom indentation', () => {
      const jsonContent = JSON.stringify({ nested: { value: 42 } })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(`${inputFile} --indent 4`)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('    value: 42') // 4 spaces
    })
  })

  describe('error handling', () => {
    it('should handle invalid JSON', () => {
      const invalidJson = '{ invalid json'
      const inputFile = createTempFile(invalidJson)

      const result = runCli(inputFile)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('JSON')
    })

    it('should handle invalid TOON', () => {
      const invalidToon = 'invalid[toon format'
      const inputFile = createTempFile(invalidToon, '.toon')

      const result = runCli(inputFile)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('TOON')
    })

    it('should handle missing file', () => {
      const result = runCli('/nonexistent/file.json')

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('file')
    })

    it('should handle invalid delimiter', () => {
      const jsonContent = JSON.stringify({ test: 'value' })
      const inputFile = createTempFile(jsonContent)

      const result = runCli(`${inputFile} --delimiter "invalid"`)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('delimiter')
    })
  })

  describe('auto-detection', () => {
    it('should auto-detect JSON files for encoding', () => {
      const jsonContent = JSON.stringify({ test: 'value' })
      const inputFile = createTempFile(jsonContent, '.json')

      const result = runCli(inputFile)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('test: value')
    })

    it('should auto-detect TOON files for decoding', () => {
      const toonContent = 'test: value'
      const inputFile = createTempFile(toonContent, '.toon')

      const result = runCli(inputFile)

      expect(result.exitCode).toBe(0)
      const parsed = JSON.parse(result.stdout)
      expect(parsed).toEqual({ test: 'value' })
    })
  })

  describe('round-trip fidelity', () => {
    it('should maintain data integrity through encode->decode cycle', () => {
      const originalData = {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
        ],
        meta: { total: 2, version: '1.0' },
      }

      const jsonFile = createTempFile(JSON.stringify(originalData))
      const toonFile = createTempFile('', '.toon')
      const backToJsonFile = createTempFile('', '.json')

      // Encode to TOON
      const encodeResult = runCli(`${jsonFile} -o ${toonFile}`)
      expect(encodeResult.exitCode).toBe(0)

      // Decode back to JSON
      const decodeResult = runCli(`${toonFile} -o ${backToJsonFile}`)
      expect(decodeResult.exitCode).toBe(0)

      // Compare original and round-trip data
      const roundTripData = JSON.parse(readFileSync(backToJsonFile, 'utf8'))
      expect(roundTripData).toEqual(originalData)
    })
  })
})
