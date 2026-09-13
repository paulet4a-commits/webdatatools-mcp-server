import { webSearch, readUrl, googleSearch } from "./searchTools.js";
import { crawlSiteMarkdown, extractContacts, detectTechStack } from "./siteTools.js";
import { companyProfile, checkEmailSecurity, validateEmails, packageHealth } from "./dataTools.js";

// Order matches the README tool table and the task's priority list.
export const TOOLS = [
  webSearch,
  readUrl,
  crawlSiteMarkdown,
  extractContacts,
  detectTechStack,
  companyProfile,
  checkEmailSecurity,
  validateEmails,
  packageHealth,
  googleSearch,
];

export function findTool(name) {
  return TOOLS.find((tool) => tool.name === name);
}
