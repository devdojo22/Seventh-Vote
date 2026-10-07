export const METHODOLOGY = {
  intro:
    'The prototype’s credibility comes from showing its work: a structured record goes in, deterministic rules score the item, and every rehearsal claim points back to the evidence.',
  steps: [
    {
      id: 'structure',
      title: 'Structure the record',
      body: 'Votes, issue positions, quotes, committee roles, triggers, and persuasion levers become a member dossier.',
    },
    {
      id: 'rule',
      title: 'Apply governing rule',
      body: 'Item type, attendance, recusals, committee referral, and the requested action determine the lens and threshold before scoring.',
    },
    {
      id: 'trace',
      title: 'Expose the trace',
      body: 'The interface shows confidence, source links, procedural basis, and data gaps beside every simulated posture.',
    },
  ],
  limits: [
    'Outputs are hypotheses grounded in the public record, not predictions.',
    'Low-confidence records default to undecided rather than manufacturing certainty.',
    'Citizen Portal AI recaps are flagged for verification against official minutes.',
  ],
  consentLimit:
    'Consent-routed items use an objection-risk lens because any one member may pull an item from consent.',
  roadmap: [
    {
      id: 'rag',
      title: 'Full-record RAG pipeline',
      body: 'Ingest complete meeting transcripts, minutes, agendas, and recorded votes.',
    },
    {
      id: 'vault',
      title: 'Private executive layer',
      body: 'Add a single-tenant vault for curated notes and interview material, separated from public data.',
    },
    {
      id: 'agenda',
      title: 'Live agenda ingestion',
      body: 'Turn newly published agenda items into prepared simulations with fresh citations.',
    },
    {
      id: 'multi-city',
      title: 'Multi-city engine',
      body: 'Swap the municipal dossier dataset while retaining the explainable simulator.',
    },
  ],
  knownLimitations:
    'Freshman members have thinner records; Janika White has frequent recusals; several Citizen Portal vote summaries remain unverified against official minutes.',
} as const;
