FROM python:3.11-bullseye AS python-base

LABEL maintainer="TACC-ACI-WMA <wma_prtl@tacc.utexas.edu>"

ARG DEBIAN_FRONTEND=noninteractive

EXPOSE 8000

# https://python-poetry.org/docs/configuration/#using-environment-variables
ENV POETRY_VERSION=2.1.1 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    PYSETUP_PATH="/opt/pysetup" \
    VENV_PATH="/opt/pysetup/.venv"

# prepend venv and poetry to path
ENV PATH="$VENV_PATH/bin:$POETRY_HOME/bin:$PATH"

# `builder-base` stage is used to build deps + create virtual environment
FROM python-base AS builder-base

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

# Install poetry version $POETRY_VERSION to $POETRY_HOME
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel \
    && python3 -m venv "$POETRY_HOME" \
    && "$POETRY_HOME/bin/pip" install --no-cache-dir poetry=="$POETRY_VERSION"

# copy project requirement files here to ensure they will be cached.
WORKDIR $PYSETUP_PATH
COPY server/pyproject.toml server/poetry.lock ./

# install runtime deps - uses $POETRY_VIRTUALENVS_IN_PROJECT internally
RUN poetry install

# `development` target is used for local development
FROM python-base AS development

WORKDIR $PYSETUP_PATH

# copy in our built poetry + venv
COPY --from=builder-base $POETRY_HOME $POETRY_HOME
COPY --from=builder-base $PYSETUP_PATH $PYSETUP_PATH

# quicker install as runtime deps are already installed
RUN poetry install --with dev

COPY . /srv/www/portal

RUN mkdir -p /var/log/portal

WORKDIR /srv/www/portal/server

# `production` target is used for deployed runtime environments
FROM python-base AS production

# install node 22.x
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

COPY --from=builder-base $PYSETUP_PATH $PYSETUP_PATH

COPY . /srv/www/portal

RUN mkdir -p /var/log/portal

RUN chmod u+x /srv/www/portal/client/build_client.sh && /srv/www/portal/client/build_client.sh

WORKDIR /srv/www/portal/server
