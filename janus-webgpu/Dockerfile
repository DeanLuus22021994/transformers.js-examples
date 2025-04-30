FROM node:18

WORKDIR /app

# Install Chrome for rendering and WebGPU support
RUN apt-get update && apt-get install -y \
	wget \
	gnupg \
	ca-certificates \
	&& wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
	&& echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
	&& apt-get update \
	&& apt-get install -y google-chrome-stable \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port for development server
EXPOSE 5173

# Default command to start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
