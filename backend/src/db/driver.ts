import neo4j, { type Driver } from "neo4j-driver";
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const uri = required("COGNODB_URI");
const user = process.env["COGNODB_USER"] ?? "cognodb";
const password = required("COGNODB_PASSWORD");

export const driver: Driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 30_000,
  disableLosslessIntegers: true,
});

export async function verifyConnection(): Promise<void> {
  await driver.verifyConnectivity();
}

export async function closeDriver(): Promise<void> {
  await driver.close();
}
