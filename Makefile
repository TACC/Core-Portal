DOCKERHUB_REPO := $(shell cat ./docker_repo.var)
DOCKER_TAG ?= $(shell git rev-parse --short HEAD)
DOCKER_IMAGE := $(DOCKERHUB_REPO):$(DOCKER_TAG)
DOCKER_IMAGE_LATEST := $(DOCKERHUB_REPO):latest

####
# `DOCKER_IMAGE_BRANCH` tag is the git tag for the commit if it exists, else the branch on which the commit exists
DOCKER_IMAGE_BRANCH := $(DOCKERHUB_REPO):$(shell git describe --exact-match --tags 2> /dev/null || git symbolic-ref --short HEAD | sed 's/[^[:alnum:]\.\_\-]/-/g')

.PHONY: build
build:
	docker compose -f ./server/conf/docker/docker-compose.yml build

.PHONY: build-full
build-full:
	docker build -t $(DOCKER_IMAGE) --target production -f ./server/conf/docker/Dockerfile .
	docker tag $(DOCKER_IMAGE) $(DOCKER_IMAGE_BRANCH) # Note: Special chars replaced with dashes

.PHONY: publish
publish:
	docker push $(DOCKER_IMAGE)
	docker push $(DOCKER_IMAGE_BRANCH)

.PHONY: publish-latest
publish-latest:
	docker tag $(DOCKER_IMAGE) $(DOCKER_IMAGE_LATEST)
	docker push $(DOCKER_IMAGE_LATEST)

.PHONY: start
start:
	docker compose -f server/conf/docker/docker-compose-dev.all.debug.yml up

.PHONY: stop
stop:
	docker compose -f server/conf/docker/docker-compose-dev.all.debug.yml down

.PHONY: stop-full
stop-v:
	docker compose -f server/conf/docker/docker-compose-dev.all.debug.yml down -v
