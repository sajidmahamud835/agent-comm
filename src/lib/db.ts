import { MongoClient, Db } from "mongodb";

const g = globalThis as unknown as {
  __mongoClient?: MongoClient;
  __mongoDb?: Db;
  __mongoPromise?: Promise<MongoClient>;
};

export async function getDb(): Promise<Db> {
  if (g.__mongoDb) return g.__mongoDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!g.__mongoPromise) {
    g.__mongoClient = new MongoClient(uri);
    g.__mongoPromise = g.__mongoClient.connect();
  }

  const client = await g.__mongoPromise;
  g.__mongoDb = client.db("agentcomm");
  return g.__mongoDb;
}
