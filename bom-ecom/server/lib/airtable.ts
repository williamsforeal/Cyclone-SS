const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";

export const TABLES = {
  products: "tblBnVh4S8suptxct",
  adCopy: "tblh0GaqQOpBVbCLP",
  images: "tblt1dje94IcK4kT2",
  imagePrompts: "tblrFTV1xDGCx3PSw",
  jobs: "tblQ6sXueiBOzJXpA",
} as Record<string, string>;

export const REQUIRED_TABLES: Record<string, { label: string; requiredFields: string[] }> = {
  products: {
    label: "Products",
    requiredFields: ["Name"],
  },
  adCopy: {
    label: "Ad Copy / Concepts",
    requiredFields: ["Concept", "headline", "Angle", "Avatar Target", "Ad Type", "Tags", "CTA", "Awareness Level", "Image Prompt Status", "CTA strength"],
  },
  images: {
    label: "Images / Assets",
    requiredFields: ["A", "Status"],
  },
  imagePrompts: {
    label: "Image Prompts",
    requiredFields: [],
  },
  jobs: {
    label: "Jobs",
    requiredFields: ["Status", "Job Type"],
  },
};

function getCredentials() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!baseId || !apiKey) {
    throw new Error("Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY");
  }
  return { baseId, apiKey };
}

function headers() {
  const { apiKey } = getCredentials();
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function rateLimitRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.status === 429 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Rate limit retries exhausted");
}

export async function fetchTable(tableId: string, params?: Record<string, string>) {
  const { baseId } = getCredentials();
  return rateLimitRetry(async () => {
    const url = new URL(`${AIRTABLE_BASE_URL}/${baseId}/${tableId}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
      }
    }
    const response = await fetch(url.toString(), { headers: headers() });
    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Airtable ${response.status}: ${body}`);
      (err as any).status = response.status;
      throw err;
    }
    return response.json();
  });
}

export async function fetchAllRecords(tableId: string, params?: Record<string, string>) {
  const allRecords: any[] = [];
  let offset: string | undefined;

  do {
    const reqParams: Record<string, string> = { ...params };
    if (offset) reqParams.offset = offset;
    const data = await fetchTable(tableId, reqParams);
    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return allRecords;
}

export async function fetchRecord(tableId: string, recordId: string) {
  const { baseId } = getCredentials();
  return rateLimitRetry(async () => {
    const url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}/${recordId}`;
    const response = await fetch(url, { headers: headers() });
    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Airtable ${response.status}: ${body}`);
      (err as any).status = response.status;
      throw err;
    }
    return response.json();
  });
}

export async function createRecords(tableId: string, records: Record<string, any>[]) {
  const { baseId } = getCredentials();
  return rateLimitRetry(async () => {
    const url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        records: records.map((fields) => ({ fields })),
        typecast: true,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Airtable ${response.status}: ${body}`);
      (err as any).status = response.status;
      throw err;
    }
    return response.json();
  });
}

export async function updateRecord(tableId: string, recordId: string, fields: Record<string, any>) {
  const { baseId } = getCredentials();
  return rateLimitRetry(async () => {
    const url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}/${recordId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Airtable ${response.status}: ${body}`);
      (err as any).status = response.status;
      throw err;
    }
    return response.json();
  });
}

export async function updateRecords(tableId: string, records: { id: string; fields: Record<string, any> }[]) {
  const { baseId } = getCredentials();
  const batches: typeof records[] = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  const results: any[] = [];
  for (const batch of batches) {
    const data = await rateLimitRetry(async () => {
      const url = `${AIRTABLE_BASE_URL}/${baseId}/${tableId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          records: batch.map((r) => ({ id: r.id, fields: r.fields })),
          typecast: true,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        const err = new Error(`Airtable ${response.status}: ${body}`);
        (err as any).status = response.status;
        throw err;
      }
      return response.json();
    });
    results.push(...(data.records || []));
  }
  return results;
}

export function flattenRecords(records: any[]) {
  return records.map((record: any) => ({
    recordId: record.id,
    ...record.fields,
  }));
}

export function flattenRecord(record: any) {
  return {
    recordId: record.id,
    ...record.fields,
  };
}

export type TableHealthStatus = {
  key: string;
  label: string;
  tableId: string;
  exists: boolean;
  missingFields: string[];
  foundFields: string[];
  error?: string;
};

export async function checkHealth(): Promise<{
  connected: boolean;
  tables: TableHealthStatus[];
  error?: string;
}> {
  try {
    getCredentials();
  } catch {
    return { connected: false, tables: [], error: "Missing Airtable credentials" };
  }

  const results: TableHealthStatus[] = [];

  for (const [key, config] of Object.entries(REQUIRED_TABLES)) {
    const tableId = TABLES[key];
    if (!tableId) {
      results.push({
        key,
        label: config.label,
        tableId: "",
        exists: false,
        missingFields: config.requiredFields,
        foundFields: [],
        error: "No table ID configured",
      });
      continue;
    }

    try {
      const data = await fetchTable(tableId, { maxRecords: "1" });
      const record = data.records?.[0];
      const foundFields = record ? Object.keys(record.fields) : [];
      const missingFields = config.requiredFields.filter((f) => !foundFields.includes(f));

      results.push({
        key,
        label: config.label,
        tableId,
        exists: true,
        missingFields,
        foundFields,
      });
    } catch (err: any) {
      results.push({
        key,
        label: config.label,
        tableId,
        exists: false,
        missingFields: config.requiredFields,
        foundFields: [],
        error: err.message,
      });
    }
  }

  return {
    connected: true,
    tables: results,
  };
}
