FROM mcr.microsoft.com/devcontainers/base:ubuntu

ARG PERSONAL_ACCESS_TOKEN
ENV PERSONAL_ACCESS_TOKEN=${PERSONAL_ACCESS_TOKEN}

# Install common dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
	&& apt-get -y install --no-install-recommends \
	git curl wget build-essential software-properties-common \
	ca-certificates gnupg jq unzip less \
	cmake make pkg-config autoconf vim \
	libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev \
	libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev \
	python3-dev python3-pip python3-venv \
	&& apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x (required for npm@11.x) with optimized caching
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt-get update \
	&& apt-get install -y nodejs \
	&& npm install -g npm@latest \
	&& npm config set cache /root/.npm --global \
	&& npm install -g yarn node-gyp typescript jest webpack webpack-cli vite \
	&& npm cache clean --force

# Install Go for linuxkit and other Go-based tools
RUN wget -q https://go.dev/dl/go1.21.0.linux-amd64.tar.gz \
	&& tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz \
	&& rm go1.21.0.linux-amd64.tar.gz
ENV PATH=$PATH:/usr/local/go/bin

# Install Docker CLI
RUN curl -fsSL https://get.docker.com | sh

# Install Rust for any Rust-based dependencies
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH=$PATH:/root/.cargo/bin

# Configure Git to use the Personal Access Token
RUN git config --global url."https://${PERSONAL_ACCESS_TOKEN}@github.com/".insteadOf "https://github.com/"

# NVIDIA CUDA for GPU support if available (will gracefully degrade if GPU not present)
RUN mkdir -p /etc/apt/keyrings \
	&& wget -O cuda-keyring_1.1-1_all.deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb \
	&& dpkg -i cuda-keyring_1.1-1_all.deb \
	&& apt-get update \
	&& apt-get -y install --no-install-recommends cuda-toolkit-12-3 cuda-minimal-build-12-3 \
	&& rm cuda-keyring_1.1-1_all.deb \
	&& apt-get clean -y && rm -rf /var/lib/apt/lists/* \
	&& mkdir -p /usr/local/cuda-12.3/cuda-samples

# Set up environment variables for CUDA
ENV PATH=$PATH:/usr/local/cuda/bin
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/cuda/lib64
ENV CUDA_PATH=/usr/local/cuda
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=all

# Install GPU detection script
COPY scripts/detect-gpu.sh /usr/local/bin/detect-gpu
RUN chmod +x /usr/local/bin/detect-gpu

# Create scripts directory for submodule management and builds
RUN mkdir -p /workspaces/scripts

# Setup workspace
WORKDIR /workspaces/transformers.js-examples

# Set default command
CMD ["bash"]
