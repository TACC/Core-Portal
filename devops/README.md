### Local Development Deployment

* **requirements**
    * vagrant
    * centos image (bento/centos-7.3)
        * ``` $ vagrant box add bento/centos-7.3```
    * git-crypt key
        * ask your team members on slack for the portal_crypt.key file
        * place the file in the root directory for this repo
            * which is one directory below this devops directory

* **deploy**
    * ``` $ vagrant up```
