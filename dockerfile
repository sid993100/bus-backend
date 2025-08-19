# ---- Base Image ----
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend with index.js
CMD ["node", "index.js"]
