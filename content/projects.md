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
  - topics: comma, separated, labels
  - visibility: Public | Internal  (optional — inferred from link)
  - link: https://…     (optional — repository or project URL)

  Description paragraph.
-->

## Decnique
- pinned: true
- visibility: Public
- start: 2026-08
- end: now
- topics: detection-engineering, dsl, geometry, SMT, sigma, elastic, panther
- link: https://github.com/moabid42/decnique

Designed and built a formal language and evaluation framework for measuring SIEM detection coverage against adversarial techniques over a common event model using nothing but pure math.

## IAMouflage
- start: 2026-05
- end: 2026-08
- topics: detections, TTPs, IAM, GCP
- link: https://github.com/moabid42/IAMouflage

Designed and built a detection-to-technique visualization using Neo4j, mapping methodName (detection) to permission (technique) for better visibility during red teaming.

## Verisentinel
- topics: python, GCP, IAM, llm, SMT, red-team
- link: https://github.com/moabid42/Verisentinel

Experimental GCP IAM decision-support tool that checks language-model proposals against permission feasibility and modeled detection coverage before presenting actions for human approval.

## mals3scan
- pinned: true
- visibility: Public
- topics: aws, lambda, yara, terraform
- link: https://github.com/moabid42/mals3scan

Serverless AWS security pipeline that scans every file uploaded to S3 with YARA rules for malware and sensitive data, firing real-time alerts for incident response.

## GCPdvi
- topics: GCP, IAM, terraform, red-team, security-lab
- link: https://github.com/moabid42/GCPdvi

Deliberately vulnerable GCP IAM training lab defined in Terraform, with five identities linked by progressively harder, keyless privilege-escalation paths.

## L3AK CTF 2025 Infra
- pinned: true
- visibility: Internal
- org: L3AK TEAM
- start: 2025-04
- end: 2025-07
- topics: gcp, cloud-architecture, distributed-systems, caching, high-load, monitoring

Designed and built the infrastructure hosting the L3AK CTF 2025 event on GCP, handling more than 10k concurrent users and millions of requests.

## redteam-copilot
- pinned: true
- visibility: Internal
- topics: llm, red-team, automation

A GCP IAM red-teaming harness, with a deterministic propose-then-verify architecture.

## anti-debug
- topics: C, assembly, linux, reverse-engineering
- link: https://github.com/moabid42/anti-debug

Experimental Linux anti-debugging research using ptrace, a modified libc, and syscall remapping to explore hook-oriented programming.

## CoGraph
- topics: python, neo4j, knowledge-graph, red-team, llm
- link: https://github.com/moabid42/CoGraph

Red-team knowledge graph prototype combining structured security datasets with an LLM extraction pipeline and graph-based retrieval.

## AI-Dilemma
- topics: ai, llm, red-team, research
- link: https://github.com/moabid42/AI-Dilemma

Research on AI red and blue teaming, with a Typst paper and a notebook prototype for classifying prompt intent and selecting security policy actions.

## ft_containers
- org: 42 Heilbronn
- topics: C++, data-structures, algorithms, stl
- link: https://github.com/moabid42/ft_containers

Reimplemented C++ STL vector and map containers, including iterators, allocator handling, and a red-black tree, with comparison tests against the standard library.

## readelf
- topics: C, elf, binary-analysis, systems
- link: https://github.com/moabid42/readelf

ELF inspection tool written in C, with separate parsers for 32-bit and 64-bit binaries and their headers.

## ft_minishell
- org: 42 Heilbronn
- start: 2022-06
- end: 2022-09
- topics: multiprocessing, compiler-design, formal-languages
- link: https://github.com/moabid42/shell

Designed and built my own shell in pure C.

## ft_IRC
- org: 42 Heilbronn
- start: 2022-10
- end: 2022-11
- topics: networking, C
- link: https://github.com/moabid42/mini_IRC

Designed and built an IRC server in pure C++.

## libasm
- org: 42 Heilbronn
- topics: assembly, x86-64, libc, systems
- link: https://github.com/moabid42/libasm

Recreated basic libc functions in x86-64 assembly, including string operations, memory duplication, and read/write wrappers.

## philo
- org: 42 Heilbronn
- topics: C, concurrency, threads, synchronization
- link: https://github.com/moabid42/philo

Dining philosophers simulation in C using threads and mutexes to coordinate shared forks, meal timing, and termination.

## cyberdayCTF
- org: 42 Heilbronn
- topics: ctf, education, docker, python, web-security
- link: https://github.com/moabid42/cyberdayCTF

Public Cybersecurity Day CTF challenges, solutions, and container launch scripts spanning web, cryptography, forensics, pwn, reversing, and geolocation.

## L3AK CTF 2024 Infra
- org: L3AK TEAM
- start: 2024-04
- end: 2024-05
- topics: distributed-systems, caching, high-availability, system-monitoring

Developed the infrastructure hosting the L3AK CTF 2024 event, handling more than 1k concurrent users with zero downtime.

## Landing Graph
- start: 2026-09
- end: now
- topics: react, ui/ux
- link: https://github.com/moabid42/landing-graph

Designed and built my own personal blog based on "git log --graph --all".

## bounties
- org: ETHGlobal Prague
- topics: solidity, blockchain, vlayer, bug-bounty
- link: https://github.com/moabid42/bounties

Hackathon prototype for verifying bug bounty award emails with vlayer and recording on-chain badges and researcher reputation.
