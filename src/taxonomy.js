// Shared vocabulary for projects, writing and research. IDs stay stable in
// content and URLs; labels keep acronyms and product names readable.
export const FACETS = [
  { key: 'domains', param: 'domain', label: 'Domain', plural: 'domains' },
  { key: 'topics', param: 'topic', label: 'Topic', plural: 'topics' },
  {
    key: 'languages',
    param: 'language',
    label: 'Language',
    plural: 'languages',
  },
]

export const TAXONOMY = {
  domains: {
    'ai-security': 'AI Security',
    'application-security': 'Application Security',
    'cloud-security': 'Cloud Security',
    cryptography: 'Cryptography',
    infrastructure: 'Infrastructure',
    'offensive-security': 'Offensive Security',
    'systems-programming': 'Systems Programming',
    'web-development': 'Web Development',
  },
  languages: {
    assembly: 'Assembly',
    c: 'C',
    cpp: 'C++',
    go: 'Go',
    javascript: 'JavaScript',
    python: 'Python',
    solidity: 'Solidity',
  },
  topics: {
    'anti-debugging': 'Anti-debugging',
    'attack-modeling': 'Attack Modeling',
    'attack-planning': 'Attack Planning',
    'binary-exploitation': 'Binary Exploitation',
    'binary-formats': 'Binary Formats',
    'build-automation': 'Build Automation',
    caching: 'Caching',
    'code-quality': 'Code Quality',
    concurrency: 'Concurrency',
    'content-publishing': 'Content Publishing',
    'cryptographic-proofs': 'Cryptographic Proofs',
    'data-structures': 'Data Structures',
    'detection-engineering': 'Detection Engineering',
    'distributed-systems': 'Distributed Systems',
    entropy: 'Entropy',
    'formal-methods': 'Formal Methods',
    'high-availability': 'High Availability',
    iam: 'IAM',
    'knowledge-graphs': 'Knowledge Graphs',
    'language-models': 'Language Models',
    'malware-analysis': 'Malware Analysis',
    'malware-detection': 'Malware Detection',
    'memory-management': 'Memory Management',
    networking: 'Networking',
    opsec: 'OPSEC',
    parsing: 'Parsing',
    'partial-observability': 'Partial Observability',
    'penetration-testing': 'Penetration Testing',
    'privilege-escalation': 'Privilege Escalation',
    'prompt-injection': 'Prompt Injection',
    'pseudo-randomness': 'Pseudo-randomness',
    reconnaissance: 'Reconnaissance',
    'red-teaming': 'Red Teaming',
    'reverse-engineering': 'Reverse Engineering',
    'secure-coding': 'Secure Coding',
    'security-education': 'Security Education',
    'system-calls': 'System Calls',
    'threat-modeling': 'Threat Modeling',
  },
}

const ALIASES = {
  'c++': 'cpp',
  'c-plus-plus': 'cpp',
  'red-team': 'red-teaming',
  redteam: 'red-teaming',
  pentesting: 'penetration-testing',
  makefile: 'build-automation',
  memories: 'memory-management',
  'pointers-in-c': 'memory-management',
  pointers: 'memory-management',
  heap: 'memory-management',
  detections: 'detection-engineering',
  prng: 'pseudo-randomness',
}

export function canonicalTag(value) {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
  return Object.hasOwn(ALIASES, id) ? ALIASES[id] : id
}

export function parseTags(value = '') {
  const values = Array.isArray(value) ? value : value.split(',')
  return [...new Set(values.map(canonicalTag).filter(Boolean))]
}

export function tagLabel(key, value) {
  return Object.hasOwn(TAXONOMY[key] || {}, value)
    ? TAXONOMY[key][value]
    : value.replace(/-/g, ' ')
}

export function allTags(item) {
  return [...new Set(FACETS.flatMap(({ key }) => item[key] || []))]
}

export function taxonomyLines(item) {
  return FACETS.filter(({ key }) => item[key]?.length).map(
    ({ key, plural }) =>
      `${plural[0].toUpperCase() + plural.slice(1)}: ${item[key]
        .map((value) => tagLabel(key, value))
        .join(', ')}`
  )
}
