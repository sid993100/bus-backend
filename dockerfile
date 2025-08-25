# ---- Base Build Image ----
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including dev dependencies if needed for build)
RUN npm install

# Copy the rest of the source code
COPY . .

# ---- Production Image ----
FROM node:18-alpine

WORKDIR /app

# Install PM2 globally (process manager for Node.js in production)
RUN npm install -g pm2

# Copy only required files from the build stage (dependencies + source code)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app . .

# Expose backend ports (Express API + TCP Listeners)
EXPOSE 5000 5055 5056

# Start the app with PM2 in production mode
CMD ["pm2-runtime", "index.js"]
