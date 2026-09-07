---
title: AWSome Security (Shhhhhh !!) (Part 1)
date: 2023-07-14
topics: security, pentesting, penetration-testing, cloud-security, aws
summary: AWS pentesting from an attacker's seat — IAM, credentials, enumeration, and the misconfigurations that hand you the cloud.
source: https://medium.com/@m0ab1d42/awsome-security-shhhhhh-part-1-936f8daaf20b
---

![](./blog/awsome-security-shhhhhh-part-1/01.png)

Picture yourself as a mischievous ninja🃏, tiptoeing through the vast expanse of AWS cloud, leaving security teams scratching their heads and wondering if their code is haunted. Your mission: to expose vulnerabilities, outsmart the mighty firewalls, and rewrite the rules of engagement with a mischievous grin on your face. Oh, the hilarity!

But hold on, my stealthy companion, let’s take a moment to appreciate the intricate maze that is the AWS ecosystem. It’s a perplexing jungle of services, configurations, and enough acronyms to make your head spin faster than a hamster on a wheel. Fear not, for armed with humor and a dash of absurdity, we’ll tame this virtual menagerie.

> “Who needs a cape when you have a keyboard?”

Jokes aside, let’s get serious and dive into some tips that I personally use when doing a Blackbox Pentest, where my goal is to remain undetected by **GuardDuty**. (Or when doing Shady stuff 🤫 Shhhhh!!! That’s our little secret 😉)

![](./blog/awsome-security-shhhhhh-part-1/02.jpg)

## Evading GuardDuty Penetration Test Findings

When performing AWS API requests using common penetration testing operating systems, GuardDuty can detect and trigger a PenTest Finding.

This detection is caused by the **user agent** name included in the API request. By making modifications to this **user agent**, we can prevent GuardDuty from identifying our activities as originating from a “pentest” Linux distribution.

![](./blog/awsome-security-shhhhhh-part-1/03.png)

> **Caution**!!!!  
> If your assessment requires remaining undetected, it is recommended to use a “safe” operating system such as Ubuntu, macOS, or Windows.

To accomplish this, follow these steps:

1.  Locate the **session.py** file within the **botocore** package. For instance, on a default Kali Linux installation, the file can be found at:  
    **/usr/local/lib/python3.7/dist-packages/botocore/session.py**
2.  Open the **session.py** file and navigate to line [**45**](https://github.com/boto/botocore/blob/7de36c07ecec503f588ac27658b1795e83b67b75/botocore/session.py#L457C61-L457C61)**7** (at the time of writing). You will find the following code snippet:

![](./blog/awsome-security-shhhhhh-part-1/04.png)

1.  The functions **platform.system()** and **platform.release()** are similar to the commands “**uname -o**” and “**uname -r**”, respectively.
2.  To bypass detection, modify the code by replacing the existing values with legitimate user agent strings, such as those found in [**Pacu**](https://github.com/RhinoSecurityLabs/pacu/blob/master/pacu/user_agents.txt). This allows you to disguise your user agent to appear as anything you desire, including arbitrary values like the example below:

![](./blog/awsome-security-shhhhhh-part-1/05.png)

## Evading GuardDuty Tor Client Findings

GuardDuty often triggers the high severity finding [**“UnauthorizedAccess:EC2/TorClient”**](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-ec2.html#unauthorizedaccess-ec2-torclient) when an EC2 instance is detected establishing connections with [**Tor Guard**](https://community.torproject.org/relay/types-of-relays/#Guard%20and%20middle%20relay) or Authority nodes. According to the documentation, this finding suggests potential unauthorized access to your AWS resources, aimed at concealing the attacker’s true identity.

> **Side Note:  **
> AWS identifies such connections by comparing them to the public list of Tor nodes using ([**Exonerator**](https://metrics.torproject.org/exonerator.html)). This issue is familiar to those acquainted with the Tor project. Access to the Tor network can be restricted by countries, internet service providers, and other authorities, limiting citizens’ access to the open internet.

From a technical standpoint, the Tor Project has addressed this challenge through the use of [**Bridges**](https://community.torproject.org/relay/types-of-relays/#Bridge).

To accomplish this, follow these steps:

1.  Download the Tor and obfs4proxy binaries. (Check if you package manager have it, if not check their [**main**](https://www.torproject.org/de/download/) website)
2.  [**Obfs4**](https://gitlab.com/yawning/obfs4) is a Pluggable Transport that modifies Tor traffic to communicate with a bridge. Bridges are special nodes that do not disclose themselves like other Tor nodes do. Individuals who would normally have difficulty connecting directly to Tor can instead route their traffic through Bridge nodes. Similarly, we can bypass the Tor Client GuardDuty finding by using bridges.  
    Visit [**bridges.torproject.org**](https://bridges.torproject.org/) to obtain a bridge address.
3.  Create a torrc file with the following contents, ensuring that you fill in the bridge address information you obtained:

```
UseBridges 1
Bridge obfs4 *ip address*:*port* *fingerprint* cert=*cert string* iat-mode=0
ClientTransportPlugin obfs4 exec /bin/obfs4proxy
```

Save the torrc file. You are now ready to connect to the Tor network by executing :

```
tor -f torrc
```

The Socks5 proxy will be available on port 9050 by default, allowing you to establish connections.

## Bypassing Detection of Credential Exfiltration

This paragraph was inspired by this tool : [**SneakyEndpoints**](https://github.com/Frichetten/SneakyEndpoints)

Exploiting AWS environments often involves utilizing techniques like SSRF, XXE, and command injection to steal IAM credentials from the instance metadata service of a target EC2 instance. This enables the execution of AWS API calls within the victim’s account, but it comes with a risk. If these stolen credentials are used outside of the host, such as from a personal laptop, an alert is triggered. GuardDuty has a finding called [**“UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS”**](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html#unauthorizedaccess-iam-instancecredentialexfiltrationoutsideaws) which detects such usage of IAM credentials outside of EC2.

**How to bypass ?**

- The attacker gains access to an EC2 instance
- The attacker dumps the EC2 attached role credentials
- The attacker spawns a cloud shell or an EC2 instance on its own AWS account
- The attacker imports the stolen credentials in its cloud shell or EC2 instance

> **However:**  
> On January 20th, 2022, AWS introduced a new GuardDuty finding called [**“UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.InsideAWS”**](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html#unauthorizedaccess-iam-instancecredentialexfiltrationinsideaws) to address the limitations of the previous finding.

**What does this mean ?**

This new finding detects the usage of IAM credentials from any EC2 instance that does not belong to the same account as the credentials being used. Consequently, simply using one’s own EC2 instance is no longer an option. This addresses a longstanding concern within the cloud security community.

However, there is currently a functioning bypass available — VPC Endpoints. Leveraging VPC Endpoints allows attackers to utilize the stolen IAM credentials from their own EC2 instance without triggering the GuardDuty alert. By routing traffic through VPC Endpoints, attackers can effectively evade detection.

To facilitate the setup process for Penetration Testers and Red Teamers, **SneakyEndpoints** was developed. This project provides all the necessary **Terraform** (I have to write an article about this amazing Infra as Code tool) configurations to quickly establish an attacking environment. It creates an EC2 instance in a private subnet, ensuring no internet access, and sets up multiple VPC Endpoints for use. This setup mitigates the risk of accidentally exposing oneself and triggering the alert.

> **Note:  **
> I recently found that there is another bypass option available, but its usefulness is limited to specific scenarios. The **InstanceCredentialExfiltration** finding is tied to the AWS account rather than the EC2 instance. As a result, if an attacker compromises an EC2 instance in the target account and subsequently compromises other EC2 instances within the same account or steals their IAM credentials, they can safely use those credentials from the initially compromised instance without triggering GuardDuty.

## **For More**

See the talk **“Evading AWS GuardDuty and Network Firewall using Privacy Enhancing tech”** which includes how to use DNS over HTTPS (DoH) and customized VPC & DNS settings to evade network level detection in GuardDuty.

[Evading AWS GuardDuty and Network Firewall using Privacy Enhancing tech fwd:cloudsec](https://pretalx.com/fwd-cloudsec-2022/talk/UMKQU8/)

Creds goes to [**hackingthe.cloud**](https://github.com/Hacking-the-Cloud/hackingthe.cloud)

Thanks For reading ~ ❤️ ~

> Happy Hacking 🧑🏻‍💻

---

*Originally published on [Medium](https://medium.com/@m0ab1d42/awsome-security-shhhhhh-part-1-936f8daaf20b).*
