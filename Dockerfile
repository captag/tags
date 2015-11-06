FROM node:4.0.0
WORKDIR /app
ADD package.json /app/
RUN npm --unsafe-perm install
ADD . /app
EXPOSE 3000
CMD [ "node", "server/server.js"]
