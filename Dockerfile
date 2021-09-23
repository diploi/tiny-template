FROM node:14

WORKDIR /app

COPY repository/package*.json ./
RUN npm install

COPY repository/index.js ./

EXPOSE 8080

CMD [ "node", "index.js" ]
