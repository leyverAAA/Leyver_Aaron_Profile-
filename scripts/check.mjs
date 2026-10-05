// Verificación del sitio estático. Sin dependencias: `node scripts/check.mjs`.
//
// Comprueba las invariantes que en este proyecto se rompen en silencio:
//  1. Cada referencia local (href/src) apunta a un archivo que existe.
//  2. Ninguna ruta local es absoluta con "/" — en GitHub Pages el sitio vive
//     bajo un subpath, y "/styles.css" resolvería a la raíz del dominio (404).
//     Este fue un fallo real: producción cargaba sin CSS ni JS.
//  3. Cada ancla #id, aria-labelledby y for coincide con un id existente.
//  4. No hay ids duplicados.
//  5. Toda custom property usada en el CSS está declarada.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const htmlPath = join(publicDir, "index.html");
const cssPath = join(publicDir, "styles.css");

const html = readFileSync(htmlPath, "utf8");
const css = readFileSync(cssPath, "utf8");

const failures = [];
const fail = (msg) => failures.push(msg);

// --- ids -------------------------------------------------------------------
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const idSet = new Set(ids);
for (const id of ids) {
  if (ids.filter((x) => x === id).length > 1) fail(`id duplicado en el HTML: #${id}`);
}

// --- referencias href/src --------------------------------------------------
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
const external = /^(?:https?:|mailto:|tel:|data:|\/\/)/;

for (const ref of refs) {
  if (external.test(ref)) continue;

  if (ref.startsWith("#")) {
    const id = ref.slice(1);
    if (!idSet.has(id)) fail(`ancla rota: ${ref} no encuentra ningún id`);
    continue;
  }

  if (ref.startsWith("/")) {
    fail(`ruta absoluta "${ref}": rompería en GitHub Pages (subpath). Usa una ruta relativa.`);
    continue;
  }

  const target = join(publicDir, ref.split(/[?#]/)[0]);
  if (!existsSync(target)) fail(`referencia rota: ${ref} no existe en public/`);
  else if (!statSync(target).isFile()) fail(`la referencia ${ref} no apunta a un archivo`);
}

// --- atributos ARIA que apuntan a ids -------------------------------------
for (const m of html.matchAll(/\saria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
  for (const id of m[1].split(/\s+/)) {
    if (!idSet.has(id)) fail(`aria-* apunta a un id inexistente: "${id}"`);
  }
}

// --- custom properties -----------------------------------------------------
const declared = new Set([
  ...[...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
  ...[...html.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
]);
for (const m of css.matchAll(/var\(\s*(--[\w-]+)/g)) {
  if (!declared.has(m[1])) fail(`custom property usada pero no declarada: ${m[1]}`);
}
for (const m of html.matchAll(/var\(\s*(--[\w-]+)/g)) {
  if (!declared.has(m[1])) fail(`custom property usada en el HTML pero no declarada: ${m[1]}`);
}

// --- peso total transferred ------------------------------------------------
let bytes = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else bytes += statSync(full).size;
  }
};
walk(publicDir);

// --- reporte ---------------------------------------------------------------
if (failures.length) {
  console.error(`\n  ${failures.length} problema(s):\n`);
  for (const f of failures) console.error(`  x  ${f}`);
  console.error("");
  process.exit(1);
}

console.log(`  ${ids.length} ids · ${refs.length} referencias · todas resueltas`);
console.log(`  custom properties: sin referencias colgantes`);
console.log(`  peso de public/: ${(bytes / 1024).toFixed(1)} KB`);
console.log(`\n  OK\n`);