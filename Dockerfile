# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies and git
RUN apk add --no-cache git && npm install

# Copy the rest of the application files
COPY . .

# Build the client app and compile server.ts to dist/server.cjs
RUN npm run build

# Expose port 3000 (Hugging Face Spaces or Render will route to this port or inject PORT env)
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]
