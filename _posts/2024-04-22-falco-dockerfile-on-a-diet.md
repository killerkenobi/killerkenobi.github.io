---
title: Falco Dockerfile on a Diet
author: anthony
date: 2024-04-24 18:00:00 -400
categories: [docker,falco,efficiency]
tags: [docker,security,dockerfile,docker-optimization]
---
[Falco](https://github.com/falcosecurity/falco) is an open-source tool that can detect and alert on abnormal behavior and potential security threats in real-time. Its large number of configuration options make it so anyone from a single security researcher to a fortune 500 company can deploy Falco to their environment. I have personally been working with the open-source version of Falco for several years and have seen the tool and the community grow so much over that time. So many new features and product offerings have been created and are continuing to be developed.

In this article I want to focus on one part of Falco in particular, specifically the distroless no-driver Docker image that was made available in [0.36.0](https://github.com/falcosecurity/falco/releases/tag/0.36.0). Distroless images are Docker images that only contain elements essential to running a specific application. From a security standpoint, distroless images can be considered "safer" to use in a given environment as there are less dependencies installed on the image to compromise. Furthermore, distroless images are oftentimes easier to patch and maintain as they have a smaller attack surface that you would need to worry about in your production environment.

## What is the Problem and Why Does it Matter?
Based on my observations and use case, the current distroless Falco image needs a little bit more trimming before I would be comfortable deploying it to some of the more sensitive environments I work with. The main issue I have with Falco distroless is that it comes with a package called [falcoctl](https://github.com/falcosecurity/falcoctl). Falcoctl is simply Falco's official CLI tool that would be used to interact with components of the Falco ecosystem (like working with rulesets and OCI registries for example). Falcoctl is prone to vulnerabilities even when built on a distroless OS like [Wolfi](https://www.chainguard.dev/unchained/introducing-wolfi-the-first-linux-un-distro).

At the time of this writing the distroless Falco Docker image comes with the following vulnerabilities. Note that they are all found within the same package, falcoctl. Also note that falcoctl is using a large number of Go packages that are pulled from many different sources.

![falcoctl from Falco upstream](/images/falcoctl-vulns.png)

The presence of these vulnerabilities could introduce a number of problems in a Kubernetes environment. First and foremost, falcoctl is increasing the attack surface of the Falco application which is never good. Also, many of these vulnerabilities have fixes available which should be applied as quickly as possible to maintain a safe product. And from a DevSecOps perspective, falcoctl can cause CI/CD pipelines to fail as fixable vulnerabilities should not be allowed into production.

With all that being said, I am not surprised this is happening. I understand that it would be a challenge for any community to maintain such a large number of dependencies. Just take a look at falcoctl's go.mod file and check out all the [Go packages](https://github.com/falcosecurity/falcoctl/blob/main/go.mod) that are being pulled into one repo to make falcoctl work the way it does. At for-profit companies it is the full-time job of one or more people to track security patches afterall.

## My Proposed Solution
I think falcoctl has a rightful place in the distroless Falco Docker image. Afterall, it is one of the only ways to interact with core components of Falco like rulesets. However, falcoctl requires a connection to the internet to carry out some of its functions, like updating a ruleset on the fly. In more sensitive environments it may not be possible for falcoctl to reach out to the open internet or it may be insecure to do so.

I believe a new, even slimmer, version of the Falco distroless Docker image should be made available. I did some experimenting and came up with the Dockerfile you see below. It is very similar to the upstream Falco distroless Dockerfile, however, the key difference is the following two lines:
```
rm -rf /falco/usr/bin/falcoctl
rm -rf /falco/etc/falcoctl
```
The two lines above delete the directories that contain the falcoctl application code and configurations during the build of the Falco distroless image.

Here is the full Dockerfile:
```
FROM cgr.dev/chainguard/wolfi-base as builder

ARG FALCO_VERSION
ARG VERSION_BUCKET=bin

ENV FALCO_VERSION=${FALCO_VERSION}
ENV VERSION_BUCKET=${VERSION_BUCKET}

RUN apk update && apk add build-base gcc curl ca-certificates jq elfutils

WORKDIR /

RUN FALCO_VERSION_URLENCODED=$(echo -n ${FALCO_VERSION}|jq -sRr @uri) && \
    curl -L -o falco.tar.gz \
    https://download.falco.org/packages/${VERSION_BUCKET}/$(uname -m)/falco-${FALCO_VERSION_URLENCODED}-$(uname -m).tar.gz && \
    tar -xvf falco.tar.gz && \
    rm -f falco.tar.gz && \
    mv falco-${FALCO_VERSION}-$(uname -m) falco && \
    rm -rf /falco/usr/bin/falcoctl && \
    rm -rf /falco/etc/falcoctl && \
    rm -rf /falco/usr/src/falco-*

RUN sed -e 's/time_format_iso_8601: false/time_format_iso_8601: true/' < /falco/etc/falco/falco.yaml > /falco/etc/falco/falco.yaml.new \
    && mv /falco/etc/falco/falco.yaml.new /falco/etc/falco/falco.yaml

FROM cgr.dev/chainguard/wolfi-base

LABEL maintainer="cncf-falco-dev@lists.cncf.io"
LABEL org.opencontainers.image.source="https://github.com/falcosecurity/falco"

LABEL usage="docker run -i -t --privileged -v /var/run/docker.sock:/host/var/run/docker.sock -v /dev:/host/dev -v /proc:/host/proc:ro --name NAME IMAGE"
# NOTE: for the "least privileged" use case, please refer to the official documentation

RUN apk update && apk add libelf libstdc++

ENV HOST_ROOT /host
ENV HOME /root

USER root
COPY --from=builder /falco /

CMD ["/usr/bin/falco", "-o", "time_format_iso_8601=true"]
```

## Benefits of the Proposed Dockerfile
My proposed Dockerfile has several key benefits.

1. The attack surface is decreased.

2. The vulnerability scan comes back completely clean for the distroless image without falcoctl. This is great for organizations that are deploying Falco via a CI/CD pipeline where images are scanned for vulnerabilities. With this slim image it's much easier to maintain Falco in a given environment.
    ![Distroless Falco Image with no vulns](/images/no-falcoctl-vulns.png)

3. The Falco Docker image is even more lightweight which can save on computing resource costs associated with building the image, storing the built image, and running the image in a Kubernetes environment.

## Falco Docker Image Comparison
The upstream Falco distroless image is already very lean. Using Dive I was able to take a look at the final image size and individual layers. Note the image size is 110MB. Also note that falcoctl is present in the upstream distroless image.
![Falco Distroless Upstream](/images/upstream-falco.png)
![Falco image with falcoctl](/images/upstream-falco-falcoctl.png)

Now taking a look at my modified image after removing falcoctl, I was able to significantly reduce the overall image size down to just 50MB. 
![My modified Falco image](/images/falco-image-modified.png)
![Falco image without falcoctl](/images/falco-image-no-falcoctl.png)

## Conclusion
Like I said earlier, I believe falcoctl has a place in a Falco Docker image as it is a core product offering. However, I cannot justify keeping falcoctl in an image knowing it is constantly vulnerable. At the very least there should be a "super slim" Falco image (without falcoclt) available to users who want to run Falco in a sensitive environment or dont use falcoctl. The research I conducted for this article was born out of necessity and I hope it can help someone else out too.

At the time of this writing I had opened a [pull request](https://github.com/falcosecurity/falco/pull/3176) with the Falco community to try and share my research on this topic and introduce a new distroless Falco image that does not contain falcoctl. I have also commented on a Falco community [proposal](https://github.com/falcosecurity/falco/issues/3165) put forth by the lead Falco maintainers.