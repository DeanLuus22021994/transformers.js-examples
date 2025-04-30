# Docker Container for Technical Debt Scanner

This directory contains Docker configuration for the Technical Debt Scanner.

## Container Structure

- Base image: `ubuntu:22.04`
- Installed tools:
  - Git
  - Grep, Sed
  - NodeJS
  - Python 3
  - Various CLI utilities

## Running the Container

### Option 1: From Repository Root

```bash
docker-compose -f docker-compose.debt-scanner.yml up --build
```

### Option 2: From Docker Directory

```bash
cd .github/debt-management/docker
docker-compose up --build
```

### Option 3: Docker Run Command

```bash
docker build -t debt-scanner -f .github/debt-management/docker/Dockerfile .
docker run -v $(pwd):/repo -v $(pwd)/debt-reports:/repo/debt-reports debt-scanner
```

## Output

The container generates two types of reports:

1. **Raw Scan Results**: `debt-report.md`
2. **Weekly Summary**: `debt-weekly-report.md`

Both reports are saved to the `debt-reports` directory in your repository root.

## Troubleshooting

### Container fails to build

- Ensure Docker is running
- Check Docker has sufficient resources

### Scanner doesn't find any debt items

- Verify the file patterns in `debt-config.yml`
- Check that you're using the correct debt markers in code comments

### Permission issues with output files

- Ensure the host directory has write permissions
- Check Docker volume mount settings
