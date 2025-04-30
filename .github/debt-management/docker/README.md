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
