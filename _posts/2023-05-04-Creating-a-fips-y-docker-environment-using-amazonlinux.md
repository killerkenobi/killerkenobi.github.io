---
title: Creating a fips-y docker environment using amazonlinux
author: anthony
date: 2023-05-04 20:30:00 -400
categories: [docker,compliance]
tags: [aws,compliance,docker]
---
# Creating a fips-y docker environment using amazonlinux v2
May 04, 2023

If you are a security professional working for a public or private company with U.S. government contracts then chances are you have done compliance work at some point in your career. You have also probably heard of compliance framework examples like NIST, CIS, PCI, and FedRAMP. I frequently work with docker and kubernetes and have recently started deep-diving into FedRAMP compliance on that platform. I ran into a niche issue that I would like to shed some light on and hopefully guide others through as well.

I should start with a brief synopsis of what FedRAMP is. FedRAMP is a standard that the U.S. government uses to certify that resources used by the government and any 3rd party contractors meet certain data protection requirements. Ensuring data is protected by FIPS (Federal Information Processing Standard) 140-2  and 140-3 lies at the core of FedRAMP. FIPS is a set of cryptographic standards created by NIST to ensure a given system can effectively protect sensitive data.

Unfortunately, a major challenge arises from forcing private companies to implement FedRAMP and other similar compliance standards. For lack of better words, FIPS 140-2 is old but still valid. FIPS 140-2 was made in 2001 by NIST but will remain valid until 2026 ([FIPS Wiki](https://en.wikipedia.org/wiki/FIPS_140-2)). So how can the U.S. government expect a private company to maintain classic services while also developing and using new technology? Personally, it's been a bit of a challenge, but not impossible. A benefit to creating docker images and production environments with FIPS in mind is that some security burden is taken off the developers. It also lets the security organization have a little more control over the final architecture of an app or service running on kubernetes infrastructure. However, developers will still need to build on top of the FIPS baseimage so it can't be too locked down.

I have noticed that creating FIPS-ready docker container images can sometimes be clumsy. And the effects of forcing developers to build on those docker images has yet to be seen (that would probably be a good followup article). However, there's no way around a FedRAMP certification if you want government contacts.

But enough of my opinion, here is some work I have done with making docker container images FIPS-y.

## FIPS at the Container Level:

You should aim to create Docker images that are as lean as possible. Your docker images will be ephemeral; they can be terminated and spun back up with no problems and at any time. Here is my Dockerfile I have been experimenting with (it still needs some work but the overall principle is sound…)

```Dockerfile
# Pull base image
FROM amazonlinux:2

# Install OS Updates
RUN yum update -y

# Install fips packages
RUN yum install -y dracut-fips openssl \
    && yum clean all \
    && rm -rf /var/cache/yum

# Set variable to force openssl to use fips
ENV OPENSSL_FIPS=1

# Create user and group
RUN groupadd -r testUser && useradd -r -g testUser testUser
USER testUser
WORKDIR /home/testUser
```
My baseimage is built on AmazonLinux v2. All I did in the Dockerfile was update the OS and install dracut-fips and the openssl modules. I then cleaned up my install and set an environment variable that forces the openssl module to use the FIPS crypto libraries. Finally, I created a group and a user called testUser (you would change this name to anything you wanted) to avoid running the final image as root. This is a best practice as no docker applications should run with root privileges.

```terminal 
$ docker build -t aws-fips-test -f Dockerfile .
[+] Building 0.7s (9/9) FINISHED                                                                                                                                         
 => [internal] load build definition from Dockerfile                                                                                                                0.0s
 => => transferring dockerfile: 37B                                                                                                                                 0.0s
 => [internal] load .dockerignore                                                                                                                                   0.0s
 => => transferring context: 2B                                                                                                                                     0.0s
 => [internal] load metadata for docker.io/library/amazonlinux:2                                                                                                    0.6s
 => [1/5] FROM docker.io/library/amazonlinux:2@sha256:3385565b4b75c4f15fd59a5dd7e4510ac5ad4b1825df9deed6be6af1092c8829                                              0.0s
 => CACHED [2/5] RUN yum update -y                                                                                                                                  0.0s
 => CACHED [3/5] RUN yum install -y dracut-fips openssl     && yum clean all     && rm -rf /var/cache/yum                                                           0.0s
 => CACHED [4/5] RUN groupadd -r testUser && useradd -r -g testUser testUser                                                                                        0.0s
 => CACHED [5/5] WORKDIR /home/testUser                                                                                                                             0.0s
 => exporting to image                                                                                                                                              0.0s
 => => exporting layers                                                                                                                                             0.0s
 => => writing image sha256:df6130e99298a5d6e00ca12f6f4ac506d60ac616042005720f505e550845d80c                                                                        0.0s
 => => naming to docker.io/library/aws-fips-test  
```
## Testing the Base Container:

After building the image I ran it using "docker run" and hopped into a terminal to prove that FIPS was enabled. I validated fips was installed and working by running the below commands. Also note I am running those commands as the testUser created earlier and do not have root privileges as expected.

```terminal
$ docker run -it aws-fips-test
                
bash-4.2$ pwd
/home/testUser
bash-4.2$ openssl version
OpenSSL 1.0.2k-fips  26 Jan 2017
bash-4.2$ openssl sha
Error setting digest sha
139725041981344:error:060800A3:digital envelope routines:EVP_DigestInit_ex:disabled for fips:digest.c:256:
bash-4.2$ openssl md5
Error setting digest md5
140241156331424:error:060800A3:digital envelope routines:EVP_DigestInit_ex:disabled for fips:digest.c:256:
bash-4.2$ curl -V
curl 7.88.1 (x86_64-koji-linux-gnu) libcurl/7.88.1 OpenSSL/1.0.2k-fips zlib/1.2.7 libidn2/2.3.0 libssh2/1.4.3 nghttp2/1.41.0
Release-Date: 2023-02-20
Protocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: alt-svc AsynchDNS GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM NTLM_WB SPNEGO SSL threadsafe UnixSockets
bash-4.2$ yum list installed | grep fips
ovl: Error while doing RPMdb copy-up:
[Errno 13] Permission denied: '/var/lib/rpm/.rpm.lock'
dracut-fips.x86_64                     033-535.amzn2.1.6             @amzn2-core
```
By executing the "openssl version" command I was able to confirm openssl recognized the installed FIPS packages. To make sure openssl will actually use the FIPS packages I tried to run openssl with a crypto library not supported by the FIPS standard (sha and md5 in this example). I then ran "curl -V" to confirm that another tool would recognize the FIPS packages. Finally, I confirmed the FIPS packages were installed using "yum list" (note my user does not have root as is suggested by the "permission denied" error).

The simple tests I ran in the code block above can be transfered over to a pipeline.yaml file and run in a separate test stage or during the build stage itself (this would be a great follow-up article). You could also create a script that could be quickly run on the image from your local CLI. The only challenge for running these tests on a pipeline would be to ensure you have a running container and are actually exectuting the test commands on that running container. It would also be a good idea to use a tool capable of scanning docker images for vulnerabilities.

## Working with the FIPS Base Container:
Ideally, a dev team would be pulling the FIPS base container from Docker Hub or an interal container registry and building their application on top of it. In that case the dev team might need to install additional packages and run scripts that would require root privileges. I have created an example dockerfile to help highlight a potential process for developing on the FIPS docker base image.

```Dockerfile
FROM the FIPS base image tag you create

###
# If you need to install additional packages..
###

# Switch to the root user to build your custom image
USER root

# Install additional packages as needed
RUN install commands that require root

# Switch back to the non-root user as a container security best practice
USER testUser
```

I hope I was able to provide some guidance on making docker container images FIPS compliant. Thanks for reading!

----------------
*Also, May the fourth be with you :)* 

```
            .-.
           |o,o|
        ,| _\=/_      .-""-.
        ||/_/_\_\    /[] _ _\
        |_/|(_)|\\  _|_o_LII|_
           \._./// / | ==== | \
           |\_/|"` |_| ==== |_|
           |_|_|    ||" ||  ||
           |-|-|    ||LI  o ||
           |_|_|    ||'----'||
          /_/ \_\  /__|    |__\
```