/**
 * Régénère les entrées credit_add "Import initial" dans member_activity
 * à partir de scripts/import.sql (source de vérité des valeurs d'import CSV).
 *
 * Usage: node scripts/fix-import-activity.mjs > fix-import-activity.sql
 * Puis exécuter le SQL généré dans Supabase.
 */
import { readFileSync } from "fs";

const raw = readFileSync("scripts/import.sql", "utf-8");
const STUDIO_ID = "0dc33f15-8131-488c-bb15-4a1fa4da3314";

// Parser ligne par ligne les SELECT de l'import
// Format: SELECT '<studio>', '<first>', '<last>', '<email>', '<phone>', '<address>', '<postal>', '<city>', <birth>, <profession>, <credits>, <credits_total>, ...
const imports = [];
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (!t.startsWith("SELECT ")) continue;

  // Tokenizer qui gère les strings '...' et les valeurs brutes (nombres, NULL, booléens)
  const tokens = [];
  let i = 7; // après "SELECT "
  while (i < t.length) {
    while (i < t.length && (t[i] === " " || t[i] === ",")) i++;
    if (t[i] === "'") {
      // String quoted (doubled quote = escape)
      let s = "", j = i + 1;
      while (j < t.length) {
        if (t[j] === "'" && t[j+1] === "'") { s += "'"; j += 2; }
        else if (t[j] === "'") { j++; break; }
        else { s += t[j]; j++; }
      }
      tokens.push(s);
      i = j;
    } else {
      // Valeur brute jusqu'à la virgule
      let v = "", j = i;
      while (j < t.length && t[j] !== ",") { v += t[j]; j++; }
      tokens.push(v.trim());
      i = j;
    }
  }

  // Ordre: studio_id, first, last, email, phone, address, postal, city, birth, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in
  const [studioId, firstName, lastName, email, , , , , , , creditsStr] = tokens;
  const credits = parseInt(creditsStr);
  if (credits > 0 && email) {
    imports.push({ studioId, email, firstName, lastName, credits });
  }
}

console.log("-- Correction du backfill Import initial");
console.log(`-- ${imports.length} membres avec crédits à l'import`);
console.log("");
console.log("BEGIN;");
console.log("");
console.log("-- Supprimer les entrées incorrectes");
console.log(`DELETE FROM member_activity WHERE action = 'credit_add' AND details->>'source' = 'import_csv';`);
console.log("");
console.log("-- Réinsérer avec les vraies valeurs du CSV");
for (const imp of imports) {
  console.log(`INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '${imp.studioId}', id, 'system', 'credit_add',
  jsonb_build_object('amount', ${imp.credits}, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '${imp.studioId}' AND email = '${imp.email.replace(/'/g, "''")}';`);
}
console.log("");
console.log("COMMIT;");
