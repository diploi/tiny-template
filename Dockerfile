FROM node:14

WORKDIR /app

COPY repository/package*.json ./
RUN npm install

COPY repository/index.js ./
COPY repository/index2.js ./
COPY repository/index2.js ./

EXPOSE 8080

CMD [ "node", "index.js" ]
