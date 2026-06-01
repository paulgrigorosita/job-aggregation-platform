const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

const US_STATE_NAMES = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
  'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
  'minnesota','mississippi','missouri','montana','nebraska','nevada',
  'new hampshire','new jersey','new mexico','new york','north carolina',
  'north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island',
  'south carolina','south dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west virginia','wisconsin','wyoming',
];

const REJECTION_PATTERNS = [
  // India
  /\bindia\b/i,
  /\bindore\b/i,
  /\bmumbai\b/i,
  /\bbangalore\b/i,
  /\bhyderabad\b/i,
  /\bpune\b/i,
  /\bchennai\b/i,
  /\bkolkata\b/i,
  /\bdelhi\b/i,
  /\bnew\s+delhi\b/i,
  // Europe
  /\beurope\b/i,
  /\beu\s*only\b/i,
  /\bemea\b/i,
  /\bunited\s+kingdom\b/i,
  /\buk\s*only\b/i,
  /\b(?:london|berlin|paris|amsterdam|stockholm|dublin|barcelona|madrid|munich|zurich|lisbon|warsaw|prague|vienna|brussels)\b/i,
  // APAC
  /\bapac\b/i,
  /\b(?:sydney|melbourne|singapore|tokyo|beijing|shanghai|seoul|hong\s+kong|taipei|jakarta|manila|bangkok)\b/i,
  // Canada — reject any Canada-specific location
  /\bcanada\b/i,
  /\b(?:toronto|vancouver|montreal|calgary|ottawa|edmonton|winnipeg|quebec)\b/i,
  /\b(?:ontario|british\s+columbia|alberta|quebec|nova\s+scotia|manitoba)\b/i,
  // Latin America
  /\blatin\s+america\b/i,
  /\bbrazil\b/i,
  /\bmexico\b/i,
  /\bargentina\b/i,
  // Other regions
  /\bdeutschland\b/i,
  /\baustralia\b/i,
  /\bnew\s+zealand\b/i,
  /\bsouth\s+africa\b/i,
  /\bnigeria\b/i,
  /\bkenya\b/i,
  /\bisrael\b/i,
  /\bpakistan\b/i,
  /\bbangladesh\b/i,
  /\bphilippines\b/i,
  /\bindonesia\b/i,
  /\bvietnam\b/i,
];

const US_ALLOWLIST_PATTERNS = [
  /\bunited\s+states\b/i,
  /\busa\b/i,
  /\bu\.s\.a?\b/i,
  /\bremote\s*[\(\-,]\s*us\b/i,
  /\bremote\s*[\(\-,]\s*united\s+states\b/i,
  /\bus\s*[-\/]?\s*remote\b/i,
  /\bunited\s+states\s+of\s+america\b/i,
  // "US & Canada" or "US/Canada" patterns — still US-accessible
  /\bUS\s*[&\/]\s*Canada\b/i,
  // Global/worldwide roles are acceptable for a US-focused remote platform
  /\bworldwide\b/i,
  /\bglobal\b/i,
  /\banywhere\b/i,
  /\binternational\b/i,
];

export function isUSRelevant(location: string): boolean {
  if (!location || !location.trim()) return false;
  const loc = location.trim();

  for (const pat of REJECTION_PATTERNS) {
    if (pat.test(loc)) return false;
  }

  for (const pat of US_ALLOWLIST_PATTERNS) {
    if (pat.test(loc)) return true;
  }

  // Check US state abbreviations (e.g. "San Francisco, CA")
  const tokens = loc.split(/[\s,]+/);
  for (const token of tokens) {
    if (US_STATES.has(token.toUpperCase())) return true;
  }

  // Check full state names
  const locLower = loc.toLowerCase();
  for (const state of US_STATE_NAMES) {
    if (locLower.includes(state)) return true;
  }

  // Bare "Remote" — accept (US-focused platform assumption)
  if (/^\s*remote\s*$/i.test(loc)) return true;

  return false;
}
