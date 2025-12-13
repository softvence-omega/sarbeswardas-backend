# --- 1. Base image ---
FROM node:18

# --- 2. Set working directory ---
WORKDIR /app

# --- 3. Copy package.json + lock file ---
COPY package*.json ./

# --- 4. Install dependencies ---
RUN npm install

# --- 5. Copy all project files ---
COPY . .

# --- 6. Build TypeScript into dist/ ---
RUN npm run build

# --- 7. Expose backend port ---
EXPOSE 5000

# --- 8. Run compiled JavaScript ---
CMD ["node", "dist/server.js"]
