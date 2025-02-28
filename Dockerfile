FROM node:18-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy service account key file
COPY service-account-key.json ./

# Bundle app source
COPY . .

# Create temp directory
RUN mkdir -p temp

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "index.js"] 