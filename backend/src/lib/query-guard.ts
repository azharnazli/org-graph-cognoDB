// Guard for the read-only Cypher endpoint used by the Graph Explorer.
// Strips/forbids write keywords. Comments stripped so they can't smuggle
// keywords inside comments.

const FORBIDDEN = [
  "CREATE",
  "MERGE",
  "DELETE",
  "DETACH",
  "SET",
  "REMOVE",
  "DROP",
  "ALTER",
  "GRANT",
  "REVOKE",
  "CALL dbms",
  "CALL db.",
  "LOAD CSV",
  "USING PERIODIC",
];

const STRIP_LINE_COMMENT = /^\s*\/\/.*$/gm;
const STRIP_BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;

export interface GuardResult {
  ok: boolean;
  reason?: string;
  cypher: string;
}

export function guardReadOnly(cypherRaw: string): GuardResult {
  const stripped = cypherRaw
    .replace(STRIP_BLOCK_COMMENT, " ")
    .replace(STRIP_LINE_COMMENT, " ");

  const upper = ` ${stripped.toUpperCase()} `;

  for (const kw of FORBIDDEN) {
    // word-boundary-ish check (call `dbms.components` is two tokens)
    if (upper.includes(` ${kw} `) || upper.includes(`\n${kw} `)) {
      return { ok: false, reason: `Forbidden keyword: ${kw}`, cypher: stripped };
    }
  }

  // Must contain a MATCH (or OPTIONAL MATCH) and RETURN
  if (!/\b(MATCH|OPTIONAL\s+MATCH)\b/i.test(stripped)) {
    return { ok: false, reason: "Query must contain MATCH", cypher: stripped };
  }
  if (!/\bRETURN\b/i.test(stripped)) {
    return { ok: false, reason: "Query must contain RETURN", cypher: stripped };
  }

  return { ok: true, cypher: stripped };
}
