# Stage 1: Use the official Node.js 18 image as the foundation.
# This line ensures Node.js and npm are installed and available from the very beginning.
FROM node:18-bullseye

# Stage 2: Install system-level libraries needed for the 'canvas' package.
# This must happen before installing npm packages.
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
# It allows Docker to skip reinstalling dependencies if they haven't changed.
COPY package.json package-lock.json* ./

# Stage 5: Install all Node.js dependencies.
# This now runs in an environment where Node.js is guaranteed to exist.
# This is where 'canvas' will be built successfully.
RUN npm install

# Stage 6: Copy the rest of your application code.
COPY . .

# Stage 7: Run the deploy script to register your slash commands with Discord.
# This runs after all your code and dependencies are in place.
RUN npm run deploy

# Stage 8: Define the final command to start your bot when the container launches.
CMD ["node", "index.js"]
