FROM node:22-alpine

WORKDIR /app

# Install openssl for Prisma native binary engines
RUN apk add --no-cache openssl

# Copy dependency and Prisma schema manifests first for layer caching
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install reproducible production dependencies (excluding devDependencies)
RUN npm ci --omit=dev

# Generate Prisma Client at build time for optimal runtime startup
RUN npx prisma generate

# Copy remaining application source code
COPY . .

# Expose standard port (Railway injects and overrides PORT at runtime)
EXPOSE 3000

# Start server (Prisma generate ensures client readiness if volume-mounted)
CMD ["npm", "start"]
