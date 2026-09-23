FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# next-auth wants nodemailer 7 while the project pins 6; the host's node_modules
# were installed the same way, so this keeps the container's dependency tree
# identical to the one production has been running on.
RUN npm ci --legacy-peer-deps

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public values are inlined into the browser bundle at build time, so these must
# be the real ones. Everything below is a placeholder that satisfies module-level
# checks while Next collects page data; none is a real secret, and none reaches
# the final image, which takes its values from the environment at runtime.
ARG NEXT_PUBLIC_WA_NUMBER=""
ARG NEXT_PUBLIC_SITE_URL="https://cloud.golivecompany.com"
ENV NEXT_PUBLIC_WA_NUMBER=$NEXT_PUBLIC_WA_NUMBER \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NODE_ENV=production \
    MONGODB_URI=mongodb://placeholder:placeholder@127.0.0.1:27017/build?authSource=build \
    NEXTAUTH_SECRET=build-placeholder \
    NEXTAUTH_URL=https://cloud.golivecompany.com \
    RESEND_API_KEY=re_build_placeholder \
    TURNSTILE_SECRET_KEY=build-placeholder \
    ASSESSMENT_SIGNING_SECRET=build-placeholder \
    CRON_SECRET=build-placeholder \
    ADMIN_EMAIL=build@placeholder.invalid \
    ADMIN_PASSWORD=build-placeholder \
    NOTIFY_EMAIL=build@placeholder.invalid \
    SMTP_HOST=localhost SMTP_PORT=25 SMTP_USER=build SMTP_PASS=build \
    ASSESSMENT_CODE_OPS=build ASSESSMENT_CODE_SOCIAL=build \
    ASSESSMENT_CODE_HOSTING=build ASSESSMENT_CODE_SALES=build \
    PUPPETEER_SKIP_DOWNLOAD=true
RUN npm run build && npm prune --omit=dev --legacy-peer-deps

FROM node:22-bookworm-slim AS run
WORKDIR /app
# Chromium for PDF generation, plus the fonts it needs to render documents.
# The host used a Puppeteer-downloaded Chrome under the project directory;
# inside the container that path does not exist, so the compose file also
# overrides PUPPETEER_EXECUTABLE_PATH to win over .env.local.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium fonts-liberation fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN groupadd -g 10001 portal && useradd -u 10001 -g portal -m portal
COPY --from=build --chown=portal:portal /app ./
USER portal
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
