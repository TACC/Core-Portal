ARG UV_VERSION=latest
FROM ghcr.io/astral-sh/uv:${UV_VERSION} AS uv

FROM mcr.microsoft.com/devcontainers/python:3-3.12-trixie
COPY --from=uv /uv /uvx /bin/
