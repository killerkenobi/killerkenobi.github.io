---
title: You Are Compliant but Not Secure
author: anthony
date: 2023-08-05 11:30:00 -400
categories: [opinion,compliance]
tags: [compliance,security]
---
August 05, 2023

If you have ever had to procure a service from a SaaS company as a security professional you have probably been bombarded by sales and marketing tactics centered around security and compliance. For example, companies will be sure to work into their advertising that they are PCI or HIPAA or SOCII compliant either on their website or during a presentation. I have even seen this type of marketing material pushed to direct messages on LinkedIn. All too often people unfamiliar with sales tactics or the security industry will take these compliance certifications at face value without digging further. Such a practice can prove costly in the end.

I recently read a great article from Forbes describing my exact feelings towards compliance audits and their subsequent ‘certifications’. It was written a few years ago by Jeff Capone, but I still think its message rings true. On the surface, the article titled [“Audits Don't Solve Security Problems”](https://www.forbes.com/sites/forbestechcouncil/2020/04/17/audits-dont-solve-security-problems/?sh=572f22601e84) dives into the effectiveness of the EU’s GDPR (General Data Protection Regulation) framework in forcing companies to actually implement defense in depth to pass an audit and avoid insanely large monetary fines for breaches. Looking deeper, the article describes what I have seen many tech companies in the industry doing: the bare minimum to pass an audit.

Security audits for compliance frameworks like PCI and SOCII at tech companies are rear-facing. They focus on what has been done to satisfy controls in the past, not present day concerns. Many compliance frameworks are scoped to a single point in time. Again, they focus too much on a narrow snapshot of a company’s product or practice while completely glossing over blatant misconfigurations or meaningless internal policies.

Auditors seem to push companies through an audit and gladly charge tens of thousands or even hundreds of thousands of dollars for their services. However, they do not seem to enforce nor care about organizations implementing secure data protection measures or security best practices. Some lower tier compliance controls that auditors use to judge a company are satisfied with minimally impactful policies or haphazard solutions. So how can a consumer of a SaaS product buy secure services with any level of confidence? How can that same consumer possibly pass said service onto their consumers?

This is a troubling realization given that companies advertise and use their compliance authorizations to sell services and make money…except those authorizations may not mean anything when you dig a little deeper. Jeff Capone explained perfectly how companies buy and sell potentially insecure products in his Forbes article, 


>
“The organization is solely attempting to gain compliance via a passing audit. The certificate acts as a get-out-of-jail card. If anything goes wrong, the organization says, "But we passed our audit. It's not our fault."
>


I have witnessed such practices first hand at companies I have previously worked for. My efforts on the security team were often dictated by the constant cycle of yearly security audits. When the project managers touted receiving a compliance certification and thus a big win for the company, the security team just groaned and rolled their eyes. We knew what was really checked during that audit, but more importantly, we knew what was missed. And it was scary…

This appears to be an issue for easier to achieve certifications like PCI and SOC. Frameworks like GDPR and FedRAMP are more strictly monitored given that government entities have more rigorous data security needs. Another important metric to consider when talking about compliance enforcement is the size of the penalty if a company is breached. GDPR for example could impose fines in the tens of millions of dollars which could bury most smaller companies, not to mention the erosion of public trust in thier security practices.

Another related issue to achieving weak compliance certifications is that such a practice can corrode the security culture of an organization. For example, auditors simply pushing a company through the motions of an audit could make developers realize they don't really need to patch anything to get authorizations, they just need to say they patch or will patch in the future. Such examples would lead to the security team and the CISO’s word carrying less and less weight in the organization as time goes on.

Ultimately, it is the final customer in the chain of SaaS consumers who suffers due to internal compliance failures and weak auditing. The final customer in this case means an individual without the legal protections enjoyed by companies. Compliance frameworks are a necessary evil in many industries as they are mandatory if the blame for a costly breach is to be shifted. I would eventually like to see a company, or even an entire industry, that utilizes compliance frameworks for good: to identify and highlight necessary security changes needed in the here and now. Using compliance certifications for profit should only get a company so far. Next time you are purchasing a SaaS product ask yourself, is this really secure?
