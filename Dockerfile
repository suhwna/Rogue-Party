FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV PORT=5173
ENV ROGUE_DATA_DIR=/app/.data

EXPOSE 5173

CMD ["node", "server.js"]
