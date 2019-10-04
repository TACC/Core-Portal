FROM centos:7

LABEL maintainer="TACC-ACI-WMA <wma_prtl@tacc.utexas.edu>"

EXPOSE 8000

# upgrade
RUN yum upgrade -y

# add EPEL repo and install python3
RUN yum install -y epel-release && yum install -y python36 python36-devel
# install pip3
RUN python3 -m ensurepip

RUN yum install -y gcc unzip wget git vim nfs-utils libsemanage-python postgresql-devel --enablerepo=epel
RUN yum groupinstall -y 'Development Tools' && yum clean all

# ENV PYTHON_VERSION "3.7.4"
# RUN curl -SLO https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz \
#     && tar xvf Python-${PYTHON_VERSION}.tgz \
#     && cd Python-${PYTHON_VERSION} \
#     && ./configure --prefix=/usr/local \
#     #--enable-optimizations
#     && make \
#     && make altinstall \
#     && cd / \
#     && rm -rf Python-${PYTHON_VERSION}*
# ENV PATH "/usr/local/bin:${PATH}"

# install nodejs
RUN curl -sL https://rpm.nodesource.com/setup_12.x | bash -
RUN yum -y install nodejs

COPY server/requirements.txt /tmp/requirements.txt

RUN pip3 install --upgrade pip setuptools wheel \
    && pip3 install uwsgi \
    && pip3 install uwsgitop \
    && pip3 install -r /tmp/requirements.txt

COPY . /srv/www/portal

RUN mkdir -p /var/log/portal

WORKDIR /srv/www/portal/server

#RUN npm install

#RUN python manage.py collectstatic -c --traceback --noinput
