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
# RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -
RUN yum -y install nodejs12

#install uwsgi
RUN pip install uwsgi

# RUN pip install --upgrade pip && pip install uwsgitop
RUN pip install --upgrade pip
RUN pip install uwsgitop==0.10

COPY server/requirements.txt /tmp/requirements.txt

RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY . /srv/www/portal
#RUN mkdir -p /srv/www/project

RUN mkdir -p /var/log/portal

WORKDIR /srv/www/portal/server

#RUN npm install

#RUN python manage.py collectstatic -c --traceback --noinput
