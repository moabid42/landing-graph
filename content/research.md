# Research

<!--
Add a paper as a "## Title" block with fields and a short summary.
All entries appear on the Research page, in the order written here.
Only entries with pinned: true appear on the README, in the same order.

  ## Paper title, as published
  - pinned: true        (optional — omit or use false to leave it unpinned)
  - link: https://…     (required — publication or full-text URL)
  - updated: YYYY-MM-DD (optional — last update)
  - domains: offensive-security
  - languages: c, assembly
  - topics: attack-planning, reconnaissance
  (Use comma-separated IDs from src/taxonomy.js; leave out empty categories.)

  What it found, in a sentence or two, rather than the abstract.
-->

## Recon as a First-Class Planning Action under Partial Observability
- domains: offensive-security
- topics: attack-planning, partial-observability, reconnaissance
- link: https://www.researchgate.net/publication/405230754_Recon_as_a_First-Class_Planning_Action_under_Partial_Observability

Attack-path planners almost all assume they already know the network. Modelling reconnaissance as a planning action with its own OPSEC cost and information gain reaches the goal in 80.3% of randomised Active Directory graphs against 52.3% for a two-phase baseline — but only once the pursuit is directed and multi-step.

## HOP: Hook Oriented Programming
- domains: offensive-security, systems-programming
- languages: c, assembly
- topics: anti-debugging, reverse-engineering
- link: https://www.researchgate.net/publication/396647415_HOP_-Hook_Oriented_Programming

Licence checks fall to debuggers, and anti-debugging in turn falls to whatever an attacker can patch out. HOP is a Linux anti-debugging design that claims the one debugger slot a process is allowed to have, so the protection has to be evicted before a debugger can attach at all.

## RCPRNG: Robust Complete PRNG
- pinned: true
- domains: cryptography
- topics: pseudo-randomness, entropy, formal-methods
- link: https://www.researchgate.net/publication/396647163_RCPRNG_-_Robust_Complete_Pseudo_Random_Number_Generator

Cryptographic PRNG models assume unlimited compute and clean entropy; embedded systems have neither, and there entropy accumulation and generation share the same scarce resources. RCPRNG folds both into one security model whose completeness property carries guarantees across arbitrary state transitions, and shows the Gaži-Tessaro sponge construction satisfies it.
