FROM node:18-alpine AS BUILD_IMAGE

RUN apk add --no-cache --virtual .build-deps make gcc g++ python3 postgresql-dev

WORKDIR /usr/src/app

COPY . .

RUN rm -rf node_modules build

RUN npm install

RUN npm run build

RUN cp -R node_modules/better-sqlite3/build ./build

RUN rm -rf node_modules

RUN npm install --production

RUN apk del .build-deps

FROM node:18-alpine

WORKDIR /usr/src/app

# copy from build image
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/config ./config
COPY --from=BUILD_IMAGE /usr/src/app/build ./build
COPY --from=BUILD_IMAGE /usr/src/app/migrations ./migrations

EXPOSE 3000

CMD [ "node", "./dist/index.js" ]

