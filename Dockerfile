#######################################################
# Builder
#######################################################

FROM node:17-alpine as builder

ENV APP_UID=1000
ENV APP_GID=1000
ENV APP_HOME=/usr
ENV APP_USER=node

RUN apk --no-cache add shadow \
  && groupmod -g $APP_GID node \
  && usermod -u $APP_UID -g $APP_GID $APP_USER \
  && mkdir -p $APP_HOME \
  && chown -R $APP_USER $APP_HOME

WORKDIR $APP_HOME

COPY . .

RUN npm ci

USER $APP_USER

#######################################################
# App container
#######################################################

FROM node:slim as runtime
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ENV NODE_ENV=production
ENV APP_UID=1000
ENV APP_GID=1000
ENV APP_HOME=/app
ENV APP_USER=node

WORKDIR $APP_HOME

USER $APP_USER

COPY --from=builder \
  /usr/index.js \
  $APP_HOME/index.js

COPY --from=builder \
  /usr/vault.js \
  $APP_HOME/vault.js

COPY --from=builder \
    /usr/node_modules/ \
    $APP_HOME/node_modules/

CMD node index.js