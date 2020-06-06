FROM python:3.6-buster

LABEL maintainer="TACC-ACI-WMA <wma_prtl@tacc.utexas.edu>"

ARG DEBIAN_FRONTEND=noninteractive

EXPOSE 8000

# install locales for en_us.utf-8
RUN apt-get update && apt-get install -y \
    dialog \
    apt-utils \
    locales \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

ENV LC_ALL en_US.utf-8
ENV LANG en_US.utf-8

RUN apt-get update &&  apt-get install -y --no-install-recommends \
    sqlite3 \
    postgresql \
    postgresql-client

# install node 12.x
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

RUN pip3 install --upgrade pip setuptools wheel

# install poetry
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python3

# install python packages
COPY server/pyproject.toml server/poetry.lock /tmp/
RUN cd /tmp && poetry install

COPY . /srv/www/portal

RUN mkdir -p /var/log/portal

ARG build_client=build_client
RUN chmod u+x /srv/www/portal/client/build_client.sh && /srv/www/portal/client/build_client.sh $build_client

WORKDIR /srv/www/portal/server
