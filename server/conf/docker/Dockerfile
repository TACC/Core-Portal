FROM python:3.12-slim AS python-base
LABEL maintainer="TACC-ACI-WMA <wma_prtl@tacc.utexas.edu>"
ARG DEBIAN_FRONTEND=noninteractive

# Ensure that system pip is not using compromised certifi bundle [https://discuss.python.org/t/information-for-python-users-regarding-emudhra-emsign-ca-certificate-security-incident/109576]
RUN python -m pip install "pip @ https://files.pythonhosted.org/packages/3f/06/3e4420302363fbb71be3c7f35ce042f54bfca330e3e66b3a2e3c4cca579f/pip-26.2.2-py3-none-any.whl#sha256=fd7f4dfa8190e014013b9f08f3e973f4e4c26ffd179a204895533a7254813a70"

RUN apt-get update && apt-get install -y git gcc libmagic-dev
EXPOSE 8000

COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /uvx /bin/
ENV SERVER_PATH="/srv/www/portal/server"
ENV PATH="$SERVER_PATH/.venv/bin:$PATH"

WORKDIR $SERVER_PATH
COPY server/pyproject.toml server/uv.lock ./
# install runtime deps
RUN --mount=type=cache,id=uv-core-prod,target=/uv/sync-prod uv sync --locked --no-dev


FROM ghcr.io/pnpm/pnpm:12 AS node_build
RUN pnpm runtime set node 24 -g
WORKDIR /client

COPY ./client/ ./

RUN --mount=type=cache,id=pnpm-core,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm run build


# `development` target is used for local development
FROM python-base AS development
WORKDIR $SERVER_PATH
RUN --mount=type=cache,id=uv-core-dev,target=/uv/sync-dev uv sync --locked --dev
COPY . /srv/www/portal

RUN mkdir -p /var/log/portal


# `production` target is used for deployed runtime environments
FROM python-base AS production
COPY . /srv/www/portal
COPY --from=node_build /client/dist /srv/www/portal/client/dist
RUN mkdir -p /var/log/portal

WORKDIR $SERVER_PATH
