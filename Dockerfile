# Use official Node.js Debian-based image
FROM node:20-bullseye

# Install Python 3, pip, and Git
RUN apt-get update && \
    apt-get install -y python3 python3-pip git && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the client app and compile server.ts to dist/server.cjs
RUN npm run build

# Railway injects PORT environment variable. We expose 3000 as a default.
ENV PORT 3000
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]
