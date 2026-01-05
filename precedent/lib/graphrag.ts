import { runQuery } from './neo4j';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface LegalCase {
  id: string;
  name: string;
  year: number;
  court: string;
  summary: string;
  principles: string[];
  fullText?: string;
}

export async function initializeGraph() {
  console.log('🔧 Initializing graph schema...');
  
  await runQuery(`
    CREATE CONSTRAINT case_id IF NOT EXISTS
    FOR (c:Case) REQUIRE c.id IS UNIQUE
  `);
  
  await runQuery(`
    CREATE CONSTRAINT principle_id IF NOT EXISTS
    FOR (p:Principle) REQUIRE p.id IS UNIQUE
  `);
  
  console.log('✅ Graph schema initialized');
}

export async function ingestCase(caseData: LegalCase) {
  await runQuery(`
    MERGE (c:Case {id: $id})
    SET c.name = $name,
        c.year = $year,
        c.court = $court,
        c.summary = $summary,
        c.fullText = $fullText
  `, {
    id: caseData.id,
    name: caseData.name,
    year: caseData.year,
    court: caseData.court,
    summary: caseData.summary,
    fullText: caseData.fullText || '',
  });
  
  for (const principle of caseData.principles) {
    await runQuery(`
      MERGE (p:Principle {id: $principleId})
      SET p.name = $principleName
      WITH p
      MATCH (c:Case {id: $caseId})
      MERGE (c)-[:INVOLVES_PRINCIPLE]->(p)
    `, {
      principleId: principle.toLowerCase().replace(/\s+/g, '_'),
      principleName: principle,
      caseId: caseData.id,
    });
  }
  
  console.log(`✅ Ingested case: ${caseData.name}`);
}

export async function createRelationship(from: string, to: string, type: string) {
  const relationshipType = type.toUpperCase();
  
  await runQuery(`
    MATCH (from:Case {id: $from})
    MATCH (to:Case {id: $to})
    MERGE (from)-[r:${relationshipType}]->(to)
    SET r.weight = 1.0
  `, { from, to });
  
  console.log(`✅ Created relationship: ${from} -[${type}]-> ${to}`);
}

export async function searchCases(query: string) {
  console.log('🔍 Searching for:', query);
  
  try {
    // Use Groq with Llama 3.1 70B (FREE!)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a legal research assistant. Analyze queries and extract legal concepts, principles, and relationships. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: `Analyze this legal research query and extract key information.

Query: "${query}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "principles": ["list", "of", "legal", "principles"],
  "keywords": ["important", "keywords"],
  "relationshipType": null
}

Only include principles if they are clearly legal concepts mentioned in the query.`
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
    });
    
    let analysis: any = {};
    try {
      const content = completion.choices[0]?.message?.content || '{}';
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse Groq response:', e);
      analysis = { keywords: query.toLowerCase().split(' ') };
    }
    
    console.log('📊 Query analysis:', analysis);
    
    // Build Cypher query
    let cypherQuery = `MATCH (c:Case)`;
    const params: any = {};
    const conditions: string[] = [];
    
    if (analysis.principles && analysis.principles.length > 0) {
      cypherQuery += ` MATCH (c)-[:INVOLVES_PRINCIPLE]->(p:Principle)`;
      conditions.push(`p.name IN $principles`);
      params.principles = analysis.principles;
    }
    
    if (conditions.length > 0) {
      cypherQuery += ` WHERE ` + conditions.join(' AND ');
    }
    
    cypherQuery += `
      OPTIONAL MATCH (c)-[r:CITES|OVERRULES|APPLIES_TO]->(related:Case)
      RETURN c, collect(DISTINCT related) as relatedCases
      LIMIT 10
    `;
    
    const results = await runQuery(cypherQuery, params);
    
    console.log(`✅ Found ${results.length} cases`);
    
    return {
      cases: results.map((r: any) => r.c.properties),
      relatedCases: results.flatMap((r: any) => 
        r.relatedCases.filter((rc: any) => rc !== null).map((rc: any) => rc.properties)
      ),
      analysis,
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}