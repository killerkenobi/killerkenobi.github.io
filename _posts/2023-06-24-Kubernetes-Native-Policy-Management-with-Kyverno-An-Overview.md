---
title: Kubernetes Native Policy Management with Kyverno - An Overview
author: anthony
date: 2023-06-24 5:20:00 -400
categories: [kyverno,kubernetes]
tags: [kyverno,kubernetes,open-source]
---
June 24, 2023

## The Kubernetes Security Problem
While working with Kubernetes, I have come across several tools claiming to solve the various security issues that plague containerized environments. All of the tools I have been exposed to (like image or vulnerability scanners built into a CI/CD pipeline) are great at finding issues after they become issues. This reactive capability to security concerns is simply not good enough in a constantly evolving setting like a Kubernetes node.

When running a business guided by agile development principles developers are expected to build and deploy smaller units of the overall project quickly, typically in two week sprints. In a Kubernetes environment developers have very few guardrails to keep them from deploying insecure code or applications. Think of it like building a pillow fort with all the couch cushions while your parents aren't home. You basically can do whatever you want.

Now think about the consequences to letting developers deploy whatever they want to a containerized space. Supply chain attacks are a real threat to organizations that develop in an agile manner. This threat can be distilled even further to the Kubernetes level where attackers can poison 3rd party images or dependencies that developers inadvertently pull into their organization’s ecosystem.

## An Intro to Kyverno
Speaking from experience, security teams find it difficult to enforce security best practices in a Kubernetes environment. Like I mentioned earlier, there are plenty of reactive tools out there, but very few effective proactive tools. Luckily, I have started working with a fantastic proactive security tool called Kyverno.

Straight from its own website, Kyverno is a policy engine for Kubernetes. Think of Kyverno like the parents who have just come home to make you clean up your pillow fort, and they aren't going anywhere for a while. In more technical terms, Kyverno gives security teams the ability to implement and enforce Kubernetes policies. A policy in Kubernetes is simply a defined configuration that can manage other configurations or alter behaviors of a target resource during runtime.

You can visit the [Kyverno website](https://kyverno.io/) or check out [Kyverno's GitHub](https://github.com/kyverno/kyverno/).

You can use Kyverno policies to validate, mutate, generate, and cleanup Kubernetes resources, and verify image signatures and artifacts to help secure the software supply chain. In my experience, Kyverno is the nuclear option. You can choose to set a Kyverno policy to Audit or Enforce. In Audit mode Kyverno would generate logs which would tell the Kubernetes administrator which workloads are violating the policy. In Enforce mode, Kyverno would still generate the same audit logs, however, it would also block any unwanted runtime behaviors on the cluster. This could prevent services from starting or new pods from spawning depending on your specific policy. Basically, if you set a Kyverno policy to Enforce, it will lay down the law so be very careful.

## Overview of How Kyverno Works
Kyverno runs as a [dynamic admission controller](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) on a Kubernetes cluster. So, Kyverno is installed and runs on a given cluster. Under the hood, Kyverno utilizes two main Kubernetes API endpoints (handled by the cluster’s API server), the ValidatingWebhookConfiguration and the MutatingWebhookConfiguration. See the high-level architecture diagram below to view the data flow of a Kubernetes API request through Kyverno.

![Kyverno Architecture](https://kyverno.io/images/kyverno-architecture.png 'Image from kyverno.io')

The ValidatingWebhookConfiguration item will approve or reject a given Kubernetes API request based on the logic outlined in the Kyverno policy. The MutatingWebhookConfiguration item will modify the Kubernetes API request based on the Kyverno policy (it can add or subtract data from the API request to avoid rejection from the validation webhook). So Kyverno relies on Kubernetes events to function. For more information check out the [Kyverno Introduction page](https://kyverno.io/docs/introduction/).

Kyverno is an open-source tool with a great amount of community support. The Kyverno developers were kind enough to provide many example policies that are easy to implement. You can find these [example policies here](https://kyverno.io/policies/). When it comes to writing and applying policies, I would recommend modifying an existing policy from the link provided and adding information specific to your environment (more on this topic later). There is no need to reinvent the wheel in most cases. 

The devs working on Kyverno also provided a CLI tool that can be used to test policy behavior prior to deploying it to a cluster. Think of this like unit testing where you are responsible for writing your own test cases. You can check out the Kyverno CLI or you can use the online Kyverno Playground to test out policies.

## Final Thoughts
As you can see, Kyverno is an extremely powerful tool that is capable of implementing and enforcing security best practices at the deepest layers of Kubernetes. Kyverno also provides some great documentation to get you started. As this was simply an introductory article on this topic, I will have several more blog posts going over the specifics of developing, testing, and implementing Kyverno policies so stay tuned.
