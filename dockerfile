FROM node:22-alpine

WORKDIR /app

# Use faster registry for Asia
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 5

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 5001

CMD ["npm", "start"]
