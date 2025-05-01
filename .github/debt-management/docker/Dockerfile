# DOCKER_ID::HEADER
# filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\Dockerfile
# DOCKER_META::DESCRIPTION
# Optimized Docker image with Hugging Face SmolLM2-1.7B model for debt management with RTX acceleration
# DOCKER_META::VERSION
# Version: 1.1.0
# DOCKER_META::MAINTAINER
# Maintainer: Transformers.js Team
# DOCKER_META::LAST_UPDATED
# Last Updated: 2025-05-01

# DOCKER_STAGE::BASE
# Base stage with CUDA support for RTX acceleration
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04 AS base

# DOCKER_LABEL::BASE
LABEL org.opencontainers.image.title="Debt Management Assistant"
LABEL org.opencontainers.image.description="RTX-accelerated technical debt management system"
LABEL org.opencontainers.image.version="1.1.0"
LABEL com.nvidia.volumes.needed="nvidia_driver"

# DOCKER_ENV::PATHS
ENV MODEL_CACHE_DIR=/app/model-cache
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV UV_CACHE_DIR=/cache/uv
ENV PIP_CACHE_DIR=/cache/pip
ENV NPM_CONFIG_CACHE=/cache/npm
ENV TORCH_CUDA_ARCH_LIST="7.0;7.5;8.0;8.6;9.0"
ENV CUDA_VISIBLE_DEVICES=all
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV PYTHONPYCACHEPREFIX=/cache/pycache

# DOCKER_WORKDIR::APP
WORKDIR /app

# DOCKER_VOLUMES::CACHE
# Cache volumes for faster builds
VOLUME ["/cache/uv", "/cache/pip", "/cache/npm", "/cache/pycache"]

# DOCKER_STAGE::BUILDER
# Builder stage for installing dependencies
FROM base AS builder

# DOCKER_RUN::APT_ESSENTIALS
# Install Node.js, Python, and essential build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
	nodejs \
	npm \
	python3 \
	python3-pip \
	python3-setuptools \
	python3-dev \
	python3-wheel \
	git \
	curl \
	build-essential \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm install -g npm@latest

# DOCKER_RUN::INSTALL_UV
# Install UV for faster package installation and caching
RUN curl -fsSL https://astral.sh/uv/install.sh | sh \
	&& export PATH="$PATH:/root/.local/bin" \
	&& ln -sf /root/.local/bin/uv /usr/local/bin/uv \
	&& echo 'export PATH="$PATH:/root/.local/bin"' >> /root/.bashrc

# DOCKER_COPY::PACKAGE_JSON
# Copy package files for npm install
COPY package*.json ./

# DOCKER_RUN::NPM_INSTALL
# Install Node.js dependencies with cache optimization
RUN echo "Installing Node.js dependencies with cache optimization" \
	&& mkdir -p $NPM_CONFIG_CACHE \
	&& npm ci --only=production --cache=$NPM_CONFIG_CACHE

# DOCKER_COPY::PYTHON_REQUIREMENTS
# Copy Python requirements
COPY requirements.txt ./

# DOCKER_RUN::PYTHON_INSTALL
# Install Python dependencies with UV for speed and caching
RUN echo "Installing Python dependencies with UV and GPU support" \
	&& mkdir -p $UV_CACHE_DIR \
	&& export PATH="$PATH:/root/.local/bin" \
	&& uv pip install --cache-dir=$UV_CACHE_DIR -r requirements.txt

# DOCKER_RUN::PYTHON_PRECOMPILE
# Precompile Python modules for faster startup
RUN echo "Precompiling Python modules for faster startup" \
	&& mkdir -p $PYTHONPYCACHEPREFIX \
	&& python3 -c "import compileall; compileall.compile_dir('/usr/local/lib/python3.10/dist-packages', force=True)" \
	&& python3 -c "import compileall; compileall.compile_dir('/app/node_modules', force=True)"

# DOCKER_STAGE::MODEL
# Model download and optimization stage
FROM builder AS model-downloader

# DOCKER_RUN::DOWNLOAD_MODEL
# Download, cache and optimize the SmolLM2-1.7B model for GPU with JIT compilation
RUN mkdir -p ${MODEL_CACHE_DIR} && \
	python3 -c "import os; \
	import torch; \
	from transformers import AutoModelForCausalLM, AutoTokenizer; \
	model_id = 'HuggingFaceTB/SmolLM2-1.7B-intermediate-checkpoints'; \
	revision = 'step-125000'; \
	print(f'Downloading model {model_id} (revision {revision})...'); \
	tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision, cache_dir='${MODEL_CACHE_DIR}'); \
	print('Tokenizer downloaded, now loading model with CUDA optimization...'); \
	# First create Low Precision model (FP16) for RTX acceleration \
	model = AutoModelForCausalLM.from_pretrained( \
	model_id, \
	revision=revision, \
	cache_dir='${MODEL_CACHE_DIR}', \
	torch_dtype=torch.float16, \
	device_map='auto' \
	); \
	print('Model loaded, optimizing with TorchScript JIT compilation...'); \
	# Apply JIT compilation for faster inference \
	example_input = tokenizer('This is a test input for optimization', return_tensors='pt').to('cuda'); \
	with torch.inference_mode(), torch.cuda.amp.autocast(): \
	traced_model = torch.jit.trace(model, example_input['input_ids']); \
	traced_model_path = os.path.join('${MODEL_CACHE_DIR}', 'optimized_model_cuda.pt'); \
	print(f'Saving optimized model to {traced_model_path}'); \
	torch.jit.save(traced_model, traced_model_path); \
	print('Model optimization complete!')"

# DOCKER_STAGE::FINAL
# Final stage with RTX acceleration
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04 AS final

# DOCKER_COPY::FROM_BUILDER_BASICS
# Copy essential environment variables
ENV MODEL_CACHE_DIR=/app/model-cache
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV UV_CACHE_DIR=/cache/uv
ENV PIP_CACHE_DIR=/cache/pip
ENV NPM_CONFIG_CACHE=/cache/npm
ENV TORCH_CUDA_ARCH_LIST="7.0;7.5;8.0;8.6;9.0"
ENV CUDA_VISIBLE_DEVICES=all
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV PYTHONPYCACHEPREFIX=/cache/pycache

# DOCKER_WORKDIR::APP_FINAL
WORKDIR /app

# DOCKER_RUN::RUNTIME_DEPS
# Install runtime dependencies optimized for GPU
RUN apt-get update && apt-get install -y --no-install-recommends \
	nodejs \
	npm \
	python3 \
	python3-pip \
	curl \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& curl -fsSL https://astral.sh/uv/install.sh | sh \
	&& ln -s ~/.cargo/bin/uv /usr/local/bin/uv \
	&& uv pip install --system \
	torch==2.1.0+cu121 \
	--index-url https://download.pytorch.org/whl/cu121 \
	transformers==4.38.0 \
	accelerate==0.24.0 \
	bitsandbytes==0.41.0 \
	numpy==1.24.3 \
	pyyaml==6.0.1

# DOCKER_COPY::FROM_BUILDER
# Copy installed npm modules
COPY --from=builder /app/node_modules ./node_modules

# DOCKER_COPY::FROM_MODEL
# Copy the downloaded and optimized model to reduce startup time
COPY --from=model-downloader ${MODEL_CACHE_DIR} ${MODEL_CACHE_DIR}

# DOCKER_COPY::APP_CODE
# Copy application code
COPY . .

# DOCKER_RUN::CUDA_CONFIG
# Configure CUDA for optimal performance
RUN python3 -c "import torch; torch.backends.cudnn.benchmark = True; print(f'CUDA configuration complete. Available: {torch.cuda.is_available()}, Device count: {torch.cuda.device_count()}')"

# DOCKER_VOLUME::DATA
# Volume for persistent data and cache
VOLUME ["/app/debt-reports", "/app/config", "/cache"]

# DOCKER_RUN::PERMISSIONS
# Ensure correct permissions
RUN chmod +x /app/scripts/*.sh /app/scripts/*.js \
	&& mkdir -p /cache/uv /cache/pip /cache/npm /cache/pycache \
	&& chmod -R 777 /cache

# DOCKER_HEALTHCHECK
# Configure healthcheck with GPU validation
HEALTHCHECK --interval=30s --timeout=20s --start-period=60s --retries=3 \
	CMD python3 -c "import torch; exit(0 if torch.cuda.is_available() else 1)" && node /app/scripts/health-check.js || exit 1

# DOCKER_CMD::ENTRYPOINT
# Set entrypoint
ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# DOCKER_CMD::DEFAULT
# Default command
CMD ["node", "/app/scripts/debt-assistant.js"]

# DOCKER_ID::FOOTER
# SchemaVersion: 1.1.0
# DockerfileID: rtx-accelerated-debt-management-assistant
