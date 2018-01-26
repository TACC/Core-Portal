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

#RUN mkdir -p /opt/uwsgi && \
#    curl -SLk -o /opt/uwsgi/uwsgi-2.0.15.tar.gz https://projects.unbit.it/downloads/uwsgi-2.0.15.tar.gz && \
#    tar -xvzf /opt/uwsgi/uwsgi-2.0.15.tar.gz -C /opt/uwsgi && \
#    uwsgi --build-plugin /opt/uwsgi/uwsgi-2.0.15/plugins/zabbix && \
#    mkdir -p /usr/lib/uwsgi/plugins && \
#    mv zabbix_plugin.so /usr/lib/uwsgi/plugins/.

COPY requirements.txt /tmp/requirements.txt

RUN pip install -r /tmp/requirements.txt

#RUN groupadd --gid 816877 G-816877 && \
#    useradd --uid 458981 --gid G-816877 --groups staff -m --shell /bin/bash tg458981

COPY . /srv/www/portal
#RUN mkdir -p /srv/www/project

COPY bin/* /usr/local/bin/

WORKDIR /srv/www/portal

RUN npm install

# RUN python manage.py collectstatic -c --traceback --noinput
