# CLI Workflow Examples

Common command-line usage patterns and integrations with popular tools.

## Files

- **[api-integration.sh](./api-integration.sh)** - Fetching API data and converting to TOON
- **[data-pipeline.sh](./data-pipeline.sh)** - Processing data through multiple tools
- **[batch-processing.sh](./batch-processing.sh)** - Converting multiple files
- **[llm-workflows.sh](./llm-workflows.sh)** - Preparing data for LLM APIs

## Prerequisites

```bash
# Install TOON CLI globally
npm install -g @toon-format/cli

# Or use with npx (no installation needed)
npx @toon-format/cli --help
```

## Running Examples

Make the scripts executable and run them:

```bash
chmod +x *.sh
./api-integration.sh
```