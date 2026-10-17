# Projects

<!--
Add a project as a "## Title" block with fields and a description.
All entries appear on the Projects page. Only entries with pinned: true
appear in Pinned, in the order written here (the first two on the README).
Projects follow the order written here; put the strongest work first.
Dates are optional and do not affect the display order.

  ## Project title
  - pinned: true       (optional — omit or use false to leave it unpinned)
  - org: Context
  - start: YYYY-MM     (optional)
  - end: YYYY-MM       (optional — use "now" while ongoing)
  - date: YYYY-MM      (OR: a single date; replaces start/end)
  - updated: YYYY-MM-DD (optional — last project/repository update)
  - domains: cloud-security, offensive-security
  - technologies: python, gcp
  - topics: iam, attack-planning
  (Use IDs from src/taxonomy.js; each category filters independently.)
  - visibility: Public | Internal  (optional — inferred from link)
  - link: https://…     (optional — repository or project URL)

  Description paragraph.
-->

## Decnique
- pinned: true
- visibility: Public
- start: 2026-08
- end: now
- domains: cloud-security
- technologies: python, sigma, elastic, panther
- topics: detection-engineering, formal-methods
- updated: 2026-10-01
- link: https://github.com/moabid42/decnique

Designed and built a formal language and evaluation framework for measuring SIEM detection coverage against adversarial techniques over a common event model using nothing but pure math.

## IAMouflage
- start: 2026-05
- end: 2026-08
- domains: cloud-security, offensive-security
- technologies: go, gcp, neo4j
- topics: iam, detection-engineering, attack-modeling
- updated: 2026-08-27
- link: https://github.com/moabid42/IAMouflage

Designed and built a detection-to-technique visualization using Neo4j, mapping methodName (detection) to permission (technique) for better visibility during red teaming.

## Verisentinel
- domains: cloud-security, offensive-security
- technologies: python, gcp, z3
- topics: iam, attack-planning, privilege-escalation, formal-methods, language-models
- updated: 2026-09-03
- link: https://github.com/moabid42/Verisentinel

Experimental GCP IAM decision-support tool that checks language-model proposals against permission feasibility and modeled detection coverage before presenting actions for human approval.

## mals3scan
- pinned: true
- visibility: Public
- domains: cloud-security
- technologies: aws, python, terraform, yara
- topics: detection-engineering, malware-detection
- updated: 2026-09-03
- link: https://github.com/moabid42/mals3scan

Serverless AWS security pipeline that scans every file uploaded to S3 with YARA rules for malware and sensitive data, firing real-time alerts for incident response.

## GCPdvi
- domains: cloud-security, offensive-security
- technologies: gcp, terraform
- topics: iam, privilege-escalation
- updated: 2026-07-18
- link: https://github.com/moabid42/GCPdvi

Deliberately vulnerable GCP IAM training lab defined in Terraform, with five identities linked by progressively harder, keyless privilege-escalation paths.

## L3AK CTF 2025 Infra
- pinned: true
- visibility: Internal
- org: L3AK TEAM
- start: 2025-04
- end: 2025-07
- domains: infrastructure
- technologies: gcp
- topics: distributed-systems, high-availability, caching

Designed and built the infrastructure hosting the L3AK CTF 2025 event on GCP, handling more than 10k concurrent users and millions of requests.

## redteam-copilot
- pinned: true
- visibility: Internal
- domains: cloud-security, offensive-security
- technologies: gcp
- topics: iam, attack-planning, language-models

A GCP IAM red-teaming harness, with a deterministic propose-then-verify architecture.

## anti-debug
- domains: offensive-security, systems-programming
- technologies: c, assembly, linux
- topics: anti-debugging, reverse-engineering
- updated: 2024-03-12
- link: https://github.com/moabid42/anti-debug

Experimental Linux anti-debugging research using ptrace, a modified libc, and syscall remapping to explore hook-oriented programming.

## CoGraph
- domains: offensive-security
- technologies: python, neo4j
- topics: knowledge-graphs, attack-modeling, language-models
- updated: 2026-04-20
- link: https://github.com/moabid42/CoGraph

Red-team knowledge graph prototype combining structured security datasets with an LLM extraction pipeline and graph-based retrieval.

## AI-Dilemma
- domains: ai-security
- technologies: python
- topics: red-teaming, threat-modeling, prompt-injection, language-models
- updated: 2026-03-11
- link: https://github.com/moabid42/AI-Dilemma

Research on AI red and blue teaming, with a Typst paper and a notebook prototype for classifying prompt intent and selecting security policy actions.

## ft_containers
- org: 42 Heilbronn
- domains: systems-programming
- technologies: cpp
- topics: data-structures, memory-management
- updated: 2023-01-27
- link: https://github.com/moabid42/ft_containers

Reimplemented C++ STL vector and map containers, including iterators, allocator handling, and a red-black tree, with comparison tests against the standard library.

## readelf
- domains: systems-programming, offensive-security
- technologies: c, linux
- topics: binary-formats, reverse-engineering
- updated: 2023-10-10
- link: https://github.com/moabid42/readelf

ELF inspection tool written in C, with separate parsers for 32-bit and 64-bit binaries and their headers.

## ft_minishell
- org: 42 Heilbronn
- start: 2022-06
- end: 2022-09
- domains: systems-programming
- technologies: c, linux
- topics: parsing, concurrency
- updated: 2023-10-10
- link: https://github.com/moabid42/shell

Designed and built my own shell in pure C.

## ft_IRC
- org: 42 Heilbronn
- start: 2022-10
- end: 2022-11
- domains: systems-programming
- technologies: cpp
- topics: networking, concurrency
- updated: 2023-05-02
- link: https://github.com/moabid42/mini_IRC

Designed and built an IRC server in pure C++.

## libasm
- org: 42 Heilbronn
- domains: systems-programming
- technologies: assembly, linux
- topics: memory-management, system-calls
- updated: 2023-10-10
- link: https://github.com/moabid42/libasm

Recreated basic libc functions in x86-64 assembly, including string operations, memory duplication, and read/write wrappers.

## philo
- org: 42 Heilbronn
- domains: systems-programming
- technologies: c, linux
- topics: concurrency
- updated: 2022-08-08
- link: https://github.com/moabid42/philo

Dining philosophers simulation in C using threads and mutexes to coordinate shared forks, meal timing, and termination.

## cyberdayCTF
- org: 42 Heilbronn
- domains: offensive-security, application-security
- technologies: python, docker
- topics: security-education, binary-exploitation
- updated: 2025-03-04
- link: https://github.com/moabid42/cyberdayCTF

Public Cybersecurity Day CTF challenges, solutions, and container launch scripts spanning web, cryptography, forensics, pwn, reversing, and geolocation.

## L3AK CTF 2024 Infra
- org: L3AK TEAM
- start: 2024-04
- end: 2024-05
- domains: infrastructure
- topics: distributed-systems, high-availability, caching

Developed the infrastructure hosting the L3AK CTF 2024 event, handling more than 1k concurrent users with zero downtime.

## Landing Graph
- start: 2026-09
- end: now
- domains: web-development
- technologies: javascript, react
- topics: content-publishing
- updated: 2026-10-12
- link: https://github.com/moabid42/landing-graph

Designed and built my own personal blog based on "git log --graph --all".

## bounties
- org: ETHGlobal Prague
- domains: application-security
- technologies: solidity, vlayer
- topics: cryptographic-proofs
- updated: 2025-06-01
- link: https://github.com/moabid42/bounties

Hackathon prototype for verifying bug bounty award emails with vlayer and recording on-chain badges and researcher reputation.
