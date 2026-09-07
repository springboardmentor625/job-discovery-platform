# =====================================================
# BUILD STAGE
# =====================================================

FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY . .

# Build React application
RUN npm run build


# =====================================================
# PRODUCTION STAGE
# =====================================================

FROM nginx:alpine

# Copy React build to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]