FROM node:13

# Still using the deprecated instruction
MAINTAINER Matthieu <matthieu.p@unix-corp.tech>
LABEL maintainer Matthieu <matthieu.p@unix-corp.tech>

ENV VERSION=0.2
WORKDIR /app
COPY package.json .
RUN yarn
COPY . .

ENTRYPOINT ["node","run","--docker"]