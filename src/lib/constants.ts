import type { BrandConfig, CampaignPattern, MasterTabBrandConfig } from "./types";

export const BRANDS_CONFIG: Record<string, BrandConfig> = {
  herbivore: {
    schema: "herbivore",
    display_name: "Herbivore ($3K)",
    sales_channel: "Amazon.com",
  },
  iconic_london: {
    schema: "iconic_london",
    display_name: "Iconic ($3K)",
    sales_channel: "Amazon.com",
  },
  hanni: {
    schema: "hanni",
    display_name: "Hanni ($3K)",
    sales_channel: "Amazon.com",
  },
  oneskin: {
    schema: "oneskin",
    display_name: "OneSkin",
    sales_channel: "Amazon.com",
  },
  actiiv: {
    schema: "actiiv",
    display_name: "ACTIIV",
    sales_channel: "Amazon.com",
  },
  zenagen: {
    schema: "zenagen",
    display_name: "Zenagen",
    sales_channel: "Amazon.com",
  },
  caldera: {
    schema: "calderalab",
    display_name: "Caldera",
    sales_channel: "Amazon.com",
  },
  bioeffect: {
    schema: "bioeffect",
    display_name: "Bioeffect",
    sales_channel: "Amazon.com",
  },
  sbl_uk: {
    schema: "sbluk",
    display_name: "SBL UK",
    currency: "GBP",
    sales_channel: "Amazon.co.uk",
  },
  sbl_it: {
    schema: "sbl_it",
    display_name: "SBL IT",
    currency: "EUR",
    sales_channel: "Amazon.it",
  },
  sbl_germany: {
    schema: "sbl_de",
    display_name: "SBL Germany",
    currency: "EUR",
    sales_channel: "Amazon.de",
  },
  sbl_us: {
    schema: "sblus",
    display_name: "SBL US",
    sales_channel: "Amazon.com",
  },
  versed: {
    schema: "versed_skin",
    display_name: "Versed",
    sales_channel: "Amazon.com",
  },
  tbs: {
    schema: "body_shop",
    display_name: "TBS",
    sales_channel: "Amazon.com",
  },
  uplift5: {
    schema: "uplift",
    display_name: "Uplift5",
    sales_channel: "Amazon.com",
  },
  mzskin: {
    schema: "mzskin",
    display_name: "MZSkin",
    sales_channel: "Amazon.com",
  },
  dr_organic: {
    schema: "dr_organic",
    display_name: "Dr. Organic",
    sales_channel: "Amazon.com",
  },
  luna_daily: {
    schema: "luna_daily",
    display_name: "Luna Daily",
    sales_channel: "Amazon.com",
  },
  stories_ink: {
    schema: "stories_ink",
    display_name: "Stories & Ink",
    sales_channel: "Amazon.com",
  },
};

export const BRAND_ORDER = [
  "actiiv",
  "bioeffect",
  "caldera",
  "dr_organic",
  "hanni",
  "herbivore",
  "iconic_london",
  "luna_daily",
  "mzskin",
  "oneskin",
  "stories_ink",
  "tbs",
  "uplift5",
  "versed",
  "zenagen",
];

export const SBL_BRAND_ORDER = ["sbl_germany", "sbl_it", "sbl_uk", "sbl_us"];

export const ALL_BRANDS = [...BRAND_ORDER, ...SBL_BRAND_ORDER];

export const ROW_LABELS: CampaignPattern[] = [
  { label: "$$", pattern: "$$" },
  { label: "(Auto)", pattern: "(auto)" },
  { label: "Top Keywords", pattern: "top keywords" },
  { label: "(ST)", pattern: "(st)" },
  { label: "**", pattern: "**" },
  { label: "Global", pattern: "global" },
  { label: "(VCPM)", pattern: "vcpm", match_priority: 0 },
  { label: "(Manual)", pattern: "(manual)" },
  { label: "(C)", pattern: "(c)" },
];

export const SKIP_ROWS = ["Bloomifi", "DSP"];

export const SUMMARY_ROWS = ["Total Spend", "Total Sales", "SPEND VS SALES %"];

export const ALL_ROW_LABELS = [
  ...ROW_LABELS.map((r) => r.label),
  ...SKIP_ROWS,
  ...SUMMARY_ROWS,
];

// Master tab brand configuration for monthly summaries
// Each brand group has 4 rows: Amazon, Bloomifi, DSP, Total
export const MASTER_TAB_GROUP_SIZE = 4;

export const MASTER_TAB_BRANDS: MasterTabBrandConfig[] = [
  // ACTIIV group
  { display_name: "ACTIIV (Amazon)", brand_key: "actiiv", source: "database" },
  { display_name: "ACTIIV (Bloomifi)", source: "sheet" },
  { display_name: "ACTIIV (DSP)", source: "sheet" },
  { display_name: "ACTIIV (Total)", source: "sum_above" },

  // Bioeffect group
  { display_name: "Bioeffect (Amazon)", brand_key: "bioeffect", source: "database" },
  { display_name: "Bioeffect (Bloomifi)", source: "sheet" },
  { display_name: "Bioeffect (DSP)", source: "sheet" },
  { display_name: "Bioeffect (Total)", source: "sum_above" },

  // Caldera group
  { display_name: "Caldera (Amazon)", brand_key: "caldera", source: "database" },
  { display_name: "Caldera (Bloomifi)", source: "sheet" },
  { display_name: "Caldera (DSP)", source: "sheet" },
  { display_name: "Caldera (Total)", source: "sum_above" },

  // Dr. Organic group
  { display_name: "Dr. Organic (Amazon)", brand_key: "dr_organic", source: "database" },
  { display_name: "Dr. Organic (Bloomifi)", source: "sheet" },
  { display_name: "Dr. Organic (DSP)", source: "sheet" },
  { display_name: "Dr. Organic (Total)", source: "sum_above" },

  // Hanni group
  { display_name: "Hanni (Amazon)", brand_key: "hanni", source: "database" },
  { display_name: "Hanni (Bloomifi)", source: "sheet" },
  { display_name: "Hanni (DSP)", source: "sheet" },
  { display_name: "Hanni (Total)", source: "sum_above" },

  // Herbivore group
  { display_name: "Herbivore (Amazon)", brand_key: "herbivore", source: "database" },
  { display_name: "Herbivore (Bloomifi)", source: "sheet" },
  { display_name: "Herbivore (DSP)", source: "sheet" },
  { display_name: "Herbivore (Total)", source: "sum_above" },

  // Iconic group
  { display_name: "Iconic (Amazon)", brand_key: "iconic_london", source: "database" },
  { display_name: "Iconic (Bloomifi)", source: "sheet" },
  { display_name: "Iconic (DSP)", source: "sheet" },
  { display_name: "Iconic (Total)", source: "sum_above" },

  // Luna Daily group
  { display_name: "Luna Daily (Amazon)", brand_key: "luna_daily", source: "database" },
  { display_name: "Luna Daily (Bloomifi)", source: "sheet" },
  { display_name: "Luna Daily (DSP)", source: "sheet" },
  { display_name: "Luna Daily (Total)", source: "sum_above" },

  // MZSkin group
  { display_name: "MZSkin (Amazon)", brand_key: "mzskin", source: "database" },
  { display_name: "MZSkin (Bloomifi)", source: "sheet" },
  { display_name: "MZSkin (DSP)", source: "sheet" },
  { display_name: "MZSkin (Total)", source: "sum_above" },

  // OneSkin group
  { display_name: "OneSkin (Amazon)", brand_key: "oneskin", source: "database" },
  { display_name: "OneSkin (Bloomifi)", source: "sheet" },
  { display_name: "OneSkin (DSP)", source: "sheet" },
  { display_name: "OneSkin (Total)", source: "sum_above" },

  // Stories & Ink group
  { display_name: "Stories & Ink (Amazon)", brand_key: "stories_ink", source: "database" },
  { display_name: "Stories & Ink (Bloomifi)", source: "sheet" },
  { display_name: "Stories & Ink (DSP)", source: "sheet" },
  { display_name: "Stories & Ink (Total)", source: "sum_above" },

  // TBS group
  { display_name: "TBS (Amazon)", brand_key: "tbs", source: "database" },
  { display_name: "TBS (Bloomifi)", source: "sheet" },
  { display_name: "TBS (DSP)", source: "sheet" },
  { display_name: "TBS (Total)", source: "sum_above" },

  // Uplift5 group
  { display_name: "Uplift5 (Amazon)", brand_key: "uplift5", source: "database" },
  { display_name: "Uplift5 (Bloomifi)", source: "sheet" },
  { display_name: "Uplift5 (DSP)", source: "sheet" },
  { display_name: "Uplift5 (Total)", source: "sum_above" },

  // Versed group
  { display_name: "Versed (Amazon)", brand_key: "versed", source: "database" },
  { display_name: "Versed (Bloomifi)", source: "sheet" },
  { display_name: "Versed (DSP)", source: "sheet" },
  { display_name: "Versed (Total)", source: "sum_above" },

  // Zenagen group
  { display_name: "Zenagen (Amazon)", brand_key: "zenagen", source: "database" },
  { display_name: "Zenagen (Bloomifi)", source: "sheet" },
  { display_name: "Zenagen (DSP)", source: "sheet" },
  { display_name: "Zenagen (Total)", source: "sum_above" },

  // SBL group (combined from 4 sub-brands)
  { display_name: "SBL (Amazon)", brand_keys: ["sbl_uk", "sbl_it", "sbl_germany", "sbl_us"], source: "database_sum" },
  { display_name: "SBL (Bloomifi)", source: "sheet" },
  { display_name: "SBL (DSP)", source: "sheet" },
  { display_name: "SBL (Total)", source: "sum_above" },
];

// Brand display names for the brand deep-dive selector
export const BRAND_SLUGS: Record<string, string> = Object.fromEntries(
  Object.entries(BRANDS_CONFIG).map(([key, config]) => [key, config.display_name])
);
