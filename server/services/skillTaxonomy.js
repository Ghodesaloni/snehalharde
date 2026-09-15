/**
 * Skill Taxonomy, Normalization, and Categorization Engine
 * Provides deterministic canonical normalization, alias mapping, category assignment,
 * and domain signal weights without hallucinating unmentioned skills.
 */

// Canonical Skill Dictionary with Aliases, Categories, and Domain Affinities
const SKILL_DEFINITIONS = [
  // Programming Languages
  {
    name: "Python",
    category: "Programming Languages",
    aliases: ["python", "python3", "py"],
    domains: { "Data Science": 8, "Machine Learning": 8, "Software Development": 7, "Web Development": 6, "Data Analytics": 6 }
  },
  {
    name: "JavaScript",
    category: "Programming Languages",
    aliases: ["javascript", "js", "ecmascript", "es6", "es2015", "es2020"],
    domains: { "Software Development": 8, "Web Development": 10, "Mobile Development": 5 }
  },
  {
    name: "TypeScript",
    category: "Programming Languages",
    aliases: ["typescript", "ts"],
    domains: { "Software Development": 9, "Web Development": 10 }
  },
  {
    name: "Java",
    category: "Programming Languages",
    aliases: ["java", "java8", "java11", "java17", "java21", "core java"],
    domains: { "Software Development": 10, "Web Development": 7, "Mobile Development": 6 }
  },
  {
    name: "C++",
    category: "Programming Languages",
    aliases: ["c++", "cpp"],
    domains: { "Software Development": 9, "Engineering": 8, "Gaming": 8 }
  },
  {
    name: "C#",
    category: "Programming Languages",
    aliases: ["c#", "csharp", "c-sharp", ".net", "dotnet"],
    domains: { "Software Development": 9, "Web Development": 8 }
  },
  {
    name: "Go",
    category: "Programming Languages",
    aliases: ["golang", "go language"],
    domains: { "Software Development": 9, "Cloud Computing": 8, "DevOps": 8 }
  },
  {
    name: "Rust",
    category: "Programming Languages",
    aliases: ["rust", "rustlang"],
    domains: { "Software Development": 9, "Cybersecurity": 7 }
  },
  {
    name: "PHP",
    category: "Programming Languages",
    aliases: ["php", "php7", "php8"],
    domains: { "Software Development": 7, "Web Development": 9 }
  },
  {
    name: "SQL",
    category: "Databases",
    aliases: ["sql", "structured query language", "transact-sql", "t-sql", "pl/sql", "plsql"],
    domains: { "Data Analytics": 9, "Data Science": 8, "Software Development": 8, "Finance": 5 }
  },
  {
    name: "R",
    category: "Programming Languages",
    aliases: ["r programming", "r language", "r-project"],
    domains: { "Data Science": 9, "Data Analytics": 8, "Research": 8 }
  },
  {
    name: "HTML/CSS",
    category: "Frontend",
    aliases: ["html", "html5", "css", "css3", "html/css"],
    domains: { "Web Development": 10, "Software Development": 7, "UI/UX Design": 5 }
  },
  {
    name: "Swift",
    category: "Programming Languages",
    aliases: ["swift", "swiftui", "ios development"],
    domains: { "Mobile Development": 10, "Software Development": 8 }
  },
  {
    name: "Kotlin",
    category: "Programming Languages",
    aliases: ["kotlin", "android development"],
    domains: { "Mobile Development": 10, "Software Development": 8 }
  },

  // Frontend Frameworks & Libraries
  {
    name: "React",
    category: "Frontend",
    aliases: ["react", "reactjs", "react.js", "react js"],
    domains: { "Web Development": 10, "Software Development": 9 }
  },
  {
    name: "Next.js",
    category: "Frontend",
    aliases: ["next.js", "nextjs", "next js"],
    domains: { "Web Development": 10, "Software Development": 8 }
  },
  {
    name: "Vue.js",
    category: "Frontend",
    aliases: ["vue", "vue.js", "vuejs", "vue 3", "nuxt", "nuxtjs"],
    domains: { "Web Development": 10, "Software Development": 8 }
  },
  {
    name: "Angular",
    category: "Frontend",
    aliases: ["angular", "angularjs", "angular 2+"],
    domains: { "Web Development": 10, "Software Development": 8 }
  },
  {
    name: "Tailwind CSS",
    category: "Frontend",
    aliases: ["tailwind", "tailwindcss", "tailwind css"],
    domains: { "Web Development": 9, "UI/UX Design": 4 }
  },
  {
    name: "Redux",
    category: "Frontend",
    aliases: ["redux", "redux toolkit", "rtk"],
    domains: { "Web Development": 9, "Software Development": 7 }
  },

  // Backend Frameworks
  {
    name: "Node.js",
    category: "Backend",
    aliases: ["node", "node.js", "nodejs", "node js"],
    domains: { "Software Development": 9, "Web Development": 10 }
  },
  {
    name: "Express.js",
    category: "Backend",
    aliases: ["express", "express.js", "expressjs", "express js"],
    domains: { "Software Development": 9, "Web Development": 9 }
  },
  {
    name: "Django",
    category: "Backend",
    aliases: ["django", "django rest framework", "drf"],
    domains: { "Web Development": 9, "Software Development": 9 }
  },
  {
    name: "Flask",
    category: "Backend",
    aliases: ["flask", "flask-restful"],
    domains: { "Web Development": 8, "Software Development": 8, "Data Science": 5 }
  },
  {
    name: "FastAPI",
    category: "Backend",
    aliases: ["fastapi", "fast api"],
    domains: { "Web Development": 9, "Software Development": 9, "Machine Learning": 7 }
  },
  {
    name: "Spring Boot",
    category: "Backend",
    aliases: ["spring", "spring boot", "springboot", "spring mvc"],
    domains: { "Software Development": 10, "Web Development": 8 }
  },
  {
    name: "REST APIs",
    category: "Backend",
    aliases: ["rest api", "rest apis", "restful api", "restful apis", "restful services", "web services"],
    domains: { "Software Development": 9, "Web Development": 9 }
  },
  {
    name: "GraphQL",
    category: "Backend",
    aliases: ["graphql", "apollo graphql"],
    domains: { "Software Development": 8, "Web Development": 8 }
  },
  {
    name: "Microservices",
    category: "Backend",
    aliases: ["microservices", "microservice architecture", "distributed systems"],
    domains: { "Software Development": 10, "Cloud Computing": 8 }
  },

  // Data Science, Machine Learning & AI
  {
    name: "Machine Learning",
    category: "Data Science & AI",
    aliases: ["machine learning", "ml", "supervised learning", "unsupervised learning", "reinforcement learning"],
    domains: { "Data Science": 10, "Machine Learning": 10, "Artificial Intelligence": 10 }
  },
  {
    name: "Deep Learning",
    category: "Data Science & AI",
    aliases: ["deep learning", "dl", "neural networks", "ann", "cnn", "rnn", "lstm"],
    domains: { "Machine Learning": 10, "Artificial Intelligence": 10, "Data Science": 9 }
  },
  {
    name: "Natural Language Processing",
    category: "Data Science & AI",
    aliases: ["natural language processing", "nlp", "text mining", "ner", "sentiment analysis", "spacy", "nltk"],
    domains: { "Artificial Intelligence": 10, "Machine Learning": 10, "Data Science": 9 }
  },
  {
    name: "Computer Vision",
    category: "Data Science & AI",
    aliases: ["computer vision", "cv", "opencv", "image recognition", "object detection", "yolo"],
    domains: { "Artificial Intelligence": 10, "Machine Learning": 10, "Data Science": 8 }
  },
  {
    name: "TensorFlow",
    category: "Data Science & AI",
    aliases: ["tensorflow", "tf", "tf2"],
    domains: { "Machine Learning": 10, "Artificial Intelligence": 10, "Data Science": 9 }
  },
  {
    name: "PyTorch",
    category: "Data Science & AI",
    aliases: ["pytorch", "torch"],
    domains: { "Machine Learning": 10, "Artificial Intelligence": 10, "Data Science": 9 }
  },
  {
    name: "Scikit-Learn",
    category: "Data Science & AI",
    aliases: ["scikit-learn", "scikit learn", "sklearn"],
    domains: { "Data Science": 10, "Machine Learning": 9 }
  },
  {
    name: "Pandas",
    category: "Data Science & AI",
    aliases: ["pandas"],
    domains: { "Data Science": 9, "Data Analytics": 9 }
  },
  {
    name: "NumPy",
    category: "Data Science & AI",
    aliases: ["numpy"],
    domains: { "Data Science": 9, "Machine Learning": 8, "Data Analytics": 7 }
  },
  {
    name: "Generative AI",
    category: "Data Science & AI",
    aliases: ["generative ai", "genai", "llm", "large language models", "prompt engineering", "langchain", "rag"],
    domains: { "Artificial Intelligence": 10, "Machine Learning": 9, "Data Science": 8 }
  },
  {
    name: "Data Modeling",
    category: "Data Science & AI",
    aliases: ["data modeling", "predictive modeling", "statistical modeling"],
    domains: { "Data Science": 10, "Data Analytics": 9, "Finance": 6 }
  },

  // Databases & Big Data
  {
    name: "PostgreSQL",
    category: "Databases",
    aliases: ["postgresql", "postgres", "psql"],
    domains: { "Software Development": 9, "Data Analytics": 7, "Web Development": 8 }
  },
  {
    name: "MySQL",
    category: "Databases",
    aliases: ["mysql", "mariadb"],
    domains: { "Software Development": 8, "Web Development": 8 }
  },
  {
    name: "MongoDB",
    category: "Databases",
    aliases: ["mongodb", "mongo", "nosql"],
    domains: { "Software Development": 9, "Web Development": 8 }
  },
  {
    name: "Redis",
    category: "Databases",
    aliases: ["redis", "in-memory cache", "caching"],
    domains: { "Software Development": 9, "Cloud Computing": 7 }
  },
  {
    name: "Snowflake",
    category: "Databases",
    aliases: ["snowflake", "data warehouse", "dwh"],
    domains: { "Data Analytics": 10, "Data Science": 8, "Cloud Computing": 7 }
  },
  {
    name: "BigQuery",
    category: "Databases",
    aliases: ["bigquery", "google bigquery", "bq"],
    domains: { "Data Analytics": 10, "Data Science": 8, "Cloud Computing": 7 }
  },
  {
    name: "Apache Spark",
    category: "Databases",
    aliases: ["spark", "pyspark", "apache spark", "hadoop"],
    domains: { "Data Science": 9, "Data Analytics": 8, "Cloud Computing": 7 }
  },

  // Cloud & DevOps
  {
    name: "AWS",
    category: "Cloud & DevOps",
    aliases: ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudformation", "iam"],
    domains: { "Cloud Computing": 10, "DevOps": 9, "Software Development": 7 }
  },
  {
    name: "Google Cloud Platform",
    category: "Cloud & DevOps",
    aliases: ["gcp", "google cloud", "google cloud platform"],
    domains: { "Cloud Computing": 10, "DevOps": 9 }
  },
  {
    name: "Azure",
    category: "Cloud & DevOps",
    aliases: ["azure", "microsoft azure"],
    domains: { "Cloud Computing": 10, "DevOps": 9 }
  },
  {
    name: "Docker",
    category: "Cloud & DevOps",
    aliases: ["docker", "containerization", "containers"],
    domains: { "DevOps": 10, "Cloud Computing": 9, "Software Development": 8 }
  },
  {
    name: "Kubernetes",
    category: "Cloud & DevOps",
    aliases: ["kubernetes", "k8s", "helm"],
    domains: { "DevOps": 10, "Cloud Computing": 9 }
  },
  {
    name: "CI/CD",
    category: "Cloud & DevOps",
    aliases: ["ci/cd", "ci cd", "continuous integration", "continuous delivery", "github actions", "gitlab ci", "jenkins"],
    domains: { "DevOps": 10, "Software Development": 8 }
  },
  {
    name: "Terraform",
    category: "Cloud & DevOps",
    aliases: ["terraform", "iac", "infrastructure as code"],
    domains: { "DevOps": 10, "Cloud Computing": 9 }
  },
  {
    name: "Linux",
    category: "Cloud & DevOps",
    aliases: ["linux", "ubuntu", "centos", "bash", "shell scripting"],
    domains: { "DevOps": 9, "Cybersecurity": 8, "Software Development": 7 }
  },

  // QA & Testing
  {
    name: "Selenium",
    category: "QA & Testing",
    aliases: ["selenium", "selenium webdriver", "selenium grid"],
    domains: { "QA / Testing": 10, "Software Development": 5 }
  },
  {
    name: "Cypress",
    category: "QA & Testing",
    aliases: ["cypress", "cypress.io"],
    domains: { "QA / Testing": 10, "Web Development": 6 }
  },
  {
    name: "Test Automation",
    category: "QA & Testing",
    aliases: ["test automation", "automated testing", "automation testing", "test cases", "test suites", "qa automation", "playwright", "appium"],
    domains: { "QA / Testing": 10 }
  },
  {
    name: "Manual Testing",
    category: "QA & Testing",
    aliases: ["manual testing", "regression testing", "sanity testing", "smoke testing", "black box testing", "jira for bug tracking"],
    domains: { "QA / Testing": 9 }
  },

  // Data & Business Analytics
  {
    name: "Power BI",
    category: "Data Analytics",
    aliases: ["power bi", "powerbi", "power-bi", "dax", "power query"],
    domains: { "Data Analytics": 10, "Business Analytics": 10, "Finance": 6 }
  },
  {
    name: "Tableau",
    category: "Data Analytics",
    aliases: ["tableau", "tableau desktop", "tableau server"],
    domains: { "Data Analytics": 10, "Business Analytics": 9 }
  },
  {
    name: "Data Visualization",
    category: "Data Analytics",
    aliases: ["data visualization", "dashboards", "business intelligence", "bi reporting", "kpi reporting"],
    domains: { "Data Analytics": 10, "Business Analytics": 9, "Operations": 6 }
  },
  {
    name: "ETL",
    category: "Data Analytics",
    aliases: ["etl", "extract transform load", "data pipelines", "airflow"],
    domains: { "Data Analytics": 9, "Data Science": 8, "Cloud Computing": 6 }
  },

  // Finance & Accounting
  {
    name: "Financial Modeling",
    category: "Finance & Accounting",
    aliases: ["financial modeling", "financial model", "dcf", "discounted cash flow", "lbo", "three-statement model"],
    domains: { "Finance": 10, "Banking": 9, "Accounting": 7 }
  },
  {
    name: "Financial Analysis",
    category: "Finance & Accounting",
    aliases: ["financial analysis", "financial statement analysis", "variance analysis", "ratio analysis"],
    domains: { "Finance": 10, "Accounting": 8, "Banking": 8 }
  },
  {
    name: "Accounting",
    category: "Finance & Accounting",
    aliases: ["accounting", "general ledger", "accounts payable", "accounts receivable", "reconciliation", "journal entries"],
    domains: { "Accounting": 10, "Finance": 8 }
  },
  {
    name: "Auditing",
    category: "Finance & Accounting",
    aliases: ["auditing", "audit", "internal audit", "statutory audit", "tax audit", "sox compliance"],
    domains: { "Accounting": 10, "Finance": 8 }
  },
  {
    name: "Taxation",
    category: "Finance & Accounting",
    aliases: ["taxation", "tax", "income tax", "gst", "vat", "corporate tax", "tax planning"],
    domains: { "Accounting": 10, "Finance": 7 }
  },
  {
    name: "Valuation",
    category: "Finance & Accounting",
    aliases: ["valuation", "company valuation", "equity valuation", "equity research", "m&a valuation"],
    domains: { "Finance": 10, "Banking": 9 }
  },
  {
    name: "Excel",
    category: "Finance & Accounting",
    aliases: ["excel", "advanced excel", "vlookup", "hlookup", "xlookup", "pivot tables", "vba", "macros"],
    domains: { "Finance": 9, "Accounting": 9, "Data Analytics": 7, "Operations": 7 }
  },
  {
    name: "QuickBooks",
    category: "Finance & Accounting",
    aliases: ["quickbooks", "quickbooks online", "qbo", "tally", "tally erp", "tally prime", "sap fico"],
    domains: { "Accounting": 10, "Finance": 7 }
  },
  {
    name: "Bloomberg",
    category: "Finance & Accounting",
    aliases: ["bloomberg", "bloomberg terminal", "capital iq", "factset"],
    domains: { "Finance": 10, "Banking": 10 }
  },
  {
    name: "Risk Management",
    category: "Finance & Accounting",
    aliases: ["risk management", "credit risk", "market risk", "operational risk", "financial risk"],
    domains: { "Finance": 9, "Banking": 10 }
  },

  // UI/UX Design
  {
    name: "Figma",
    category: "UI/UX Design",
    aliases: ["figma", "sketch", "adobe xd", "invision"],
    domains: { "UI/UX Design": 10, "Product Management": 5 }
  },
  {
    name: "UX Research",
    category: "UI/UX Design",
    aliases: ["ux research", "user research", "usability testing", "user personas", "journey mapping", "user interviews"],
    domains: { "UI/UX Design": 10, "Product Management": 7 }
  },
  {
    name: "Wireframing",
    category: "UI/UX Design",
    aliases: ["wireframing", "wireframes", "prototyping", "interactive prototypes", "mockups"],
    domains: { "UI/UX Design": 10, "Product Management": 6 }
  },
  {
    name: "Design Systems",
    category: "UI/UX Design",
    aliases: ["design systems", "ui components", "atomic design", "style guides"],
    domains: { "UI/UX Design": 10, "Web Development": 6 }
  },

  // HR & Recruitment
  {
    name: "Recruitment",
    category: "Human Resources",
    aliases: ["recruitment", "talent acquisition", "full life cycle recruiting", "sourcing", "tech sourcing", "candidate screening", "headhunting"],
    domains: { "Recruitment": 10, "Human Resources": 10 }
  },
  {
    name: "HRIS",
    category: "Human Resources",
    aliases: ["hris", "workday", "bamboohr", "greenhouse", "lever", "applicant tracking", "ats systems"],
    domains: { "Human Resources": 10, "Recruitment": 9 }
  },
  {
    name: "Employee Relations",
    category: "Human Resources",
    aliases: ["employee relations", "performance management", "hr policies", "onboarding", "talent management", "employee engagement"],
    domains: { "Human Resources": 10 }
  },

  // Cybersecurity
  {
    name: "Cybersecurity",
    category: "Cybersecurity",
    aliases: ["cybersecurity", "information security", "infosec", "network security", "penetration testing", "vulnerability assessment", "siem", "soc"],
    domains: { "Cybersecurity": 10, "Cloud Computing": 6 }
  },

  // Project & Product Management
  {
    name: "Agile / Scrum",
    category: "Management",
    aliases: ["agile", "scrum", "scrum master", "kanban", "sprint planning", "jira"],
    domains: { "Project Management": 9, "Product Management": 8, "Software Development": 6 }
  },
  {
    name: "Product Strategy",
    category: "Management",
    aliases: ["product strategy", "product roadmap", "product discovery", "prds", "user stories", "market research"],
    domains: { "Product Management": 10, "Business Analytics": 6 }
  },

  // Engineering & Hardware
  {
    name: "SolidWorks",
    category: "Engineering",
    aliases: ["solidworks", "catia", "creo", "autocad", "cad modeling"],
    domains: { "Engineering": 10 }
  },
  {
    name: "FEA / ANSYS",
    category: "Engineering",
    aliases: ["fea", "ansys", "finite element analysis", "thermal analysis", "fluid mechanics", "thermodynamics"],
    domains: { "Engineering": 10 }
  }
];

// Build Fast Normalized Lookups
const ALIAS_LOOKUP = new Map();
const CANONICAL_MAP = new Map();

for (const def of SKILL_DEFINITIONS) {
  CANONICAL_MAP.set(def.name.toLowerCase(), def);
  for (const alias of def.aliases) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), def);
  }
}

/**
 * Normalizes any skill input string to its canonical skill object
 * ReactJS -> { original: "ReactJS", normalized: "React", category: "Frontend", confidence: 0.98 }
 */
function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== "string") {
    return null;
  }
  const clean = rawSkill.trim();
  if (clean.length === 0) return null;
  const lower = clean.toLowerCase();

  // 1. Direct Alias or Canonical Match
  if (ALIAS_LOOKUP.has(lower)) {
    const def = ALIAS_LOOKUP.get(lower);
    return {
      original: clean,
      normalized: def.name,
      category: def.category,
      domains: def.domains,
      confidence: lower === def.name.toLowerCase() ? 1.0 : 0.98
    };
  }

  // 2. Stripped Punctuation Match (e.g. "React.js" -> "react js")
  const stripped = lower.replace(/[\.-]/g, " ").replace(/\s+/g, " ").trim();
  if (ALIAS_LOOKUP.has(stripped)) {
    const def = ALIAS_LOOKUP.get(stripped);
    return {
      original: clean,
      normalized: def.name,
      category: def.category,
      domains: def.domains,
      confidence: 0.95
    };
  }

  // 3. Fallback: Unknown / Domain Specific Skill
  return {
    original: clean,
    normalized: clean.charAt(0).toUpperCase() + clean.slice(1),
    category: "Domain Specific",
    domains: {},
    confidence: 0.85
  };
}

/**
 * Deterministically scans raw resume text for all known skills with boundary protection.
 * Prevents false positives like "c" matching "css" or "r" matching "react".
 */
function extractNormalizedSkills(text) {
  if (!text || typeof text !== "string") return [];
  const textLower = text.toLowerCase();
  const matched = new Map();

  for (const def of SKILL_DEFINITIONS) {
    for (const alias of def.aliases) {
      const aliasLower = alias.toLowerCase();
      // Guard short strings: required word boundaries
      let pattern;
      if (aliasLower.length <= 2) {
        pattern = new RegExp(`(?:^|[^a-zA-Z0-9#+])(${escapeRegex(aliasLower)})(?=[^a-zA-Z0-9#+]|$)`, "i");
      } else {
        pattern = new RegExp(`(?:^|[^a-zA-Z0-9#+])(${escapeRegex(aliasLower)})(?=[^a-zA-Z0-9#+]|$)`, "i");
      }

      const match = textLower.match(pattern);
      if (match) {
        if (!matched.has(def.name)) {
          matched.set(def.name, {
            original: match[1] || alias,
            normalized: def.name,
            category: def.category,
            domains: def.domains,
            confidence: 0.96
          });
        }
        break;
      }
    }
  }

  return Array.from(matched.values());
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  SKILL_DEFINITIONS,
  normalizeSkill,
  extractNormalizedSkills
};
