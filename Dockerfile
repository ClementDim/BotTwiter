# FOR DEVELOPMENT
FROM node:16.10-alpine as dev-stage
WORKDIR /app
COPY package*.json ./
RUN npm i --save
COPY . .
RUN npm run start