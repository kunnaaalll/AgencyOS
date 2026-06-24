const fs = require('fs');
const path = require('path');

const mocksDir = path.join(__dirname, 'frontend/src/mocks');
if (!fs.existsSync(mocksDir)) {
  fs.mkdirSync(mocksDir, { recursive: true });
}

const businessNames = [
  'SmileCraft Dental Clinic', 'Aura Skin Studio', 'UrbanNest Interiors',
  'Elite Realty Mumbai', 'FitZone Gym', 'Luxe Salon', 'GreenLeaf Cafe',
  'Prime Legal Associates', 'WellCare Clinic', 'Spark Academy',
  'Vista Developers', 'Silverline Architects', 'TechNova Solutions',
  'Nexus Digital', 'Apex Financial', 'Breeze Hospitality',
  'Stellar Education', 'Global Logistics Co', 'Pinnacle Health',
  'Metro Food Chain', 'CloudSync IT', 'Zenith Marketing',
  'Harmony Spa', 'Quantum Software', 'Vanguard Consulting',
  'Crest Engineering', 'Summit Retail', 'Horizon Media',
  'Echo Communications', 'Titan Manufacturing', 'Alpha Ventures',
  'Omega Services', 'Prime Estate', 'Noble Architects', 'Crescent Clinic',
  'Vivid Studio', 'Oasis Resorts', 'Astra Logistics', 'Nova Education',
  'Vertex IT Services', 'Radiant Beauty', 'Trident Finance', 'Polaris Tech',
  'Fusion Dynamics', 'Spectrum Design', 'Optima Health', 'Synergy Solutions',
  'Nexus Innovations', 'Apex Construction', 'Breeze Travel', 'Stellar Events',
];

const names = [
  'Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Neha Gupta', 'Vikram Patel',
  'Pooja Verma', 'Karan Malhotra', 'Sneha Reddy', 'Rohit Desai', 'Anjali Joshi',
  'Siddharth Rao', 'Kavita Menon', 'Arjun Kapoor', 'Meera Nair', 'Ravi Iyer',
  'Divya Agarwal', 'Aditya Chawla', 'Ritu Bhatia', 'Sanjay Das', 'Riya Mehra'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const mockDashboard = `
export const dashboardMock = {
  kpis: {
    mrr: 875000,
    arr: 10500000,
    netProfit: 492000,
    activeClients: 28,
    qualifiedLeads: 112,
    pipeline: 1450000,
    discoveryToday: 342,
    winRate: 18,
    meetingsThisMonth: 24,
    conversionRate: 18,
    teamSize: 9
  },
  monthlyRevenue: [
    { name: 'Jan', value: 250000 },
    { name: 'Feb', value: 310000 },
    { name: 'Mar', value: 400000 },
    { name: 'Apr', value: 520000 },
    { name: 'May', value: 680000 },
    { name: 'Jun', value: 875000 },
  ],
  leadFunnel: [
    { stage: 'Total Leads', count: 5000 },
    { stage: 'Contacted', count: 2000 },
    { stage: 'Qualified', count: 1000 },
    { stage: 'Proposals', count: 500 },
    { stage: 'Won', count: 100 },
  ]
};
`;

let leadsData = [];
for (let i = 1; i <= 50; i++) {
  leadsData.push({
    id: `lead-${i}`,
    name: getRandomItem(names),
    business: businessNames[i % businessNames.length],
    industry: getRandomItem(['Healthcare', 'Real Estate', 'Fitness', 'Beauty', 'Food & Beverage', 'Legal', 'Education', 'IT', 'Consulting']),
    email: 'contact' + i + '@' + businessNames[i % businessNames.length].replace(/\\s+/g, '').toLowerCase() + '.in',
    phone: '+91 98' + getRandomInt(10000000, 99999999),
    website: 'www.' + businessNames[i % businessNames.length].replace(/\\s+/g, '').toLowerCase() + '.in',
    instagram: '@' + businessNames[i % businessNames.length].replace(/\\s+/g, '').toLowerCase(),
    location: getRandomItem(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune']),
    priority: getRandomItem(['High', 'Medium', 'Low']),
    score: getRandomInt(40, 99),
    painPoints: ['Need more leads', 'Low conversion rate', 'Poor online presence'],
    status: getRandomItem(['NEW', 'QUALIFIED', 'CONTACTED'])
  });
}

let opportunitiesData = [];
for (let i = 1; i <= 25; i++) {
  opportunitiesData.push({
    id: 'opp-' + i,
    business: businessNames[(i+10) % businessNames.length],
    dealValue: getRandomInt(50000, 300000),
    probability: getRandomInt(10, 90),
    expectedCloseDate: new Date(Date.now() + getRandomInt(1, 60) * 86400000).toISOString().split('T')[0],
    owner: getRandomItem(names),
    stage: getRandomItem(['MEETING', 'PROPOSAL', 'WON', 'LOST'])
  });
}

const mockCrm = `
export const mockLeads = ${JSON.stringify(leadsData, null, 2)};
export const mockOpportunities = ${JSON.stringify(opportunitiesData, null, 2)};

export const mockColumns = [
  { id: 'NEW', title: 'New Leads' },
  { id: 'QUALIFIED', title: 'Qualified' },
  { id: 'CONTACTED', title: 'Contacted' },
  { id: 'MEETING', title: 'Meeting Scheduled' },
  { id: 'PROPOSAL', title: 'Proposal Sent' },
  { id: 'WON', title: 'Closed Won' },
  { id: 'LOST', title: 'Closed Lost' }
];
`;

let clientsData = [];
for (let i = 1; i <= 15; i++) {
  clientsData.push({
    id: 'client-' + i,
    company: businessNames[i+20],
    package: getRandomItem(['Growth Plan', 'Scale Plan', 'Enterprise Plan']),
    retainer: getRandomInt(50000, 200000),
    contractStart: '2025-01-01',
    contractEnd: '2026-01-01',
    healthStatus: getRandomItem(['Healthy', 'At Risk', 'Churned']),
    renewalProbability: getRandomInt(50, 99)
  });
}

const mockClients = `
export const mockClientsData = ${JSON.stringify(clientsData, null, 2)};
`;

const mockFinance = `
export const mockFinanceData = {
  twelveMonthsRevenue: [
    { month: 'Jul 2025', revenue: 150000 },
    { month: 'Aug 2025', revenue: 180000 },
    { month: 'Sep 2025', revenue: 220000 },
    { month: 'Oct 2025', revenue: 270000 },
    { month: 'Nov 2025', revenue: 350000 },
    { month: 'Dec 2025', revenue: 420000 },
    { month: 'Jan 2026', revenue: 250000 },
    { month: 'Feb 2026', revenue: 310000 },
    { month: 'Mar 2026', revenue: 400000 },
    { month: 'Apr 2026', revenue: 520000 },
    { month: 'May 2026', revenue: 680000 },
    { month: 'Jun 2026', revenue: 875000 },
  ],
  twelveMonthsExpenses: [
    { month: 'Jul 2025', expense: 100000 },
    { month: 'Aug 2025', expense: 110000 },
    { month: 'Sep 2025', expense: 130000 },
    { month: 'Oct 2025', expense: 150000 },
    { month: 'Nov 2025', expense: 180000 },
    { month: 'Dec 2025', expense: 200000 },
    { month: 'Jan 2026', expense: 160000 },
    { month: 'Feb 2026', expense: 190000 },
    { month: 'Mar 2026', expense: 220000 },
    { month: 'Apr 2026', expense: 280000 },
    { month: 'May 2026', expense: 320000 },
    { month: 'Jun 2026', expense: 383000 },
  ],
  founders: [
    { name: 'Founder A', role: 'CEO' },
    { name: 'Founder B', role: 'CTO' }
  ],
  distributions: 150000,
  expenses: 383000,
  cashReserve: 2500000
};
`;

const mockAnalytics = "export const mockAnalyticsData = { traffic: 15000, conversions: 450, bounceRate: 42 };";
const mockOutreach = "export const mockOutreachDrafts = Array.from({length: 20}).map((_, i) => ({ id: 'outreach-'+i, subject: 'Growth Opportunity for ' + i, status: 'Draft', recipient: 'contact' + i + '@example.com' }));";
const mockQualification = "export const mockQualifications = Array.from({length: 20}).map((_, i) => ({ id: 'qual-'+i, score: 85, notes: 'Highly qualified lead' }));";
const mockProjects = "export const mockProjectsData = Array.from({length: 10}).map((_, i) => ({ id: 'proj-'+i, name: 'Website Revamp ' + i, status: 'In Progress' }));";
const mockTasks = "export const mockTasksData = Array.from({length: 100}).map((_, i) => ({ id: 'task-'+i, title: 'Follow up with client ' + i, status: 'Pending' }));";
const mockDiscovery = "export const mockDiscoveryData = Array.from({length: 15}).map((_, i) => ({ id: 'disc-'+i, runName: 'Mumbai Healthcare Providers', status: 'Completed', results: 342 }));";
const mockNotifications = "export const mockNotificationsData = Array.from({length: 10}).map((_, i) => ({ id: 'notif-'+i, message: 'New lead assigned to you', read: false }));";
const mockSystem = "export const mockSystemData = { status: 'Operational', uptime: '99.99%' };";
const mockLeadsExt = "export const mockLeadsExtData = [];";

fs.writeFileSync(path.join(mocksDir, 'dashboard.ts'), mockDashboard);
fs.writeFileSync(path.join(mocksDir, 'crm.ts'), mockCrm);
fs.writeFileSync(path.join(mocksDir, 'clients.ts'), mockClients);
fs.writeFileSync(path.join(mocksDir, 'finance.ts'), mockFinance);
fs.writeFileSync(path.join(mocksDir, 'analytics.ts'), mockAnalytics);
fs.writeFileSync(path.join(mocksDir, 'outreach.ts'), mockOutreach);
fs.writeFileSync(path.join(mocksDir, 'qualification.ts'), mockQualification);
fs.writeFileSync(path.join(mocksDir, 'leads.ts'), mockLeadsExt);
fs.writeFileSync(path.join(mocksDir, 'projects.ts'), mockProjects);
fs.writeFileSync(path.join(mocksDir, 'tasks.ts'), mockTasks);
fs.writeFileSync(path.join(mocksDir, 'discovery.ts'), mockDiscovery);
fs.writeFileSync(path.join(mocksDir, 'notifications.ts'), mockNotifications);
fs.writeFileSync(path.join(mocksDir, 'system.ts'), mockSystem);

const indexTs = "export * from './dashboard';\nexport * from './crm';\nexport * from './clients';\nexport * from './finance';\nexport * from './analytics';\nexport * from './outreach';\nexport * from './qualification';\nexport * from './leads';\nexport * from './projects';\nexport * from './tasks';\nexport * from './discovery';\nexport * from './notifications';\nexport * from './system';\n";

fs.writeFileSync(path.join(mocksDir, 'index.ts'), indexTs);

console.log('Mocks generated successfully.');
