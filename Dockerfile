# Stage 1: Base image with Node.js
FROM node:18-bullseye

# Install system dependencies required by 'canvas'
RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Set up the application directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install npm dependencies (this will now correctly build canvas)
RUN npm install

# Copy the rest of your application code
COPY . .

# Run the deploy script to register your slash commands
RUN npm run deploy

# The command to start your bot
CMD ["node", "index.js"]
