'use client';

import { useState } from 'react';
import { Search, Scale, Database, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'testing' | 'initializing' | 'success' | 'error'>('idle');
  const [setupMessage, setSetupMessage] = useState('');

  const testConnection = async () => {
    setSetupStatus('testing');
    setSetupMessage('Testing database connection...');
    
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus('success');
        setSetupMessage('✅ Database connected successfully!');
      } else {
        setSetupStatus('error');
        setSetupMessage('❌ Connection failed. Check your .env.local file.');
      }
    } catch (error) {
      setSetupStatus('error');
      setSetupMessage('❌ Error: ' + (error as Error).message);
    }
  };

  const initializeDatabase = async () => {
    setSetupStatus('initializing');
    setSetupMessage('Initializing database with sample data...');
    
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus('success');
        setSetupMessage('✅ ' + data.message);
      } else {
        setSetupStatus('error');
        setSetupMessage('❌ ' + data.error);
      }
    } catch (error) {
      setSetupStatus('error');
      setSetupMessage('❌ Error: ' + (error as Error).message);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        alert('Search failed: ' + data.error);
      }
    } catch (error) {
      alert('Search error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'Show precedents for data privacy in healthcare',
    'How does Dobbs differ from earlier rulings?',
    'Find cases about HIPAA violations',
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Scale className="w-10 h-10 text-amber-400" />
            <div>
              <h1 className="text-4xl font-bold">Legal GraphRAG</h1>
              <p className="text-slate-400 mt-1">AI-powered legal research with graph reasoning</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-lg">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-semibold">100% Free - Powered by Groq</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-semibold">Database Setup</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={setupStatus === 'testing'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {setupStatus === 'testing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Test Connection
              </button>
              
              <button
                onClick={initializeDatabase}
                disabled={setupStatus === 'initializing'}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {setupStatus === 'initializing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Initialize with Sample Data
              </button>
            </div>
            
            {setupMessage && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                setupStatus === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                setupStatus === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                'bg-blue-500/10 border border-blue-500/30'
              }`}>
                {setupStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                {setupStatus === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                {(setupStatus === 'testing' || setupStatus === 'initializing') && (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
                <span className="text-sm">{setupMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ask a legal research question..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-12 pr-32 py-4 text-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mb-8">
          <p className="text-sm text-slate-400 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((ex, i) => (
              <button
                key={i}
                onClick={() => setQuery(ex)}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm border border-slate-700 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {results && (
          <div className="space-y-6">
            {results.analysis && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">AI Query Analysis (Groq + Llama 3.1)</h3>
                <pre className="text-sm text-slate-300 overflow-x-auto">
                  {JSON.stringify(results.analysis, null, 2)}
                </pre>
              </div>
            )}

            {results.cases && results.cases.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">Found {results.cases.length} Cases</h3>
                {results.cases.map((caseItem: any, i: number) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-amber-500/50 transition-colors">
                    <h4 className="text-2xl font-bold text-amber-400 mb-2">
                      {caseItem.name}
                    </h4>
                    <p className="text-slate-400 mb-4">
                      {caseItem.court} • {caseItem.year}
                    </p>
                    <p className="text-slate-200 mb-4">{caseItem.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
                <p className="text-slate-400">No cases found. Try a different query or initialize the database first.</p>
              </div>
            )}

            {results.relatedCases && results.relatedCases.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Related Cases via Citations</h3>
                <div className="space-y-3">
                  {results.relatedCases.map((related: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <span className="text-white">{related.name} ({related.year})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}