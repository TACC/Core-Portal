FROM centos:centos7

MAINTAINER TACC-ACI-WMA <wma_prtl@tacc.utexas.edu>

EXPOSE 8000

#upgrade
RUN yum upgrade -y
# add EPEL repo
RUN yum install -y epel-release
RUN yum install -y python-pip python-setuptools gcc python-devel unzip wget git mysql-devel vim nfs-utils libsemanage-python postgresql-devel --enablerepo=epel
RUN yum groupinstall -y 'Development Tools'

#install nodejs
RUN rpm -ivh https://kojipkgs.fedoraproject.org//packages/http-parser/2.7.1/3.el7/x86_64/http-parser-2.7.1-3.el7.x86_64.rpm && yum -y install nodejs npm

#install uwsgi
RUN pip install uwsgi

RUN pip install --upgrade pip && pip install uwsgitop

COPY server/requirements.txt /tmp/requirements.txt

RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY . /srv/www/portal
#RUN mkdir -p /srv/www/project

WORKDIR /srv/www/portal/server

#RUN npm install

# RUN python manage.py collectstatic -c --traceback --noinput
