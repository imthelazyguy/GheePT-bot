# Stage 1: Base image with Node.js v18
FROM node:18-bullseye

# Set the working directory inside the container
WORKDIR /app

# Install system-level dependencies required by the 'canvas' package
# This is the most critical step.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

# Copy package manifests and install Node.js dependencies
# This leverages Docker's layer caching for faster subsequent builds.
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Run the command deployment script to register slash commands with Discord
RUN npm run deploy

# The command to start your bot when the container launches
CMD ["node", "index.js"]
