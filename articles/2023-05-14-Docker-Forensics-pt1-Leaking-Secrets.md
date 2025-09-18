---
title: Docker Forensics pt.1 - Leaking Secrets
author: anthony
date: 2023-05-14 10:30:00 -400
categories: [docker,image_forensics]
tags: [image_forensics,docker,security]
---
# Docker Forensics pt.1 - Leaking Secrets
May 14, 2023

With so many applications and services becoming rapidly “containerized” there are bound to be mistakes made during the process. Developers are oftentimes ordered by their organizations to deploy their once monolithic applications with Docker and Kubernetes. Those same developers are rarely versed in Docker deployments and security-related topics as their area of expertise is writing code. This oversight can lead to the mishandling of secrets such as passwords, api keys, or other sensitive or proprietary information. Malicious actors or other prying eyes could use this information to ruin a company’s or individual contributor’s day.

This is the first article in the “Deepdive into Docker Forensics” collection. We will be discussing how secrets can be leaked in a finalized Docker image.

## How Secrets can get Leaked:

Adding some quick context, a single stage Dockerfile (I may have made that term up in this context but I’m not sure) build pattern goes a bit like this:

(notice the single FROM statement)
```Dockerfile
FROM base image from docker repo
# add your source code
RUN your source code
# do your thing...
```

A multi-stage dockerfile build pattern would look something like this:

```Dockerfile
FROM base image from docker repo
# add your source code
RUN your source code
# do your thing...

FROM another base image
RUN code from the previous build stage
# do your thing...
```

Notice the multiple FROM statements in the second example. Using the multi-stage build pattern you only need to run the “docker build” command on your local system to build your images rather than using a separate build script stored in your source code like in the first example. The end result of the multi-stage dockerfile is typically a lightweight and compact Docker image. Here is a great article where you can ([learn more about multi-stage docker builds](https://docs.docker.com/build/building/multi-stage/)).

Now that all that is out of the way, leaking secrets in a single-stage Dockerfile is really quite easy to do. Typically when writing a Dockerfile you need to include arguments (ARG) that can be used while building the image and set persistent environment variables (ENV) for use during build time and after the image is built. ENV is mainly meant to provide default values for future environment variables that can be accessed by running dockerized applications. In this article we will be targeting ENVs for stealing secrets.

Secure coding practices prohibit developers from committing secrets like api keys and passwords to code repositories. So, hardcoding secrets needed in dockerfiles is out of the question. To get around this, many organizations utilize concepts like the CI/CD pipeline and tools like ([Hashicorp vault](https://www.vaultproject.io/)) to handle their secrets and inject them dynamically when their code is being built. When using a tool like Hashicorp vault you would reference stored secrets in a similar way to bash variables. This pattern is really simple and can work great, however, I would consider it taking the easy way out when it comes to working with secrets.

## Leaky Dockerfile Example:

I created a simple single-stage dockerfile below. It is built on amazonlinux:2 and installs any available OS updates. It then sets an argument and a persistent environment variable. The persistent environment variable takes the value passed to it from the argument (ARG) in the previous line which got the value from an environment variable I set on my local system (I am simulating using a tool like Hashicorp vault in this example). I passed the environment variable I set locally to the ARG in the dockerfile directly in the build command ```docker build -t aws-args-test -f Dockerfile . --build-arg TEST_ARG=${TEST_SECRET}```.

```Dockerfile
# Pull base image
FROM amazonlinux:2

# Install OS Updates
RUN yum update -y

# Adding test args
ARG TEST_ARG
ENV TEST_ENV=${TEST_ARG}
```

I ran the image and jumped into a persistent terminal to see if my test secret argument was present. As you can see in the terminal output below, ARGs are not present in the final image while ENVs remain persistent after the build even though they were not explicitly defined or hardcoded in the dockerfile. In this example, you would need to set the ARG during build time in order to dynamically set the persistent ENV variable.

```Terminal
$ docker run -ti aws-args-test
bash-4.2# env
HOSTNAME=9aa00022b962
TERM=xterm
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
PWD=/
SHLVL=1
HOME=/root
TEST_ENV=thisisareallysecretmessage
_=/usr/bin/env
bash-4.2# exit
```

## Docker History Command:

Malicious actors or other prying eyes can then run a simple “docker history” command to spill the secrets. This command will show all the steps taken to build the image. Since the dockerfile provides step-by-step build instructions it's hard to hide what exactly went into a finalized image.

```Terminal
$ docker history aws-args-test
IMAGE          CREATED              CREATED BY                                      SIZE      COMMENT
782f341be8eb   About a minute ago   ENV TEST_ENV=thisisareallysecretmessage         0B        buildkit.dockerfile.v0
<missing>      About a minute ago   ARG TEST_ARG                                    0B        buildkit.dockerfile.v0
<missing>      About a minute ago   RUN /bin/sh -c yum update -y # buildkit         333MB     buildkit.dockerfile.v0
<missing>      38 hours ago         /bin/sh -c #(nop)  CMD ["/bin/bash"]            0B        
<missing>      38 hours ago         /bin/sh -c #(nop) COPY dir:7a824a76678fb4ef1…   165MB   
```

In the above “docker history” output you would read each line from the bottom of the output up. So the bottom two lines would signify the instructions used to build the amazonlinux:2 image I pulled in as the base image of this example. The middle line shows the yum update command I ran, and the first two lines show that I set an ARG and an ENV variable.

This build behavior can be very dangerous in an organization especially if it is introduced in internal documentation or by inexperienced developers. If I were in a position to conduct "investigations" on dockerfiles or containerized applications I would first take a look at the dockerfile itself. If I saw evidence that the dockerfile contained interesting persistent environment variables then I would consider dumping those variables using the method detailed above.

## Wrapping up

In conclusion, a developer inexperienced in how secrets are handled in dockerfiles can easily leak sensitive information. The examples in this article would be considered low hanging fruit when investigating a docker image or containerized application. However, this mistake can still be made by even the most sophisticated organizations.
