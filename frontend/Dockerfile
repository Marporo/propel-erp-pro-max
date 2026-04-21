# ETAPA 1: Construcción (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código y compilar para producción
COPY . .
RUN npm run build

# ETAPA 2: Producción (Servidor Nginx)
FROM nginx:stable-alpine

# Copiar los archivos compilados desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
