# Next.js standalone build (web service).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* are inlined at build time, so the Clerk publishable key must be
# present HERE. API_INTERNAL_URL feeds the dev /api rewrite (in prod nginx splits
# /api -> :8901 before it reaches this app, so the rewrite is a no-op there).
ARG API_INTERNAL_URL=http://api:8901
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
