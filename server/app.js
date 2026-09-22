/**
 * SafeTrace Backend — Express app definition.
 * -------------------------------------------
 * This module only builds and returns the Express `app`; it never calls
 * `.listen()`. That split lets the exact same route logic run two ways:
 *   - locally / on a persistent host, via server.js, which does call listen()
 *   - as a Vercel serverless function, via api/index.js, which just exports
 *     this app and lets Vercel's Node runtime handle invocation per request
 *
 * Storage: in-memory (Map + arrays) — chosen for demo reliability and zero
 * external infra. IMPORTANT: on a serverless deployment (Vercel), this
 * in-memory store is NOT durable — each cold start / concurrent instance
 * gets its own copy, so case data will not reliably persist across requests
 * in production. For a persistent deployment, run this on a normal Node host
 * (Render, Railway, etc.) via server.js, or swap in a real database.
 *
 * Core idea (the product's differentiator): a report is identified ONLY by an
 * anonymous tracking token. There is no account, no name, no IP captured. The
 * token doubles as the credential for the two-way encrypted-style message
 * thread, so survivors can receive investigator follow-ups without ever
 * revealing who they are.
 */

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // generous limit for evidence metadata payloads

// ---------------------------------------------------------------------------
// In-memory data store
// ---------------------------------------------------------------------------

/** @type {Map<string, Case>} token -> case record */
const cases = new Map();

/** @type {Array<AuditEntry>} newest-first audit log for the ICC compliance trail */
const auditTrail = [];

/**
 * Baseline aggregate counters shown on the Command Center dashboard.
 * Seeded to realistic institutional-scale numbers so the demo looks alive
 * even though only a handful of full case records are seeded below; live
 * submissions increment these in real time.
 */
const stats = {
  total: 1248,
  newToday: 42,
  pending: 184,
  resolved: 1027,
  emergency: 37,
};

const CATEGORIES = [
  'Cyberbullying',
  'Stalking',
  'Threats',
  'Impersonation',
  'Campus/Workplace Sexual Harassment',
];

/** Category -> priority mapping. Threats & sexual harassment are always CRITICAL. */
const PRIORITY_BY_CATEGORY = {
  'Threats': 'CRITICAL',
  'Campus/Workplace Sexual Harassment': 'CRITICAL',
  'Stalking': 'HIGH',
  'Impersonation': 'MODERATE',
  'Cyberbullying': 'LOW',
};

// Real coordinates so the admin dashboard can plot zones on an actual
// geographic map rather than a fictional city grid.
const ZONES = [
  { id: 'Zone 1', label: 'Low', color: 'green', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { id: 'Zone 2', label: 'Moderate', color: 'yellow', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { id: 'Zone 3', label: 'High', color: 'orange', city: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { id: 'Zone 4', label: 'Very High / Recurring', color: 'red', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
];

const STATUS_FLOW = ['submitted', 'investigating', 'resolved'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O — avoids visual ambiguity with 1/0

/** Generates a unique anonymous tracking token, e.g. ST-8921-XRT9. */
function generateToken() {
  let token;
  do {
    const digits = Math.floor(1000 + Math.random() * 9000);
    let suffix = '';
    for (let i = 0; i < 3; i++) {
      suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    suffix += Math.floor(Math.random() * 10);
    token = `ST-${digits}-${suffix}`;
  } while (cases.has(token));
  return token;
}

function priorityFor(category) {
  return PRIORITY_BY_CATEGORY[category] || 'MODERATE';
}

/**
 * Picks a threat zone for the demo heatmap. Weighted so CRITICAL/HIGH reports
 * cluster into the higher-severity zones, which is what makes the "zone
 * clustering" story on the dashboard believable.
 */
function zoneFor(priority) {
  const weights = {
    CRITICAL: ['Zone 4', 'Zone 4', 'Zone 3', 'Zone 4'],
    HIGH: ['Zone 3', 'Zone 4', 'Zone 3', 'Zone 2'],
    MODERATE: ['Zone 2', 'Zone 3', 'Zone 1', 'Zone 2'],
    LOW: ['Zone 1', 'Zone 2', 'Zone 1', 'Zone 1'],
  };
  const pool = weights[priority] || weights.MODERATE;
  return pool[Math.floor(Math.random() * pool.length)];
}

function logAudit(action, { token = null, actor = 'ICC Investigator' } = {}) {
  auditTrail.unshift({
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    caseToken: token,
  });
  // Cap the in-memory log so a long-running demo doesn't grow unbounded.
  if (auditTrail.length > 500) auditTrail.length = 500;
}

/** Strips fields the admin dashboard doesn't need / shouldn't broadcast in list view. */
function toListView(c) {
  const { messages, ...rest } = c;
  return { ...rest, messageCount: messages.length };
}

// ---------------------------------------------------------------------------
// Seed data — gives the dashboard, heatmap, and triage panel something real
// to render on first load without waiting for live submissions.
// ---------------------------------------------------------------------------

function seed() {
  const seedCases = [
    { category: 'Threats', summary: 'Repeated threatening messages referencing home address sent via anonymous SMS.', status: 'investigating' },
    { category: 'Campus/Workplace Sexual Harassment', summary: 'Supervisor made repeated unwanted advances after reporter declined contact.', status: 'submitted' },
    { category: 'Stalking', summary: 'Individual has been appearing at reporter\'s commute stops for two weeks.', status: 'investigating' },
    { category: 'Cyberbullying', summary: 'Coordinated harassment campaign across a class group chat.', status: 'resolved' },
    { category: 'Impersonation', summary: 'Fake profile created using reporter\'s photos to solicit money from contacts.', status: 'submitted' },
    { category: 'Threats', summary: 'Explicit threat of violence posted publicly tagging the reporter.', status: 'submitted' },
    { category: 'Stalking', summary: 'GPS tracker suspected placed on reporter\'s vehicle by former partner.', status: 'investigating' },
    { category: 'Campus/Workplace Sexual Harassment', summary: 'Persistent unwelcome messages from a colleague despite being told to stop.', status: 'submitted' },
    { category: 'Cyberbullying', summary: 'Doxxing attempt sharing reporter\'s personal info on a forum.', status: 'investigating' },
    { category: 'Impersonation', summary: 'Cloned social account impersonating reporter to damage reputation at work.', status: 'resolved' },
  ];

  seedCases.forEach((s, i) => {
    const priority = priorityFor(s.category);
    const token = generateToken();
    const createdAt = new Date(Date.now() - (i + 1) * 3600 * 1000 * 6).toISOString();
    const record = {
      token,
      category: s.category,
      priority,
      status: s.status,
      description: s.summary,
      polishedDescription: null,
      suspectIdentifiers: { handles: '', urls: '', phone: '' },
      evidence: [],
      zone: zoneFor(priority),
      createdAt,
      updatedAt: createdAt,
      messages: [
        { id: `MSG-${i}-0`, sender: 'system', text: 'Report received and secured.', timestamp: createdAt },
      ],
    };
    cases.set(token, record);
  });

  logAudit('Command Center initialized', { actor: 'System' });
}

seed();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'safetrace-api' }));

/**
 * GET /api/cases
 * Returns all cases for admin monitoring (list view — message bodies omitted).
 */
app.get('/api/cases', (req, res) => {
  const all = Array.from(cases.values())
    .map(toListView)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ cases: all });
});

/**
 * POST /api/cases
 * Creates a new anonymous report. Generates a unique tracking token and
 * calculates priority from category. No identifying metadata (IP, device,
 * headers) is ever persisted onto the record.
 */
app.post('/api/cases', (req, res) => {
  const {
    category, description, polishedDescription, suspectIdentifiers, evidence,
    incidentDate, incidentTime, delayReason, state, incidentLocation,
  } = req.body || {};

  if (!category || !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'A valid category is required.' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'A description of the incident is required.' });
  }

  const priority = priorityFor(category);
  const token = generateToken();
  const now = new Date().toISOString();

  const record = {
    token,
    category,
    priority,
    status: 'submitted',
    description: description.trim(),
    polishedDescription: polishedDescription || null,
    incidentDate: incidentDate || null,
    incidentTime: incidentTime || null,
    delayReason: delayReason || '',
    state: state || '',
    incidentLocation: incidentLocation || '',
    suspectIdentifiers: {
      handles: suspectIdentifiers?.handles || '',
      urls: suspectIdentifiers?.urls || '',
      phone: suspectIdentifiers?.phone || '',
    },
    evidence: Array.isArray(evidence) ? evidence : [],
    zone: zoneFor(priority),
    createdAt: now,
    updatedAt: now,
    messages: [
      { id: `MSG-${token}-0`, sender: 'system', text: 'Report received and secured. An ICC investigator will review shortly.', timestamp: now },
    ],
  };

  cases.set(token, record);

  stats.total += 1;
  stats.newToday += 1;
  stats.pending += 1;
  if (priority === 'CRITICAL') stats.emergency += 1;

  logAudit('New case submitted', { token, actor: 'Anonymous Reporter' });

  res.status(201).json({ token, priority, case: record });
});

/**
 * GET /api/cases/:token
 * Fetches case details and the full message thread by token. Used both by
 * the survivor (self-lookup) and the admin (investigation view) — pass
 * ?actor=admin to have the access recorded in the audit trail, matching the
 * "case accessed" compliance requirement.
 */
app.get('/api/cases/:token', (req, res) => {
  const record = cases.get(req.params.token);
  if (!record) {
    return res.status(404).json({ error: 'No case found for that tracking token.' });
  }
  if (req.query.actor === 'admin') {
    logAudit('Case accessed', { token: record.token, actor: req.query.adminName || 'ICC Investigator' });
  }
  res.json({ case: record });
});

/**
 * POST /api/cases/:token/messages
 * Appends a message to the case's encrypted-style thread. `sender` is either
 * 'investigator' or 'reporter' — the reporter authenticates purely by
 * possessing the token, preserving anonymity end to end.
 */
app.post('/api/cases/:token/messages', (req, res) => {
  const record = cases.get(req.params.token);
  if (!record) {
    return res.status(404).json({ error: 'No case found for that tracking token.' });
  }

  const { sender, text, adminName } = req.body || {};
  if (!['investigator', 'reporter'].includes(sender)) {
    return res.status(400).json({ error: "sender must be 'investigator' or 'reporter'." });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const message = {
    id: `MSG-${record.token}-${record.messages.length}`,
    sender,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };
  record.messages.push(message);
  record.updatedAt = message.timestamp;

  // First investigator outreach nudges the case into "investigating".
  if (sender === 'investigator' && record.status === 'submitted') {
    record.status = 'investigating';
    stats.pending = Math.max(0, stats.pending - 1);
  }

  logAudit(
    sender === 'investigator' ? 'Communication initiated with reporter' : 'Reporter replied to investigator',
    { token: record.token, actor: sender === 'investigator' ? (adminName || 'ICC Investigator') : 'Anonymous Reporter' }
  );

  res.status(201).json({ message, case: record });
});

/**
 * PATCH /api/cases/:token/status
 * Admin-only status transition (submitted -> investigating -> resolved),
 * driving the survivor-facing progress tracker milestones.
 */
app.patch('/api/cases/:token/status', (req, res) => {
  const record = cases.get(req.params.token);
  if (!record) {
    return res.status(404).json({ error: 'No case found for that tracking token.' });
  }
  const { status, adminName } = req.body || {};
  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUS_FLOW.join(', ')}` });
  }

  const wasResolved = record.status === 'resolved';
  const willBeResolved = status === 'resolved';
  if (!wasResolved && willBeResolved) {
    stats.resolved += 1;
    if (record.status === 'submitted') stats.pending = Math.max(0, stats.pending - 1);
  }
  if (record.status === 'submitted' && status !== 'submitted') {
    stats.pending = Math.max(0, stats.pending - 1);
  }

  record.status = status;
  record.updatedAt = new Date().toISOString();

  logAudit(`Status changed to "${status}"`, { token: record.token, actor: adminName || 'ICC Investigator' });

  res.json({ case: record });
});

/**
 * POST /api/cases/:token/evidence-viewed
 * Records an audit entry when an investigator opens the evidence locker for
 * a case — required for the institutional compliance trail.
 */
app.post('/api/cases/:token/evidence-viewed', (req, res) => {
  const record = cases.get(req.params.token);
  if (!record) {
    return res.status(404).json({ error: 'No case found for that tracking token.' });
  }
  logAudit('Evidence locker viewed', { token: record.token, actor: req.body?.adminName || 'ICC Investigator' });
  res.json({ ok: true });
});

/**
 * GET /api/stats
 * Aggregate counters for the Command Center's top statistics cards.
 */
app.get('/api/stats', (req, res) => {
  res.json({ stats });
});

/**
 * GET /api/heatmap
 * Zone-clustered incident counts for the interactive threat heatmap.
 */
app.get('/api/heatmap', (req, res) => {
  const counts = Object.fromEntries(ZONES.map((z) => [z.id, 0]));
  for (const c of cases.values()) counts[c.zone] = (counts[c.zone] || 0) + 1;

  const zones = ZONES.map((z) => ({
    ...z,
    incidents: counts[z.id],
    recurring: counts[z.id] >= 3,
  }));

  res.json({ zones });
});

/**
 * GET /api/analytics
 * Trend + distribution data for the dashboard's analytics/hotspot section.
 */
app.get('/api/analytics', (req, res) => {
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const c of cases.values()) byCategory[c.category] = (byCategory[c.category] || 0) + 1;

  // Synthetic 7-day trend line seeded from live case volume so it moves as
  // new reports come in during the demo.
  const today = Array.from(cases.values()).length;
  const trend = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    cases: Math.max(1, Math.round(today * (0.6 + i * 0.07) + (i === 6 ? 0 : Math.floor(Math.random() * 3)))),
  }));

  const hotspots = [
    { zone: 'Zone 4', change: '+27%', note: 'Recurring cluster near campus perimeter' },
    { zone: 'Zone 3', change: '+12%', note: 'Rising stalking reports on transit routes' },
  ];

  // Naive related-case pattern match: group CRITICAL cases sharing a category.
  const relatedGroups = {};
  for (const c of cases.values()) {
    if (c.priority !== 'CRITICAL') continue;
    (relatedGroups[c.category] ||= []).push(c.token);
  }
  const relatedCases = Object.entries(relatedGroups)
    .filter(([, tokens]) => tokens.length > 1)
    .map(([category, tokens]) => ({ category, tokens }));

  res.json({ byCategory, trend, hotspots, relatedCases });
});

/**
 * GET /api/audit-trail
 * Timestamped log of admin actions for institutional compliance review.
 */
app.get('/api/audit-trail', (req, res) => {
  res.json({ entries: auditTrail.slice(0, 200) });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
