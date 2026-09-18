ARG NEXT_PUBLIC_ARCADE_URL=https://expo.aura.ia.bo
ARG NEXT_PUBLIC_AURA_CONTACT_EMAIL=contacto@aura.ia.bo

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_ARCADE_URL
ARG NEXT_PUBLIC_AURA_CONTACT_EMAIL
ENV NEXT_PUBLIC_ARCADE_URL=${NEXT_PUBLIC_ARCADE_URL}
ENV NEXT_PUBLIC_AURA_CONTACT_EMAIL=${NEXT_PUBLIC_AURA_CONTACT_EMAIL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
