// Indonesian number/currency/datetime formatting helpers.
// All values are stored as raw numbers/ISO strings; these helpers only
// apply at the display/input layer.

const idr0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const idrAny = (max: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: max });

/** Format an IDR amount (no decimals): 1000000 -> "Rp1.000.000". Always positive magnitude. */
export function formatIDR(value: number): string {
  if (!isFinite(value)) return "Rp0";
  return "Rp" + idr0.format(Math.round(Math.abs(value)));
}

/** Same as formatIDR but prefixes "-" for negatives. */
export function formatIDRSigned(value: number): string {
  if (!isFinite(value)) return "Rp0";
  return (value < 0 ? "-" : "") + formatIDR(value);
}

/** Format any number with id-ID separators. 13847.17 -> "13.847,17". */
export function formatNumberID(value: number, maxFractionDigits = 6): string {
  if (!isFinite(value)) return "0";
  return idrAny(maxFractionDigits).format(value);
}

/** Parse a user-typed id-ID number string into a raw number.
 *  "1.000.000" -> 1000000 ; "13.847,17" -> 13847.17 ; "-2.500,5" -> -2500.5 */
export function parseIDNumber(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") return isFinite(input) ? input : 0;
  // Keep digits, comma, minus only. Dots are thousand separators -> drop.
  const cleaned = String(input).trim().replace(/[^\d,\-]/g, "").replace(/,/g, ".");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Format ISO datetime as "19 Mei 2026, 14:32:45" (id-ID locale). */
export function formatDateTimeID(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${datePart}, ${timePart}`;
}

/** Format ISO datetime as "Hari ini, 14:32:45" if today, else full datetime. */
export function formatDateTimeSmartID(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const timePart = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  if (sameDay) return `Hari ini, ${timePart}`;
  return formatDateTimeID(iso);
}

/** Convert an ISO datetime to a value usable in <input type="datetime-local" step="1"> ("YYYY-MM-DDTHH:mm:ss" in LOCAL time). */
export function toDateTimeLocalInput(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Current local datetime as "YYYY-MM-DDTHH:mm:ss" for default input values. */
export function nowDateTimeLocalInput(): string {
  return toDateTimeLocalInput(new Date().toISOString());
}

/** Convert a datetime-local input value (interpreted as LOCAL time) to ISO string. */
export function fromDateTimeLocalInput(value: string): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}
