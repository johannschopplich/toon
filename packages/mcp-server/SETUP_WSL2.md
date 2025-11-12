# Setting Up TOON MCP Server in WSL2 with Claude Code

## Quick Setup Guide

### 1. Install Dependencies in Your WSL2 Environment

```bash
# Install FastMCP
pip install fastmcp

# Or if you prefer to install the package
cd /path/to/toonMCP/packages/mcp-server
pip install -e .
```

### 2. Build the TOON CLI (Required)

The MCP server wraps the TypeScript TOON CLI, so you need to build it first:

```bash
cd /path/to/toonMCP
pnpm install
pnpm build
```

### 3. Test the MCP Server

Run this to verify the server works:

```bash
cd /path/to/toonMCP/packages/mcp-server
python3 -m toon_mcp.server
```

You should see: "TOON MCP Server running on stdio"

Press Ctrl+C to stop.

### 4. Configure Claude Code

Claude Code supports MCP servers through configuration. The location depends on how you're running Claude Code:

#### Option A: Using Claude Code Settings File

If Claude Code uses a settings file, add this configuration:

```json
{
  "mcpServers": {
    "toon": {
      "command": "python3",
      "args": ["-m", "toon_mcp.server"],
      "cwd": "/home/YOUR_USERNAME/path/to/toonMCP/packages/mcp-server"
    }
  }
}
```

#### Option B: Using Environment Variable

You can also specify MCP servers via environment variable:

```bash
export CLAUDE_MCP_CONFIG='{"mcpServers":{"toon":{"command":"python3","args":["-m","toon_mcp.server"],"cwd":"/home/user/toonMCP/packages/mcp-server"}}}'
```

#### Option C: Direct Python Path (No Installation Required)

If you don't want to install the package, use the standalone runner:

```json
{
  "mcpServers": {
    "toon": {
      "command": "python3",
      "args": ["/home/YOUR_USERNAME/path/to/toonMCP/packages/mcp-server/run_server.py"]
    }
  }
}
```

### 5. Restart Claude Code

After adding the configuration, restart Claude Code for changes to take effect.

### 6. Test It Works

Ask Claude Code to use the TOON tools:

**Test encoding:**
```
Can you use the toon_encode tool to convert this JSON to TOON format:
{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
```

**Test decoding:**
```
Can you use the toon_decode tool to convert this TOON back to JSON:
users[2]{id,name}:
  1,Alice
  2,Bob
```

## Troubleshooting

### Server won't start

1. **Check Python version:**
   ```bash
   python3 --version  # Should be 3.10+
   ```

2. **Check FastMCP is installed:**
   ```bash
   python3 -c "import fastmcp; print(fastmcp.__version__)"
   ```

3. **Verify TOON CLI is built:**
   ```bash
   ls /path/to/toonMCP/packages/cli/dist/
   ls /path/to/toonMCP/packages/toon/dist/
   ```

### Tools don't appear in Claude Code

1. Check Claude Code logs for MCP connection errors
2. Verify the `cwd` path in your config is correct
3. Test the server manually first (see step 3 above)

### "Module not found" errors

If using `python3 -m toon_mcp.server`, ensure either:
- The package is installed (`pip install -e .`)
- OR use the `run_server.py` script instead

## Alternative: Using Standard MCP SDK

If you prefer using the standard MCP SDK instead of FastMCP, see the commented-out TypeScript implementation in the git history.

## Configuration File Locations

Claude Code typically looks for MCP configuration in:
- `~/.config/claude-code/mcp_settings.json`
- `~/.claude-code/mcp.json`
- Or via command-line flags when starting Claude Code

Check your Claude Code documentation for the exact location.

## Example Usage

Once configured, you can use the tools in Claude Code:

```
You: Encode this data to TOON format with tab delimiters:
{"products": [
  {"sku": "A1", "name": "Widget", "price": 9.99},
  {"sku": "B2", "name": "Gadget", "price": 14.50}
]}

Claude Code: [Uses toon_encode tool with delimiter="\t"]
```

The response will show the TOON formatted output with much fewer tokens!
