FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace", "frontend"]
