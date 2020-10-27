FROM node:latest

WORKDIR /var/www
COPY package*.json ./
RUN yarn install