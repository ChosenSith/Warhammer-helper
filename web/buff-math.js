/** Bonus positif = meilleur jet (seuil plus bas). */

export function parseRoll(str) {
  if (str == null || str === "") return null;
  const m = String(str).trim().match(/^(\d+)\s*\+/);
  if (m) return parseInt(m[1], 10);
  const d = String(str).trim().match(/^(\d+)$/);
  if (d) return parseInt(d[1], 10);
  return null;
}

export function formatRoll(n) {
  if (n == null || Number.isNaN(n)) return "";
  return `${Math.min(6, Math.max(2, n))}+`;
}

export function applyRollBonus(base, bonusSum) {
  if (base == null) return null;
  const n = base - bonusSum;
  return Math.min(6, Math.max(2, n));
}

export function parseRend(str) {
  if (str == null || str === "") return null;
  const t = String(str).trim();
  if (t === "—" || t === "-" || t === "") return 0;
  const m = t.match(/^(-?\d+)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function formatRendNum(n) {
  if (n == null) return "—";
  if (n === 0) return "—";
  return String(n);
}

/** Agrège mods { hit, wound, save, rend } depuis buffs actifs. */
export function sumBuffMods(buffs) {
  const s = { hit: 0, wound: 0, save: 0, rend: 0 };
  for (const b of buffs || []) {
    s.hit += b.hit || 0;
    s.wound += b.wound || 0;
    s.save += b.save || 0;
    s.rend += b.rend || 0;
  }
  return s;
}
