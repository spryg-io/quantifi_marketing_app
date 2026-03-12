export interface BrandConfig {
  schema: string;
  display_name: string;
  sales_channel: string;
  currency?: string;
}

export interface CampaignPattern {
  label: string;
  pattern: string;
  match_priority?: number;
}

export interface CampaignRow {
  campaign_name: string;
  spend: number;
  sales: number;
  ad_type: string;
}

export interface AggregatedMetrics {
  spend: number;
  sales: number;
  roas: number;
}

export interface BrandDailyData {
  campaigns: Record<string, AggregatedMetrics>;
  total_sales: number;
  bloomifi_spend: number;
  dsp_spend: number;
  dsp_sales: number;
  total_ad_spend: number;
  total_ad_sales: number;
  roas: number;
  troas: number;
  spend_vs_sales: number;
}

export interface DailyResponse {
  date: string;
  brands: Record<string, BrandDailyData>;
  brand_order: string[];
  sbl_brand_order: string[];
  row_labels: string[];
}

export interface MasterTabBrandConfig {
  display_name: string;
  source: "database" | "database_sum" | "sheet" | "sbl_sheet_sum" | "sum_above";
  brand_key?: string;
  brand_keys?: string[];
}

export interface MonthlyBrandGroup {
  display_name: string;
  rows: {
    label: string;
    spend: number;
    sales: number;
    tacos: number;
    roas: number;
  }[];
}

export interface MonthlyResponse {
  month: string;
  year: number;
  brand_groups: MonthlyBrandGroup[];
}

export interface BrandTimeSeriesPoint {
  date: string;
  spend: number;
  sales: number;
  roas: number;
  total_sales: number;
  troas: number;
}

export interface BrandCampaignBreakdown {
  label: string;
  spend: number;
  sales: number;
}

export interface BrandDetailResponse {
  brand_key: string;
  display_name: string;
  from: string;
  to: string;
  time_series: BrandTimeSeriesPoint[];
  campaign_breakdown: BrandCampaignBreakdown[];
  totals: {
    spend: number;
    sales: number;
    roas: number;
    total_sales: number;
    troas: number;
  };
}

export interface DspEntry {
  id?: number;
  brand_key: string;
  date: string;
  spend: number;
  sales: number;
}
