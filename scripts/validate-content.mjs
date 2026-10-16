// Comprueba que las lecciones de content/ tienen el formato correcto.
// Uso: node scripts/validate-content.mjs
import { readFileSync } from "node:fs";

const errors = [];
const read = (f) => { try { return JSON.parse(readFileSync(new URL("../content/" + f, import.meta.url))); } catch (e) { errors.push(`${f}: JSON inválido (${e.message})`); return null; } };
const idx = read("languages.json");
const ids = new Set();
for (const lang of idx?.languages ?? []) {
  const c = read(lang.file);
  if (!c) continue;
  const where = (s) => `${lang.file}: ${s}`;
  if (c.code !== lang.code) errors.push(where(`"code" debe ser "${lang.code}"`));
  if (!c.voice) errors.push(where(`falta "voice" (p. ej. "en-US")`));
  if (!Array.isArray(c.units) || !c.units.length) errors.push(where("no tiene unidades"));
  for (const [i, u] of (c.units ?? []).entries()) {
    const at = where(`unidad ${i + 1}`);
    for (const k of ["id", "level", "title", "subtitle"]) if (!u[k]) errors.push(`${at}: falta "${k}"`);
    if (ids.has(u.id)) errors.push(`${at}: id repetido "${u.id}"`); ids.add(u.id);
    if (!/^(A1|A2|B1|B2|C1|C2)$/.test(u.level)) errors.push(`${at}: "level" debe ser A1–C2`);
    if (!Array.isArray(u.grammar) || !u.grammar.length) errors.push(`${at}: falta la explicación "grammar"`);
    if (/[<>]/.test(JSON.stringify(u))) errors.push(`${at}: no uses HTML; para negrita escribe **así**`);
    if (!Array.isArray(u.words) || u.words.length < 4) errors.push(`${at}: pon al menos 4 palabras en "words"`);
    for (const [j, w] of (u.words ?? []).entries()) if (!w.term || !w.es) errors.push(`${at}, palabra ${j + 1}: faltan "term" o "es"`);
  }
}
if (errors.length) { console.error("Errores en el contenido:\n- " + errors.join("\n- ")); process.exit(1); }
console.log(`Contenido válido: ${idx.languages.length} idiomas, ${ids.size} unidades.`);
