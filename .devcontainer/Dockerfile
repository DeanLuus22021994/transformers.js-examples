FROM node:lts-bullseye

# Enable BuildKit features
# syntax=docker/dockerfile:1.4

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Update and install minimal required packages
RUN --mount=type=cache,target=/var/cache/apt \
	apt-get update && \
	apt-get -y install --no-install-recommends \
	git curl wget unzip gnupg python3-pip \
	build-essential jq libcurl4-openssl-dev \
	libssl-dev libicu-dev moreutils netcat \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Set up Azure CLI dependencies (using cache mount)
RUN --mount=type=cache,target=/var/cache/apt \
	curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install global Node packages (using cache mount)
RUN --mount=type=cache,target=/root/.npm \
	npm install -g \
	@azure/storage-blob \
	@azure/identity \
	@azure/monitor-query \
	typescript \
	ts-node \
	eslint \
	prettier

# Create directories for mounted volumes
RUN mkdir -p /workspace/.precompiled \
	&& mkdir -p /workspace/node_modules \
	&& mkdir -p /workspace/.devcontainer \
	&& mkdir -p /root/.cache

# Set environment variables for GPU passthrough
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Create non-root user with sudo access
RUN apt-get update && apt-get install -y sudo && \
	groupadd -r azureuser && \
	useradd -m -r -g azureuser -G sudo azureuser && \
	echo "azureuser ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/azureuser

# Create directories for precompiled assets and setup markers
RUN mkdir -p /workspace/.devcontainer && \
	touch /workspace/.devcontainer/.setup-init

# Set workspace as working directory
WORKDIR /workspace

# Switch back to dialog for any ad-hoc use
ENV DEBIAN_FRONTEND=dialog

# Default to root user for host access
USER root