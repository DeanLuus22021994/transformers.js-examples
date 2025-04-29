FROM node:18-slim

WORKDIR /app

# Install http-server for serving static files
RUN npm install -g http-server

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Command to serve the application
CMD ["npx", "http-server", "-p", "3000"]
