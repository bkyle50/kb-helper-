const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? '1mbuwqtSHLdJ5l7bz-FjY1Ra9Z4miYwTS';
const API_KEY = process.env.GOOGLE_API_KEY;

export async function querySheet(range = 'Sheet1'): Promise<string> {
  if (!API_KEY) return 'Google API key not configured.';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets API error ${res.status}: ${err}`);
  }

  const json = await res.json() as { values?: string[][] };
  const rows = json.values ?? [];
  if (rows.length === 0) return 'Sheet is empty or range has no data.';

  return rows.map((row) => row.join('\t')).join('\n');
}
