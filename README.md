# README #

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* Summary of set up
* Configuration
* Dependencies
* Database configuration
* How to run tests
* Deployment instructions

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact


# ORIGINAL PORTAL README #

### UT Portal ###

* UT Portal django project
* v0.1.0
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### SETUP ###

* Requirements
  * Docker


1. Copy example local and secrets settings.
  - `cd ut-portal/project/portal/settings`
  - `cp settings_local.example.py settings_local.py`
  - `cp settings_secret.example.py settings_secret.py`
  - `cp settings_agave.example.py settings_agave.py`
2. Edit `settings_secret.py` `settings_agave` and `settings_local.py` accordingly.
3. Build the image for the portal's django container.
  - `docker-compose build`
4. Start up the dev environment in docker.
  - `docker compose -f docker-compose-dev.all.debug.yml`
5. Initialize the application.
  - `docker exec -it cep_django /bin/bash`
  - `python manage.py migrate`
  - `python manage.py createsuperuser`
  - `python manage.py collectstatic`

### Accessing the portal (locally) ###

1. Add a record in your local `hosts` file: `cep.dev 127.0.0.1`.
  - **This name must match the agave callback URL defined for the client**
2. Access `https://cep.dev` or `http://cep.dev:8000`
3. To login, make sure that you are going through SSL, you have go to `https://cep.dev/accounts/login`. After login, can use the debug server at `http://cep.dev:8000`
