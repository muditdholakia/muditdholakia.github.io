// ─────────────────────────────────────────────────────────────
// All site content lives here. Edit this file; both the Immersive
// view and the Executive CV view render from it.
// Sources: Mudit's CVs (2024–2026), his LinkedIn profile export, his ResearchGate profile,
// his own figures, his GitHub, IIMA coverage of the TEDx talk, Spotify, and the IEEE Pune
// Section talk on YouTube.
// Only verified facts — keep it that way.
// `logo` values are keys from js/logos.js (files in assets/logos).
// ─────────────────────────────────────────────────────────────

export const content = {
  person: {
    name: "Mudit Dholakia",
    firstName: "Mudit",
    lastName: "Dholakia",
    role: "Associate Director and Lead, Microsoft Fabric stream at UBS",
    location: "Pune, India. Open to roles in APAC and the UAE.",
    headline: "Data & AI leader for banking: data strategy, governance and enterprise agents",
    lede: "I run the data and AI platform that 150,000 people at UBS work on, and I'm moving it onto Microsoft Fabric with governed AI agents built in.",
    email: "muditdholakia@gmail.com",
    linkedin: "https://www.linkedin.com/in/muditdholakia/",
    github: "https://github.com/muditdholakia",
    cvGeneral: "assets/Mudit_Dholakia_CV.pdf",
    cvDirector: "assets/Mudit_Dholakia_CV_Data_AI_Director.pdf",
  },

  // Facts labelled on the 3D "MD" monogram in the hero, like notes on a drawing
  // (anchor = a point on the monogram, 0–1 from its top-left, snapped to the nearest letter;
  // side = where the label hangs: up, down, left or right; far = a longer leader line, so labels stagger).
  callouts: [
    { text: "Lead, Microsoft Fabric stream", sub: "UBS", anchor: [0.05, 0.03], side: "up" },
    { text: "150,000 platform users", sub: "4,000+ workspaces · 36,000 reports", anchor: [0.6, 0.03], side: "up", far: true },
    { text: "TEDx and IEEE speaker", sub: "TEDxJSPMRSCOE and IEEE Pune Section", anchor: [0.05, 0.97], side: "down" },
    { text: "IIM Ahmedabad", sub: "Executive education, Grade S+", anchor: [0.6, 0.97], side: "down", far: true },
  ],

  summary:
    "Ten years building, securing and governing data, BI and AI platforms for global banks: UBS, Deutsche Bank, HSBC and Barclays. Today I lead the Microsoft Fabric stream at UBS, own a USD 4.8M platform budget, lead a team of 14, and am consolidating Databricks, Denodo, Alteryx and Azure Data Factory onto Fabric while rolling out Copilot and enterprise agents to 140,000 people.",

  // The kinetic statement. {0}…{4} are replaced by the numbers below, in order.
  scaleSentence: "The platform I run serves {0} people across {1} workspaces and {2} reports, holds {3} of data, and runs on a {4} annual budget.",
  scale: [
    { value: 150000, format: "int", unit: "users" },
    { value: 4000, format: "int", suffix: "+", unit: "workspaces" },
    { value: 36000, format: "int", unit: "reports" },
    { value: 72.3, format: "dec1", suffix: " TB", unit: "TB of data" },
    { value: 4.8, format: "dec1", prefix: "USD ", suffix: "M", unit: "annual budget" },
  ],

  // Decommission → value. Each step dissolves the legacy logo(s) into gold.
  savings: [
    { label: "Alteryx and Azure Data Factory decommissioning", from: ["alteryx", "adf"], to: ["fabric"], toText: "Fabric-native pipelines", where: "UBS", whereLogo: "ubs", value: 6.33, note: "saved every year" },
    { label: "Tableau to Power BI migration", from: ["tableau"], to: ["powerbi"], toText: "Power BI", where: "UBS", whereLogo: "ubs", value: 1.6, note: "saved in licences" },
    { label: "Power BI Premium to Fabric capacity optimisation", from: ["powerbi"], to: ["fabric"], toText: "Fabric capacity", where: "UBS", whereLogo: "ubs", value: 0.654, note: "saved on capacity" },
    { label: "Legacy QlikView decommissioning", from: ["qlik"], to: ["azure", "powerbi"], toText: "Azure and Power BI", where: "Deutsche Bank", whereLogo: "deutschebank", value: 1.2, note: "in costs avoided" },
  ],

  // Interactive architecture diagram. Each node opens a detail panel.
  architecture: {
    retiring: {
      title: "Retiring",
      caption: "Migration to Fabric is 60% complete",
      progress: 0.6,
      nodes: [
        { id: "databricks", name: "Databricks", logo: "databricks", detail: "Strategic migration of Databricks workloads onto Microsoft Fabric, which is 60% complete. It consolidates engineering on one governed platform." },
        { id: "denodo", name: "Denodo", logo: "denodo", detail: "Data virtualisation from Denodo is moving into OneLake, so consumers query governed copies instead of federated views." },
        { id: "alteryx", name: "Alteryx", logo: "alteryx", detail: "Alteryx workflows are being decommissioned in favour of Fabric-native pipelines. Together with ADF, this saves USD 6.33M a year." },
        { id: "adf", name: "Azure Data Factory", logo: "adf", detail: "Azure Data Factory pipelines are being retired and rebuilt as Fabric Data Factory pipelines. Together with Alteryx, this saves USD 6.33M a year." },
      ],
    },
    platform: {
      title: "Microsoft Fabric · OneLake",
      logo: "onelake",
      caption: "USD 4.8M budget · 72.3 TB",
      nodes: [
        { id: "bronze", name: "Bronze", layer: "bronze", detail: "Raw data lands as-is in OneLake. Pipelines built with Fabric Data Factory." },
        { id: "silver", name: "Silver", layer: "silver", detail: "Cleaned, conformed and catalogued in Microsoft Purview, with lineage end to end." },
        { id: "gold", name: "Gold", layer: "gold", detail: "Business-ready data serving 4,000+ workspaces and 36,000 reports for regulatory, liquidity and capital reporting teams." },
      ],
    },
    consume: {
      title: "Consumed by",
      caption: "150,000 people",
      nodes: [
        { id: "powerbi", name: "Power BI", logo: "powerbi", detail: "36,000 reports across 4,000+ workspaces. I'm Service Owner, covering capacity, tenant governance, releases and adoption. The Premium-to-Fabric move saved USD 654K, and the Tableau-to-Power BI migration saved USD 1.6M in licences." },
        { id: "agents", name: "Copilot & agents", logo: "copilot", detail: "Microsoft 365 Copilot for 140,000 users, including Copilot Cowork and agent token-quota management. There are 40 personal agents and 3 live team agents, built with Copilot Studio, Agent Builder and Copilot skills on Azure AI Foundry." },
        { id: "mcp", name: "Fabric MCP", logo: "dataagent", detail: "Agents reach governed Fabric data through the Fabric MCP server, so answers come from the gold layer under the same access controls as reports." },
        { id: "powerapps", name: "Power Apps", logo: "powerapps", detail: "Self-service Power Platform: business teams build Power Apps and Power Automate solutions, which are promoted through CI/CD pipelines (Azure DevOps, GitLab) so IT keeps control." },
      ],
    },
    governance: {
      title: "Governance across every layer",
      nodes: [
        { id: "purview", name: "Microsoft Purview", logo: "purview", detail: "Catalogue, lineage and compliance across the platform. Audit-log collection is automated with PowerShell, the Graph API and Purview." },
        { id: "oap", name: "Outbound access protection", logo: "privateendpoint", detail: "Fabric outbound access protection lets data leave only for approved destinations, which guards against exfiltration." },
        { id: "identity", name: "Entra ID & managed identities", logo: "managedid", detail: "Identity-first security: RBAC, private endpoints, Defender, service principals and managed identities, so services and agents run without stored secrets." },
      ],
    },
  },

  agents: {
    personal: 40,
    team: 3,
    users: 140000,
    hoursSaved: 18,
    story: "One agent prepares UBS's retrospective service-outage claims to Microsoft. It saves about 18 hours of manual work every week.",
    stack: [
      { name: "Copilot Studio", logo: "copilotstudio" },
      { name: "Agent Builder", logo: "copilot" },
      { name: "Copilot Cowork", logo: "copilot" },
      { name: "Azure AI Foundry", logo: "aifoundry" },
      { name: "Fabric MCP server", logo: "dataagent" },
      { name: "Power Automate", logo: "powerautomate" },
    ],
  },

  // Skills orbit: three rings, mirroring the medallion layers.
  skills: [
    {
      ring: "gold", title: "AI and agents",
      items: [
        { name: "Microsoft 365 Copilot", logo: "copilot", note: "140,000 users; Copilot Cowork and agent token quotas" },
        { name: "Copilot Studio", logo: "copilotstudio", note: "Team and personal agents in production" },
        { name: "Azure AI Foundry", logo: "aifoundry", note: "Agents with managed identities" },
        { name: "Fabric data agents & MCP", logo: "dataagent", note: "Agents grounded on governed gold data" },
        { name: "GitHub Copilot", logo: "githubcopilot", note: "Engineering productivity" },
        { name: "Power Automate", logo: "powerautomate", note: "Workflow automation through CI/CD" },
      ],
    },
    {
      ring: "silver", title: "Data platforms",
      items: [
        { name: "Microsoft Fabric", logo: "fabric", note: "Lead of the Fabric stream at UBS" },
        { name: "OneLake", logo: "onelake", note: "Medallion architecture, 72.3 TB" },
        { name: "Fabric Data Factory", logo: "fabricdf", note: "Replacing ADF and Alteryx pipelines" },
        { name: "Azure Databricks", logo: "databricks", note: "Migrating to Fabric, 60% complete" },
        { name: "Azure Synapse", logo: "synapse", note: "SQL and Spark analytics" },
        { name: "Microsoft Azure", logo: "azure", note: "Azure Solutions Architect Expert" },
        { name: "Snowflake", logo: "snowflake", note: "Data lake and warehouse layers" },
        { name: "SQL Server", logo: "sqlserver", note: "Regulatory and finance reporting" },
        { name: "Google Cloud", logo: "gcp", note: "Tableau on GCP at Deutsche Bank" },
        { name: "AWS", logo: "aws", note: "Tableau Server on AWS at Infosys" },
      ],
    },
    {
      ring: "bronze", title: "Governance, BI and engineering",
      items: [
        { name: "Microsoft Purview", logo: "purview", note: "Catalogue, lineage, compliance" },
        { name: "Entra managed identities", logo: "managedid", note: "Secret-less service and agent access" },
        { name: "Microsoft Defender", logo: "defender", note: "Platform security baseline" },
        { name: "Power BI", logo: "powerbi", note: "Service Owner: 36,000 reports" },
        { name: "Power Apps", logo: "powerapps", note: "Governed self-service" },
        { name: "Tableau", logo: "tableau", note: "Certified analyst and server associate" },
        { name: "Qlik", logo: "qlik", note: "QlikView and Qlik Sense administration" },
        { name: "Alteryx", logo: "alteryx", note: "Designer Core certified; now decommissioning" },
        { name: "Azure DevOps", logo: "azuredevops", note: "CI/CD for data and Power Platform" },
        { name: "GitLab", logo: "gitlab", note: "CI/CD pipelines" },
        { name: "Python", logo: "python", note: "Automation and data processing" },
        { name: "PowerShell", logo: "powershell", note: "Platform and audit automation" },
        { name: "Jira", logo: "jira", note: "Agile delivery" },
        { name: "ServiceNow", logo: "servicenow", note: "Service management" },
      ],
    },
  ],

  // "The person behind the platform": pinned statements that change as you scroll.
  story: [
    { title: "Schooled in Gujarati medium.", text: "My TEDx talk is about why that turned out to be an advantage." },
    { title: "Trained on satellite data.", text: "M.Tech research at ISRO's Space Applications Centre: orbit identification and machine-learning classification for the OCEANSAT-2 scatterometer." },
    { title: "Ten years in global banks.", text: "Barclays, HSBC, Deutsche Bank and UBS: from BI platforms to enterprise AI." },
    { title: "Still a competitor.", text: "District champion swimmer: 400 m and 100 m freestyle, 50 m butterfly." },
  ],

  experience: [
    {
      org: "UBS", logo: "ubs", role: "Associate Director – Lead, Microsoft Fabric stream", start: "2023", end: "Present", place: "Pune",
      points: [
        "Own the strategy, roadmap and USD 4.8M budget for the Microsoft Fabric and Azure platform: 150K users, 4,000+ workspaces, 36K reports, 72.3 TB. I lead a team of 14 (8 internal, 6 vendor).",
        "Leading the migration from Databricks and Denodo to Fabric (60% complete), and decommissioning Alteryx and Azure Data Factory, which saves USD 6.33M a year.",
        "Lead agent adoption for 140K Microsoft 365 Copilot users. Delivered 40 personal agents and 3 live team agents; one saves about 18 hours a week on outage claims to Microsoft.",
        "Rolled out Microsoft Purview and Fabric outbound access protection. Built governed self-service Power Platform delivered through CI/CD.",
        "Tableau-to-Power BI migration saved USD 1.6M in licences; Premium-to-Fabric capacity optimisation saved USD 654K.",
      ],
    },
    {
      org: "Deutsche Bank", logo: "deutschebank", role: "Associate – BI Platforms & Cloud Analytics", start: "2021", end: "2023", place: "Pune",
      points: [
        "Decommissioned legacy QlikView and consolidated BI onto Azure, Power BI and Alteryx, avoiding USD 1.2M in costs.",
        "Defined BI Centre of Excellence standards: Power BI tenant governance, capacity design, modelling and DevOps.",
        "Designed the Azure analytics architecture and set up Tableau on Google Cloud, with automated governance.",
      ],
    },
    {
      org: "Salesforce", logo: "salesforce", role: "Success Agent Tier 2 – Tableau", start: "2020", end: "2021", place: "Pune",
      points: ["Tier 2 technical support for enterprise Tableau customers."],
    },
    {
      org: "HSBC", logo: "hsbc", role: "Senior Analyst – Cybersecurity Analytics", start: "2019", end: "2020", place: "Pune",
      points: [
        "Built cybersecurity KPI and KRI dashboards for the Comet security programme.",
        "Recognised as Divisional Champion for data-driven initiatives.",
      ],
    },
    {
      org: "Barclays", logo: "barclays", role: "Business Analyst II – BI Platforms", start: "2017", end: "2019", place: "Pune",
      points: [
        "Cut BI query execution time by 20% and development time by 10% through tuning and Jenkins automation.",
        "Administered QlikView, Qlik Sense, Tableau Server, SAP BO and SSRS for Finance, Credit Risk and Fraud analytics.",
      ],
    },
    {
      org: "Infosys", logo: "infosys", role: "Systems Engineer", start: "2016", end: "2017", place: "Pune",
      points: ["Built and administered Tableau Server on AWS for a leading US farm-equipment company; automated server operations and upgrades."],
    },
    {
      org: "ISRO", logo: "isro", role: "M.Tech Trainee, Space Applications Centre", start: "2015", end: "2016", place: "Ahmedabad",
      points: ["OCEANSAT-2 project: built orbit-identification methods (pattern-based and fuzzy logic) and a machine-learning land–sea classifier for scatterometer data, for ISRO's data-quality evaluation. Four papers, including one in Procedia Computer Science (Elsevier)."],
    },
  ],

  repos: [
    { name: "copilot-solutions-lab", url: "https://github.com/muditdholakia/copilot-solutions-lab", text: "Copilot Studio and Microsoft 365 agent specifications with responsible-AI evaluation fixtures.", logo: "copilotstudio" },
    { name: "microsoft-fabric-labs", url: "https://github.com/muditdholakia/microsoft-fabric-labs", text: "Synthetic sales ingestion and semantic-model learning labs for Microsoft Fabric.", logo: "fabric" },
    { name: "m365-automation-toolkit", url: "https://github.com/muditdholakia/m365-automation-toolkit", text: "Read-only Microsoft Graph reporting and Power Automate / Logic Apps workflow recipes.", logo: "powerautomate" },
    { name: "azure-functions-recipes", url: "https://github.com/muditdholakia/azure-functions-recipes", text: "Python v2 Azure Functions recipes: HTTP, timer, queue, Event Grid, Service Bus and Graph notifications.", logo: "functions" },
    { name: "tableau-project-gallery", url: "https://github.com/muditdholakia/tableau-project-gallery", text: "A synthetic-sales dashboard blueprint and a Tableau Embedding API v3 example.", logo: "tableau" },
  ],

  talks: {
    tedx: {
      title: "Language as a Bridge, Not a Barrier",
      where: "TEDxJSPMRSCOE, April 2024",
      text: "On growing up in Gujarati-medium schooling, and why the resilience built in a regional language travels globally.",
      youtubeId: "YGJe1lJnUXc",
      coverage: "https://wimwian.iima.ac.in/mudit-dholakia-gives-a-talk-about-language-as-a-bridge-not-a-barrier-at-tedxjspmrscoe/",
    },
    ieee: {
      title: "Decoding the Data Professional",
      where: "Guest speaker, IEEE Pune Section",
      text: "Invited to IEEE Pune Section's Beyond Conversations series to set out a roadmap to data engineering.",
      youtubeId: "N2Z-7zmc0mo",
      thumb: "maxresdefault",
    },
    podcast: {
      title: "Career Crossroads of Choice",
      where: "Stutispeaks with Stuti Gogia",
      text: "Guest episode on Stuti Gogia's interview podcast, which learns from guests' career journeys.",
      url: "https://creators.spotify.com/pod/profile/stuti-gogia/episodes/Career-Crossroads-of-Choice---ft--Mudit-Dholakia-e2ju254",
    },
    // Source: ResearchGate profile (November 2026): 5 publications, 188 reads, 4 citations.
    publications: {
      note: "5 publications, 188 reads and 4 citations on ResearchGate.",
      profile: "https://www.researchgate.net/profile/Mudit-Dholakia",
      items: [
        { title: "Pattern based orbit identification for scatterometer level-0 signal images", year: "2016", venue: "Procedia Computer Science (Elsevier)" },
        { title: "Analytical approach for identification of orbits from scatterometer level-0 noise images", year: "2016", venue: "International Journal of Computer Applications" },
        { title: "Land–sea classification using machine learning technique for scatterometer L1B globe", year: "2016", venue: "Conference paper" },
        { title: "A novel approach of orbit identification from level-0 data based on level-1B convention for scatterometer using fuzzy logic", year: "2016", venue: "Conference paper, built for ISRO's data-quality evaluation" },
        { title: "Distributed network routing algorithms table for small world networks", year: "2014", venue: "Article" },
      ],
    },
  },

  education: [
    { title: "Accelerated General Management Programme (AGMP)", org: "Indian Institute of Management Ahmedabad", years: "2022–2023", note: "Grade S+", logo: "iima" },
    { title: "Certificate programme in AI: Data Science & Machine Learning", org: "MIT Professional Education", years: "2024", note: "", logo: "mit" },
    { title: "M.Tech, Computer Engineering", org: "Dharmsinh Desai University", years: "2014–2016", note: "CGPA 7.79 · TCS Best Student Award", logo: "tcs" },
    { title: "B.E., Computer Engineering", org: "V.V.P. Engineering College, Gujarat Technological University", years: "2010–2014", note: "CGPA 9.0", logo: null },
  ],

  certifications: [
    { name: "Azure Solutions Architect Expert", code: "AZ-305", by: "Microsoft", badge: "mscert_expert" },
    { name: "Fabric Analytics Engineer Associate", code: "DP-600", by: "Microsoft", badge: "mscert_associate" },
    { name: "Power BI Data Analyst Associate", code: "PL-300", by: "Microsoft", badge: "mscert_associate" },
    { name: "Copilot & Agent Administration Fundamentals", by: "Microsoft", badge: "mscert_fundamentals" },
    { name: "Azure AI Fundamentals", code: "AI-900", by: "Microsoft", badge: "mscert_fundamentals" },
    { name: "Power Platform Fundamentals", code: "PL-900", by: "Microsoft", badge: "mscert_fundamentals" },
    { name: "Databricks Fundamentals", by: "Databricks", badge: "databricks" },
    { name: "Certified Scrum Product Owner", code: "CSPO", by: "Scrum Alliance", badge: "scrumalliance" },
    { name: "Tableau Certified Data Analyst", by: "Tableau", badge: "tableau" },
    { name: "Tableau Server Certified Associate", by: "Tableau", badge: "tableau" },
    { name: "Alteryx Designer Core", by: "Alteryx", badge: "alteryx" },
    { name: "UBS Certified Product Manager", by: "UBS", badge: "ubs" },
    { name: "UBS Certified Engineer – Gold", by: "UBS", badge: "ubs" },
    { name: "AI Citizen", by: "UBS", badge: "ubs" },
    { name: "Tableau Executive Sponsor", by: "Listed on LinkedIn", badge: "tableau" },
  ],

  recognition: [
    "TCS Best Student Award, M.Tech",
    "Divisional Champion for data-driven initiatives, HSBC",
    "UBS Certified Engineer, Gold level",
    "District champion swimmer: 400 m and 100 m freestyle, 50 m butterfly",
  ],

  community: [
    "DE&I Champion at Deutsche Bank and UBS: hosted sessions on diversity, equality and mental well-being",
    "Hackathon volunteer, UBS (2023)",
    "Graduate recruitment panel, Deutsche Bank (2021–2023)",
  ],

  languages: "English (full professional), Hindi and Gujarati (native), Marathi (elementary)",
};
