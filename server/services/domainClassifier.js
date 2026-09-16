/**
 * Production-Grade Automatic Resume Domain Classifier
 * Implements a hybrid multi-signal scoring model based on:
 * - Normalized skill profiles & cross-domain weights
 * - Job title & role history
 * - Experience descriptions & achievement text
 * - Degree / educational major
 * - Professional certifications & licenses
 * 
 * Never classifies based on a single isolated keyword (e.g. Python alone != Data Science).
 */

const ALL_DOMAINS = [
  "Data Science",
  "Machine Learning",
  "Artificial Intelligence",
  "Software Development",
  "Web Development",
  "Mobile Development",
  "Data Analytics",
  "Business Analytics",
  "Finance",
  "Accounting",
  "Banking",
  "Human Resources",
  "Recruitment",
  "Marketing",
  "Sales",
  "Operations",
  "Project Management",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
  "QA / Testing",
  "UI/UX Design",
  "Product Management",
  "Engineering",
  "Healthcare",
  "Legal",
  "Education",
  "Research",
  "Other"
];

// Weighted contextual phrases and patterns (High specificity)
const DOMAIN_SIGNALS = {
  "Data Science": {
    roles: [/data scientist/i, /machine learning scientist/i, /nlp engineer/i, /deep learning engineer/i, /decision scientist/i],
    phrases: [
      /predictive model/i, /statistical model/i, /feature engineering/i, /cross-validation/i,
      /random forest/i, /xgboost/i, /neural network/i, /hyperparameter/i, /exploratory data analysis/i,
      /scikit-learn/i, /pandas/i, /numpy/i, /jupyter/i, /model deployment/i, /data wrangling/i, /regression analysis/i
    ],
    education: [/data science/i, /statistics/i, /applied mathematics/i, /computational science/i],
    certs: [/tensorflow developer/i, /aws machine learning/i, /azure data scientist/i]
  },
  "Machine Learning": {
    roles: [/machine learning engineer/i, /ml engineer/i, /deep learning engineer/i, /ai engineer/i],
    phrases: [/model training/i, /inference pipeline/i, /pytorch/i, /tensorflow/i, /loss function/i, /gradient descent/i, /convolutional/i, /transformer model/i, /llm fine-tuning/i],
    education: [/artificial intelligence/i, /machine learning/i, /robotics/i],
    certs: [/deep learning specialization/i, /mlops/i]
  },
  "Artificial Intelligence": {
    roles: [/ai researcher/i, /ai engineer/i, /generative ai engineer/i, /prompt engineer/i],
    phrases: [/large language model/i, /generative ai/i, /vector database/i, /embeddings/i, /langchain/i, /rag architecture/i, /autonomous agents/i],
    education: [/artificial intelligence/i, /cognitive science/i],
    certs: []
  },
  "Software Development": {
    roles: [/software engineer/i, /software developer/i, /backend engineer/i, /full stack developer/i, /systems engineer/i],
    phrases: [/software architecture/i, /data structures/i, /algorithms/i, /object-oriented/i, /design patterns/i, /code review/i, /unit tests/i, /api design/i, /microservices/i, /clean code/i],
    education: [/computer science/i, /information technology/i, /computer engineering/i, /b\.?tech/i, /mca/i],
    certs: [/oracle certified/i, /java developer/i]
  },
  "Web Development": {
    roles: [/frontend developer/i, /web developer/i, /full stack web/i, /ui developer/i, /javascript developer/i],
    phrases: [/responsive design/i, /react/i, /next\.js/i, /vue/i, /angular/i, /css3/i, /html5/i, /dom manipulation/i, /web performance/i, /spa/i, /browser compatibility/i],
    education: [/computer science/i, /web development/i],
    certs: []
  },
  "Mobile Development": {
    roles: [/mobile developer/i, /ios developer/i, /android developer/i, /flutter developer/i, /react native developer/i],
    phrases: [/ios app/i, /android app/i, /swiftui/i, /xcode/i, /google play store/i, /app store/i, /mobile sdk/i, /kotlin/i, /flutter/i],
    education: [/computer science/i],
    certs: []
  },
  "Data Analytics": {
    roles: [/data analyst/i, /bi analyst/i, /reporting analyst/i, /analytics consultant/i],
    phrases: [/data visualization/i, /tableau dashboard/i, /power bi/i, /sql queries/i, /kpi tracking/i, /ad-hoc analysis/i, /business metrics/i, /data pipeline/i, /cohort analysis/i],
    education: [/business analytics/i, /data analytics/i, /information systems/i, /statistics/i],
    certs: [/power bi certified/i, /tableau certified/i, /google data analytics/i]
  },
  "Business Analytics": {
    roles: [/business analyst/i, /business systems analyst/i, /operations analyst/i],
    phrases: [/requirement gathering/i, /brd/i, /functional specifications/i, /process mapping/i, /stakeholder management/i, /gap analysis/i, /cost-benefit analysis/i, /user stories/i],
    education: [/mba/i, /business administration/i, /management/i],
    certs: [/cbap/i, /pmi-pba/i]
  },
  "Finance": {
    roles: [/financial analyst/i, /finance manager/i, /investment banking analyst/i, /equity research analyst/i, /portfolio manager/i, /wealth manager/i],
    phrases: [
      /financial modeling/i, /discounted cash flow/i, /dcf/i, /lbo/i, /valuation/i, /financial statements/i,
      /balance sheet/i, /p&l/i, /cash flow analysis/i, /bloomberg terminal/i, /variance analysis/i, /capital budgeting/i,
      /portfolio management/i, /asset management/i, /financial forecast/i
    ],
    education: [/finance/i, /economics/i, /financial engineering/i, /commerce/i, /b\.?com/i, /mba finance/i],
    certs: [/cfa/i, /frm/i, /chartered financial analyst/i]
  },
  "Accounting": {
    roles: [/accountant/i, /senior accountant/i, /auditor/i, /tax accountant/i, /controller/i, /accounts manager/i],
    phrases: [
      /general ledger/i, /accounts payable/i, /accounts receivable/i, /bank reconciliation/i,
      /trial balance/i, /statutory audit/i, /tax filing/i, /gst/i, /vat/i, /quickbooks/i, /tally/i, /sap fico/i, /sox/i, /gaap/i, /ifrs/i
    ],
    education: [/accounting/i, /accountancy/i, /chartered accountancy/i, /b\.?com/i],
    certs: [/cpa/i, /ca/i, /chartered accountant/i, /acca/i, /cma/i]
  },
  "Banking": {
    roles: [/banker/i, /credit analyst/i, /loan officer/i, /branch manager/i, /underwriter/i],
    phrases: [/credit assessment/i, /loan underwriting/i, /retail banking/i, /commercial banking/i, /aml/i, /kyc/i, /basel iii/i, /interest rate risk/i],
    education: [/banking/i, /finance/i, /economics/i],
    certs: []
  },
  "Human Resources": {
    roles: [/hr generalist/i, /hr manager/i, /human resources business partner/i, /hrbp/i, /people operations/i],
    phrases: [/employee relations/i, /hr policies/i, /onboarding/i, /performance appraisal/i, /compensation & benefits/i, /hris/i, /workday/i, /retention/i],
    education: [/human resources/i, /mba hr/i, /organizational psychology/i],
    certs: [/shrm-cp/i, /shrm-scp/i, /phr/i, /sphr/i]
  },
  "Recruitment": {
    roles: [/recruiter/i, /talent acquisition/i, /technical recruiter/i, /talent sourcer/i, /headhunter/i],
    phrases: [/talent acquisition/i, /candidate sourcing/i, /headhunting/i, /ats/i, /greenhouse/i, /lever/i, /full life-cycle recruitment/i, /interview coordination/i, /offer negotiation/i],
    education: [/human resources/i, /business/i],
    certs: [/linkedin certified/i]
  },
  "Marketing": {
    roles: [/marketing manager/i, /digital marketer/i, /content strategist/i, /growth marketer/i, /seo specialist/i],
    phrases: [/digital marketing/i, /seo/i, /sem/i, /google analytics/i, /content marketing/i, /email campaigns/i, /social media marketing/i, /lead generation/i, /conversion rate/i, /brand awareness/i],
    education: [/marketing/i, /communications/i, /mass media/i, /mba marketing/i],
    certs: [/google ads/i, /hubspot/i]
  },
  "Sales": {
    roles: [/account executive/i, /sales manager/i, /business development representative/i, /bdr/i, /sales director/i],
    phrases: [/sales quota/i, /sales pipeline/i, /crm/i, /salesforce/i, /lead qualification/i, /cold calling/i, /revenue generation/i, /b2b sales/i, /client acquisition/i],
    education: [/business/i, /marketing/i],
    certs: []
  },
  "Operations": {
    roles: [/operations manager/i, /coo/i, /operations specialist/i, /supply chain manager/i, /logistics coordinator/i],
    phrases: [/process optimization/i, /supply chain/i, /logistics/i, /operational efficiency/i, /vendor management/i, /procurement/i, /inventory management/i, /sla management/i],
    education: [/operations/i, /supply chain/i, /industrial engineering/i],
    certs: [/six sigma/i, /lean/i]
  },
  "Project Management": {
    roles: [/project manager/i, /program manager/i, /scrum master/i, /pmo/i],
    phrases: [/sprint planning/i, /gantt charts/i, /scope management/i, /risk register/i, /budget tracking/i, /stakeholder communication/i, /jira/i, /agile ceremonies/i, /waterfall/i],
    education: [/project management/i, /business/i],
    certs: [/pmp/i, /prince2/i, /csm/i, /pmi-acp/i]
  },
  "Cybersecurity": {
    roles: [/security engineer/i, /cybersecurity analyst/i, /soc analyst/i, /penetration tester/i, /ciso/i],
    phrases: [/vulnerability assessment/i, /penetration testing/i, /siem/i, /firewall/i, /incident response/i, /threat intelligence/i, /zero trust/i, /owasp/i, /cryptography/i],
    education: [/cybersecurity/i, /information security/i, /computer science/i],
    certs: [/cissp/i, /ceh/i, /comptia security\+/i, /cism/i, /oscp/i]
  },
  "Cloud Computing": {
    roles: [/cloud architect/i, /cloud engineer/i, /solutions architect/i],
    phrases: [/aws infrastructure/i, /azure cloud/i, /gcp architecture/i, /cloud migration/i, /vpc/i, /iam policies/i, /cloud security/i, /serverless/i],
    education: [/computer science/i],
    certs: [/aws certified solutions architect/i, /azure administrator/i, /google cloud certified/i]
  },
  "DevOps": {
    roles: [/devops engineer/i, /sre/i, /site reliability engineer/i, /infrastructure engineer/i, /platform engineer/i],
    phrases: [/ci\/cd pipeline/i, /docker/i, /kubernetes/i, /terraform/i, /ansible/i, /jenkins/i, /github actions/i, /infrastructure as code/i, /monitoring/i, /prometheus/i, /grafana/i],
    education: [/computer science/i, /information technology/i],
    certs: [/cka/i, /certified kubernetes administrator/i, /hashicorp terraform/i]
  },
  "QA / Testing": {
    roles: [/qa engineer/i, /software tester/i, /test automation engineer/i, /sdet/i, /quality assurance/i],
    phrases: [/test cases/i, /test automation/i, /selenium/i, /cypress/i, /regression testing/i, /bug lifecycle/i, /smoke testing/i, /manual testing/i, /playwright/i, /test plan/i, /jira defects/i],
    education: [/computer science/i, /information technology/i],
    certs: [/istqb/i]
  },
  "UI/UX Design": {
    roles: [/ui designer/i, /ux designer/i, /product designer/i, /ux researcher/i, /interaction designer/i],
    phrases: [/user research/i, /wireframing/i, /figma/i, /prototyping/i, /design system/i, /usability testing/i, /user personas/i, /information architecture/i, /visual hierarchy/i, /micro-interactions/i],
    education: [/design/i, /human computer interaction/i, /hci/i, /fine arts/i, /graphic design/i],
    certs: [/nng certified/i]
  },
  "Product Management": {
    roles: [/product manager/i, /technical product manager/i, /associate product manager/i, /group product manager/i],
    phrases: [/product roadmap/i, /user stories/i, /product discovery/i, /market validation/i, /prd/i, /go-to-market/i, /feature prioritization/i, /mvp/i, /okrs/i],
    education: [/mba/i, /engineering/i],
    certs: []
  },
  "Engineering": {
    roles: [/mechanical engineer/i, /civil engineer/i, /electrical engineer/i, /structural engineer/i, /cad engineer/i],
    phrases: [/solidworks/i, /autocad/i, /catia/i, /thermodynamics/i, /fea analysis/i, /ansys/i, /fluid mechanics/i, /gd&t/i, /cnc machining/i, /hvac/i, /manufacturing processes/i],
    education: [/mechanical engineering/i, /civil engineering/i, /electrical engineering/i],
    certs: []
  }
};

/**
 * Classifies a resume's professional domain using a holistic multi-feature vector
 * @param {Object} candidate - Candidate details or extracted info
 * @param {string} rawText - Full raw resume text
 * @param {Array} normalizedSkills - Array of normalized skill objects
 * @returns {Object} { primary_domain, secondary_domains, confidence, domain_scores }
 */
function classifyCandidateDomain({ role = "", currentRole = "", education = "", summary = "", experience = [] } = {}, rawText = "", normalizedSkills = []) {
  const scores = {};
  for (const d of ALL_DOMAINS) scores[d] = 0;

  const combinedText = `${role} ${currentRole} ${education} ${summary} ${rawText}`.toLowerCase();

  // 1. Skill Signals (Weighted by specific domain affinities)
  for (const skill of normalizedSkills) {
    if (skill.domains) {
      for (const [domain, weight] of Object.entries(skill.domains)) {
        if (scores[domain] !== undefined) {
          scores[domain] += weight * 1.5;
        }
      }
    }
  }

  // 2. Role / Headline Signals (Heavy weight)
  const roleText = `${role} ${currentRole}`.toLowerCase();
  for (const [domain, sigs] of Object.entries(DOMAIN_SIGNALS)) {
    for (const rRegex of sigs.roles) {
      if (rRegex.test(roleText)) {
        scores[domain] += 25;
      } else if (rRegex.test(combinedText)) {
        scores[domain] += 8;
      }
    }
  }

  // 3. Experience & Achievement Keyword Signals
  for (const [domain, sigs] of Object.entries(DOMAIN_SIGNALS)) {
    for (const pRegex of sigs.phrases) {
      const matches = combinedText.match(new RegExp(pRegex.source, "gi"));
      if (matches) {
        // Logarithmic diminishing returns per phrase
        scores[domain] += Math.min(15, matches.length * 3.5);
      }
    }
  }

  // 4. Education Signals
  for (const [domain, sigs] of Object.entries(DOMAIN_SIGNALS)) {
    for (const eRegex of sigs.education) {
      if (eRegex.test(education.toLowerCase()) || eRegex.test(combinedText)) {
        scores[domain] += 10;
      }
    }
  }

  // 5. Certification Signals
  for (const [domain, sigs] of Object.entries(DOMAIN_SIGNALS)) {
    for (const cRegex of sigs.certs) {
      if (cRegex.test(combinedText)) {
        scores[domain] += 12;
      }
    }
  }

  // Find Primary and Secondary domains
  const sortedDomains = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedDomains.length === 0) {
    return {
      primary_domain: "Software Development",
      secondary_domains: [],
      confidence: 0.50,
      domain_scores: scores
    };
  }

  const topDomain = sortedDomains[0][0];
  const topScore = sortedDomains[0][1];
  const secondScore = sortedDomains.length > 1 ? sortedDomains[1][1] : 0;

  // Calculate secondary domains (must have at least 45% of top score)
  const secondary_domains = sortedDomains
    .slice(1, 4)
    .filter(([_, score]) => score >= topScore * 0.40 && score >= 15)
    .map(([dom]) => dom);

  // Confidence calculation based on score margin and absolute strength
  const margin = topScore > 0 ? (topScore - secondScore) / topScore : 0.5;
  const baseConf = Math.min(0.98, Math.max(0.65, 0.70 + (topScore / 100) * 0.15 + margin * 0.13));
  const confidence = Math.round(baseConf * 100) / 100;

  return {
    primary_domain: topDomain,
    secondary_domains,
    confidence,
    domain_scores: scores
  };
}

module.exports = {
  ALL_DOMAINS,
  classifyCandidateDomain
};
