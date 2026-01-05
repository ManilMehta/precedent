import { NextRequest, NextResponse } from 'next/server';
import { initializeGraph, ingestCase, createRelationship } from '@/lib/graphrag';
import { testConnection } from '@/lib/neo4j';

const sampleCases = [
  {
    id: 'roe_v_wade_1973',
    name: 'Roe v. Wade',
    year: 1973,
    court: 'Supreme Court',
    summary: 'Landmark decision establishing constitutional right to abortion based on right to privacy.',
    principles: ['Privacy', 'Due Process', 'Bodily Autonomy'],
  },
  {
    id: 'dobbs_v_jackson_2022',
    name: 'Dobbs v. Jackson Women\'s Health Organization',
    year: 2022,
    court: 'Supreme Court',
    summary: 'Overturned Roe v. Wade, holding that the Constitution does not confer a right to abortion.',
    principles: ['Federalism', 'Stare Decisis', 'Constitutional Interpretation'],
  },
  {
    id: 'hipaa_privacy_2018',
    name: 'United States v. Health Center',
    year: 2018,
    court: 'District Court',
    summary: 'Healthcare provider penalized for unauthorized disclosure of protected health information.',
    principles: ['Data Privacy', 'Healthcare Compliance', 'HIPAA'],
  },
  {
    id: 'smith_v_medical_2020',
    name: 'Smith v. Medical Center Inc.',
    year: 2020,
    court: 'Circuit Court',
    summary: 'Patient sued for unauthorized access to medical records by hospital staff.',
    principles: ['Data Privacy', 'Healthcare Compliance', 'Damages'],
  },
];

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    
    if (action === 'test') {
      const connected = await testConnection();
      return NextResponse.json({ 
        success: connected,
        message: connected ? 'Database connected!' : 'Connection failed'
      });
    }
    
    if (action === 'initialize') {
      console.log('🚀 Starting database setup...');
      
      const connected = await testConnection();
      if (!connected) {
        return NextResponse.json(
          { error: 'Cannot connect to Neo4j. Check credentials in .env.local' },
          { status: 500 }
        );
      }
      
      await initializeGraph();
      
      for (const caseData of sampleCases) {
        await ingestCase(caseData);
      }
      
      await createRelationship('dobbs_v_jackson_2022', 'roe_v_wade_1973', 'OVERRULES');
      await createRelationship('smith_v_medical_2020', 'hipaa_privacy_2018', 'CITES');
      await createRelationship('smith_v_medical_2020', 'hipaa_privacy_2018', 'APPLIES_TO');
      
      console.log('✅ Database setup complete!');
      
      return NextResponse.json({ 
        success: true,
        message: 'Database initialized with 4 sample cases!'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}