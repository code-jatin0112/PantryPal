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

# Generate Prisma Client at build time using a command-scoped non-secret placeholder URL.
# (Prisma v7 loads prisma.config.ts requiring env("DATABASE_URL"), but performs zero network I/O during generate)
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" npx prisma generate

# Copy remaining application source code
COPY . .

# Expose standard port (Railway injects and overrides PORT at runtime)
EXPOSE 3000

# Start server using pre-generated runtime artifacts
CMD ["npm", "start"]
