# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files
RUN rm -rf src node_modules && npm ci --only=production

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
