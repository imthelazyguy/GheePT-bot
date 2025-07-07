# Stage 1: Use the official Node.js 18 image as the foundation.
# This ensures Node.js and npm are installed and available from the very beginning.
FROM node:18-bullseye

# Stage 2: Install system-level libraries needed for the 'canvas' package.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

# Stage 3: Set up the application directory inside the container.
WORKDIR /app

# Stage 4: Copy package manifests. This is a Docker caching optimization.
COPY package.json package-lock.json* ./

# Stage 5: Install all Node.js dependencies.
RUN npm install

# Stage 6: Copy the rest of your application code.
COPY . .

# DELETED THIS LINE: RUN npm run deploy -- This was the cause of the error.

# Stage 7: Define the final command to start your bot when the container launches.
CMD ["node", "index.js"]
