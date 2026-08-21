import { driver, verifyConnection, closeDriver } from "../src/db/driver.js";

async function main(): Promise<void> {
  await verifyConnection();
  const session = driver.session({ database: "neo4j" });
  try {
    const before = await session.run("MATCH (n) RETURN count(n) AS total");
    console.log(`Nodes before wipe: ${before.records[0]?.get("total") ?? 0}`);

    await session.run("MATCH (n) DETACH DELETE n");
    console.log("Wiped all nodes + relationships.");

    const after = await session.run("MATCH (n) RETURN count(n) AS total");
    console.log(`Nodes after wipe: ${after.records[0]?.get("total") ?? 0}`);
  } finally {
    await session.close();
    await closeDriver();
  }
}

void main();
