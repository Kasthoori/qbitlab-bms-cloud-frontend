# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock ./

# Install dependencies using yarn lock file
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY . .

# Build production frontend
RUN yarn build


# ---------- Nginx stage ----------
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]