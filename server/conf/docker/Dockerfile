FROM python:3.11-bullseye as python-base

LABEL maintainer="TACC-ACI-WMA <wma_prtl@tacc.utexas.edu>"

ARG DEBIAN_FRONTEND=noninteractive

EXPOSE 8000

# https://python-poetry.org/docs/configuration/#using-environment-variables
ENV POETRY_VERSION=1.5.0 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1 \
    PYSETUP_PATH="/opt/pysetup" \
    VENV_PATH="/opt/pysetup/.venv"

# prepend poetry and venv to path
ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"


FROM python-base as builder-base
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

RUN pip3 install --upgrade pip setuptools wheel

# Install Poetry - respects $POETRY_VERSION & $POETRY_HOME
RUN curl -sSL https://install.python-poetry.org | python3 -

# copy project requirement files here to ensure they will be cached.
WORKDIR $PYSETUP_PATH
COPY server/pyproject.toml server/poetry.lock ./

# install runtime deps - uses $POETRY_VIRTUALENVS_IN_PROJECT internally
RUN poetry install --without dev

# `development` image is used for local development
FROM python-base as development
WORKDIR $PYSETUP_PATH

# copy in our built poetry + venv
COPY --from=builder-base $POETRY_HOME $POETRY_HOME
COPY --from=builder-base $PYSETUP_PATH $PYSETUP_PATH

# quicker install as runtime deps are already installed
RUN poetry install

COPY . /srv/www/portal

RUN mkdir -p /var/log/portal

WORKDIR /srv/www/portal/server

# `production` image is used for deployed runtime environments
FROM python-base as production

# install node 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

COPY --from=builder-base $PYSETUP_PATH $PYSETUP_PATH

COPY . /srv/www/portal

RUN mkdir -p /var/log/portal

RUN chmod u+x /srv/www/portal/client/build_client.sh && /srv/www/portal/client/build_client.sh

WORKDIR /srv/www/portal/server
