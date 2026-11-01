FROM node:22-alpine
WORKDIR /app/api
ENV NODE_ENV=production
COPY api/package*.json ./
COPY content-contract /app/content-contract
RUN npm ci --omit=dev
COPY --chown=node:node api/src ./src
COPY --chown=node:node api/scripts ./scripts
COPY --chown=node:node api/migrations ./migrations
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
