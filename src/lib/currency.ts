let cachedRates: Record<string, number> = {};
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (Object.keys(cachedRates).length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return cachedRates;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const rates = data.rates as Record<string, number>;

      // Invert rates: API gives USD->foreign, we need foreign->USD
      const inverted: Record<string, number> = {};
      for (const [currency, rate] of Object.entries(rates)) {
        if (rate > 0) {
          inverted[currency] = Math.round((1.0 / rate) * 1e6) / 1e6;
        }
      }

      cachedRates = inverted;
      cacheTimestamp = now;
      return cachedRates;
    } catch {
      console.warn(`Exchange rate fetch attempt ${attempt + 1}/3 failed`);
    }
  }

  console.error("Failed to fetch exchange rates, using fallback rates");
  // Fallback rates (approximate)
  cachedRates = { GBP: 1.27, EUR: 1.08 };
  cacheTimestamp = now;
  return cachedRates;
}

export async function getExchangeRate(currency: string): Promise<number> {
  if (currency === "USD") return 1.0;
  const rates = await getExchangeRates();
  return rates[currency] ?? 1.0;
}
