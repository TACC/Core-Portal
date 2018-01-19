# README #

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
  - `docker exec -it portal_django /bin/bash`
  - `python manage.py migrate`
  - `python manage.py createsuperuser`
  - `python manage.py collectstatic`

### Accessing the portal (locally) ###

1. Add a record in your local `hosts` file: `project.local 127.0.0.1`.
  - **This name must match the agave callback URL defined for the client**
2. Access `https://project.local` or `http://project.local:8000`
3. To login, make sure that you are going through SSL, you have go to `https://portal.local/accounts/login`. After login, can use the debug server at `http://portal.local:8000`
