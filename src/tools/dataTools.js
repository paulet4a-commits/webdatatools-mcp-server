// Tools backed by data-lookup Actors: company_profile, check_email_security, validate_emails, package_health.
import { toArray, pickDefined } from "./util.js";

export const companyProfile = {
  name: "company_profile",
  actor: "webdatatools~company-360",
  description:
    "Build a one-stop company profile for a domain: contacts, tech stack, DNS/e-mail security, TLS/security grade, " +
    "hiring signals, Wikidata company facts (HQ, employees, revenue, founders) and an SEO audit. " +
    "Turn off sections you don't need to make the run cheaper and faster.",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "A single company domain, e.g. apify.com." },
      domains: {
        type: "array",
        items: { type: "string" },
        description: "Multiple company domains (one result row per domain). Overrides `domain` when non-empty.",
      },
      includeContacts: { type: "boolean", default: true, description: "Include e-mails, phone numbers and social links." },
      includeTechStack: { type: "boolean", default: true, description: "Include CMS/e-commerce/analytics/etc. fingerprint." },
      includeEmailSecurity: { type: "boolean", default: true, description: "Include SPF/DMARC, mail provider, registrar, domain age." },
      includeSecurityAudit: { type: "boolean", default: true, description: "Include TLS validity/expiry and HTTP security header grade." },
      includeHiring: { type: "boolean", default: true, description: "Include open job counts / hiring velocity where an ATS board is found." },
      includeCompanyFacts: { type: "boolean", default: true, description: "Include Wikidata facts: HQ, employees, revenue, founders." },
      includeSeo: { type: "boolean", default: true, description: "Include a 0-100 on-page SEO score and issue list for the home page." },
    },
    required: [],
  },
  mapInput(args) {
    const domains = toArray(args.domain, args.domains);
    if (domains.length === 0) throw new Error("Provide either `domain` or a non-empty `domains` array.");
    return pickDefined({
      domains,
      includeContacts: args.includeContacts,
      includeTechStack: args.includeTechStack,
      includeEmailSecurity: args.includeEmailSecurity,
      includeSecurityAudit: args.includeSecurityAudit,
      includeHiring: args.includeHiring,
      includeCompanyFacts: args.includeCompanyFacts,
      includeSeo: args.includeSeo,
    });
  },
};

export const checkEmailSecurity = {
  name: "check_email_security",
  actor: "webdatatools~dns-email-security-checker",
  description:
    "Check a domain's DNS and e-mail security posture: SPF, DMARC, DKIM selector presence, mail/DNS provider, " +
    "registrar and domain age, with an overall 0-100 score.",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "A single domain to check, e.g. apify.com." },
      domains: {
        type: "array",
        items: { type: "string" },
        description: "Multiple domains to check in one call (one result row per domain). Overrides `domain` when non-empty.",
      },
      checkDkim: {
        type: "boolean",
        default: true,
        description: "Probe common DKIM selectors. Costs extra DNS queries per domain but is needed for a full score.",
      },
    },
    required: [],
  },
  mapInput(args) {
    const domains = toArray(args.domain, args.domains);
    if (domains.length === 0) throw new Error("Provide either `domain` or a non-empty `domains` array.");
    return pickDefined({ domains, checkDkim: args.checkDkim });
  },
};

export const validateEmails = {
  name: "validate_emails",
  actor: "webdatatools~email-validator",
  description:
    "Validate a list of e-mail addresses: syntax check, disposable/role-account detection and (optionally) a live " +
    "MX/A DNS lookup to confirm the domain can receive mail. Good for cleaning a lead list before sending.",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "A single e-mail address to validate." },
      emails: {
        type: "array",
        items: { type: "string" },
        description: "Multiple e-mail addresses to validate in one call. Overrides `email` when non-empty.",
      },
      checkMx: {
        type: "boolean",
        default: true,
        description: "Look up MX/A records over DNS-over-HTTPS. Turn off for a faster syntax-only check.",
      },
    },
    required: [],
  },
  mapInput(args) {
    const emails = toArray(args.email, args.emails);
    if (emails.length === 0) throw new Error("Provide either `email` or a non-empty `emails` array.");
    return pickDefined({ emails, checkMx: args.checkMx });
  },
};

export const packageHealth = {
  name: "package_health",
  actor: "webdatatools~package-health-checker",
  description:
    "Check the health of npm, PyPI or Crates.io packages: latest version, publish recency, download stats, license, " +
    "and (optionally) GitHub stars/forks/open-issues/archived status. Prefix a name with its registry, e.g. pypi:requests.",
  inputSchema: {
    type: "object",
    properties: {
      package: { type: "string", description: "A single package to check, e.g. npm:react or pypi:requests." },
      packages: {
        type: "array",
        items: { type: "string" },
        description: "Multiple packages to check in one call. Overrides `package` when non-empty.",
      },
      defaultRegistry: {
        type: "string",
        enum: ["npm", "pypi", "crates"],
        default: "npm",
        description: "Registry to assume for bare package names with no prefix.",
      },
      enrichGithub: {
        type: "boolean",
        default: true,
        description: "Add GitHub stars/forks/open-issues/archived/last-push when the package links to a GitHub repo.",
      },
    },
    required: [],
  },
  mapInput(args) {
    const packages = toArray(args.package, args.packages);
    if (packages.length === 0) throw new Error("Provide either `package` or a non-empty `packages` array.");
    return pickDefined({
      packages,
      defaultRegistry: args.defaultRegistry,
      enrichGithub: args.enrichGithub,
    });
  },
};
