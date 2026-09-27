# node:sqlite (penyimpanan email) tersedia bawaan di Node 24
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production DB_PATH=/data/subscribers.db
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js calc.js pdf.js db.js export.js backup.js ./
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
