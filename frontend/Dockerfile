FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Previously this image ran `npm run dev` — Vite's development server
# (unminified, hot-reload overhead, dev-only warnings) — as the
# "production" container. This now builds a real production bundle and
# serves *that* instead.
#
# Note: `vite preview` is a light static file server intended for
# locally previewing a production build, not a hardened production web
# server. For a real deployment, prefer serving the `dist/` output with
# a dedicated static server (e.g. nginx) instead of `vite preview`.
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
