# Test Fixtures

This directory contains large OpenAPI specification files used for integration testing.

## DigitalOcean API

The `digitalocean-api.json` file is not committed to the repository due to its size (~2.8 MB) and because it contains example webhook URLs that trigger GitHub's secret scanning.

### How to obtain the fixture:

1. **Download the OpenAPI spec:**
   ```bash
   curl -o DigitalOcean-public.v2.yaml https://api-spec.do.co/DigitalOcean-public.v2.yaml
   ```

2. **Convert YAML to JSON:**
   ```bash
   # Using yq
   yq eval -o=json DigitalOcean-public.v2.yaml > digitalocean-api.json

   # Or using Python
   python3 -c "import yaml, json, sys; json.dump(yaml.safe_load(sys.stdin), sys.stdout)" < DigitalOcean-public.v2.yaml > digitalocean-api.json
   ```

### Test behavior:

The `digitalocean-decode.test.ts` test will automatically skip if the fixture file is not present. This allows CI to pass without requiring the large file to be committed.

If you want to run the full integration test locally:
1. Download the file using the instructions above
2. Place it in this directory
3. Run the tests: `pnpm test digitalocean`
