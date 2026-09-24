FROM node:22-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy dependency files first (for layer caching)
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npm run build

# Copy remaining source code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
