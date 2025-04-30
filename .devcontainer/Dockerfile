# Use a multi-stage build for a smaller image
FROM node:lts-bullseye-slim AS base

# Enable BuildKit features
# syntax=docker/dockerfile:1.4

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Install only essential packages
RUN --mount=type=cache,target=/var/cache/apt \
	apt-get update && \
	apt-get -y install --no-install-recommends \
	git curl wget gnupg ca-certificates \
	build-essential python3-minimal \
	jq libcurl4-openssl-dev \
	libssl-dev libicu-dev moreutils netcat-openbsd \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Set up Azure CLI dependencies (using cache mount)
RUN --mount=type=cache,target=/var/cache/apt \
	curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r node && \
	useradd -m -r -g node -G sudo node

FROM base as deps

# Install npm dependencies efficiently
WORKDIR /tmp/npminstall
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
	npm ci --only=production && \
	cp -R node_modules /tmp/node_modules

# Install dev dependencies for tools
RUN --mount=type=cache,target=/root/.npm \
	npm install -g \
	@azure/storage-blob \
	@azure/identity \
	typescript \
	ts-node \
	eslint \
	prettier

FROM base AS final

# Copy only the production dependencies
COPY --from=deps /tmp/node_modules /workspace/node_modules

# Create directories for mounted volumes
RUN mkdir -p /workspace/.precompiled \
	&& mkdir -p /workspace/.devcontainer \
	&& mkdir -p /root/.cache \
	&& mkdir -p /workspace/.config \
	&& chown -R node:node /workspace

# Set environment variables for GPU passthrough
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Setup home directory for node user
USER node
RUN mkdir -p /home/node/.vscode-server/extensions \
	&& mkdir -p /home/node/.azure

USER root
# Create setup marker directory
RUN mkdir -p /workspace/.devcontainer && \
	touch /workspace/.devcontainer/.setup-init

# Set workspace as working directory
WORKDIR /workspace

# Switch back to dialog for any ad-hoc use
ENV DEBIAN_FRONTEND=dialog