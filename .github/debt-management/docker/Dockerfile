# DOCKER_ID::HEADER
# filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\Dockerfile
# DOCKER_META::DESCRIPTION
# Lightweight Docker image with Hugging Face smol2 model for debt management assistance
# DOCKER_META::VERSION
# Version: 1.0.0
# DOCKER_META::MAINTAINER
# Maintainer: Transformers.js Team
# DOCKER_META::LAST_UPDATED
# Last Updated: 2025-05-01

# DOCKER_STAGE::BASE
# Base stage with minimal dependencies
FROM node:20-slim AS base

# DOCKER_LABEL::BASE
LABEL org.opencontainers.image.title="Debt Management Assistant"
LABEL org.opencontainers.image.description="AI-powered technical debt management system"
LABEL org.opencontainers.image.version="1.0.0"

# DOCKER_ENV::PATHS
ENV MODEL_CACHE_DIR=/app/model-cache
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# DOCKER_WORKDIR::APP
WORKDIR /app

# DOCKER_STAGE::BUILDER
# Builder stage for installing dependencies
FROM base AS builder

# DOCKER_RUN::APT_ESSENTIALS
# Install Python and essential build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
	python3 \
	python3-pip \
	python3-setuptools \
	python3-wheel \
	git \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# DOCKER_COPY::PACKAGE_JSON
# Copy package files for npm install
COPY package*.json ./

# DOCKER_RUN::NPM_INSTALL
# Install Node.js dependencies
RUN npm ci --only=production

# DOCKER_COPY::PYTHON_REQUIREMENTS
# Copy Python requirements
COPY requirements.txt ./

# DOCKER_RUN::PYTHON_INSTALL
# Install Python dependencies with specific versions for stability
RUN pip3 install --no-cache-dir -r requirements.txt

# DOCKER_STAGE::MODEL
# Model download stage
FROM builder AS model-downloader

# DOCKER_RUN::DOWNLOAD_MODEL
# Download and cache the smol2 model
RUN mkdir -p ${MODEL_CACHE_DIR} && \
	python3 -c "from transformers import AutoModelForCausalLM, AutoTokenizer; \
	model_id = 'HuggingFaceH4/tiny-random-LlamaForCausalLM'; \
	tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir='${MODEL_CACHE_DIR}'); \
	model = AutoModelForCausalLM.from_pretrained(model_id, cache_dir='${MODEL_CACHE_DIR}')"

# DOCKER_STAGE::FINAL
# Final stage with minimal runtime
FROM base AS final

# DOCKER_COPY::FROM_BUILDER
# Copy installed npm modules
COPY --from=builder /app/node_modules ./node_modules

# DOCKER_RUN::RUNTIME_DEPS
# Install Python runtime and minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
	python3 \
	python3-pip \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& pip3 install --no-cache-dir transformers torch --index-url https://download.pytorch.org/whl/cpu

# DOCKER_COPY::FROM_MODEL
# Copy the downloaded model to reduce startup time
COPY --from=model-downloader ${MODEL_CACHE_DIR} ${MODEL_CACHE_DIR}

# DOCKER_COPY::APP_CODE
# Copy application code
COPY . .

# DOCKER_VOLUME::DATA
# Volume for persistent data
VOLUME ["/app/debt-reports", "/app/config"]

# DOCKER_RUN::PERMISSIONS
# Ensure correct permissions
RUN chmod +x /app/scripts/*.sh /app/scripts/*.js

# DOCKER_HEALTHCHECK
# Configure healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD node /app/scripts/health-check.js || exit 1

# DOCKER_CMD::ENTRYPOINT
# Set entrypoint
ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# DOCKER_CMD::DEFAULT
# Default command
CMD ["node", "/app/scripts/debt-assistant.js"]

# DOCKER_ID::FOOTER
# SchemaVersion: 1.0.0
# DockerfileID: debt-management-assistant
