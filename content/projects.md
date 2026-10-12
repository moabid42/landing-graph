# Projects

<!--
Add a project as a "## Title" block with fields and a description.
All entries appear on the Projects page. Only entries with pinned: true
appear in Pinned, in the order written here (the first two on the README).
Dates are optional; dated projects sort newest first in the archive.

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

## mals3scan
- pinned: true
- visibility: Public
- topics: aws, lambda, yara, terraform
- link: https://github.com/moabid42/mals3scan

Serverless AWS security pipeline that scans every file uploaded to S3 with YARA rules for malware and sensitive data, firing real-time alerts for incident response.

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

## ft_minishell
- org: 42 Heilbronn
- start: 2022-06
- end: 2022-09
- topics: multiprocessing, compiler-design, formal-languages
- link: https://github.com/moabid42/shell

Designed and built my own shell in pure C.

## ft_cube3D
- org: 42 Heilbronn
- start: 2022-09
- end: 2022-09
- topics: raycasting, C, computer-graphics
- link: https://github.com/moabid42/42cub3D

Designed and built a Half-Life game clone using only the mlx C library.

## ft_IRC
- org: 42 Heilbronn
- start: 2022-10
- end: 2022-11
- topics: networking, C
- link: https://github.com/moabid42/mini_IRC

Designed and built an IRC server in pure C++.

## ft_transcendence
- org: 42 Heilbronn
- start: 2023-01
- end: 2023-03
- topics: gamedev, gRPC, websockets
- link: https://github.com/williamollio/ft_transcendence

Designed and built a ping-pong game with real-time matchmaking and chat.

## L3AK CTF 2024 Infra
- org: L3AK TEAM
- start: 2024-04
- end: 2024-05
- topics: distributed-systems, caching, high-availability, system-monitoring

Developed the infrastructure hosting the L3AK CTF 2024 event, handling more than 1k concurrent users with zero downtime.

## IAMouflage
- start: 2026-05
- end: 2026-08
- topics: detections, TTPs, IAM, GCP
- link: https://github.com/moabid42/IAMouflage

Designed and built a detection-to-technique visualization using Neo4j, mapping methodName (detection) to permission (technique) for better visibility during red teaming.

## Landing Graph
- start: 2026-09
- end: now
- topics: react, ui/ux
- link: https://github.com/moabid42/landing-graph

Designed and built my own personal blog based on "git log --graph --all".
