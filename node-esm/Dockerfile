FROM node:18-slim

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Default command to run the app
CMD ["node", "index.js"]
