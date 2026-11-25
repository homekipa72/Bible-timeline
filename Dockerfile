FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server.js ./
COPY api ./api
COPY index.html sw.js manifest.webmanifest ./
COPY css ./css
COPY js ./js
COPY icons ./icons
EXPOSE 3000
CMD ["node", "server.js"]
