import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI!;
    const user = process.env.NEO4J_USER!;
    const password = process.env.NEO4J_PASSWORD!;

    // For Neo4j Aura (neo4j+s://), don't specify encryption in config
    // The URI already includes encryption settings
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password)
    );
  }
  return driver;
}

export async function runQuery(query: string, params = {}) {
  const driver = getDriver();
  const session: Session = driver.session();
  
  try {
    const result = await session.run(query, params);
    return result.records.map(record => record.toObject());
  } finally {
    await session.close();
  }
}

export async function testConnection() {
  try {
    const result = await runQuery('RETURN "Connected!" as message');
    console.log('✅ Neo4j connection successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error);
    return false;
  }
}