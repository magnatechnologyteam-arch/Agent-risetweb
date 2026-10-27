#!/usr/bin/env node
/* Perbarui data/state.json dari baris perintah. Dipakai agent atau manusia.
   node scripts/kv.mjs status a03 working "Menyusun kerangka Tenda Event" [s01]
   node scripts/kv.mjs site s01 stage rancang
   node scripts/kv.mjs site s01 url https://contoh.vercel.app
   node scripts/kv.mjs site s01 score 78
   node scripts/kv.mjs log a03 "Kerangka Tenda Event selesai" */
import { readFileSync, writeFileSync } from "node:fs";
const FILE = new URL("../data/state.json", import.meta.url);
const STATUS = ["idle", "working", "done", "error"], STAGES = ["riset", "rancang", "bangun", "qa", "pratinjau", "disetujui", "dipantau"];
const [cmd, ...a] = process.argv.slice(2);
const st = JSON.parse(readFileSync(FILE, "utf8")), now = new Date().toISOString();
const die = (m) => { console.error(m); process.exit(1); };
if (cmd === "status") {
  const [id, s, task, site = ""] = a;
  if (!st.agents[id]) die("agent tidak dikenal: " + id);
  if (!STATUS.includes(s)) die("status harus salah satu: " + STATUS.join(", "));
  st.agents[id] = { site, status: s, task: task || "", updated: now };
} else if (cmd === "site") {
  const [id, field, ...v] = a; let val = v.join(" ");
  if (!st.sites[id]) die("site tidak dikenal: " + id);
  if (field === "stage" && !STAGES.includes(val)) die("tahap harus salah satu: " + STAGES.join(", "));
  if (field === "score") { val = Number(val); if (!(val >= 0 && val <= 100)) die("skor 0 sampai 100"); }
  if (field === "url" && !/^https:\/\//.test(val)) die("url harus diawali https://");
  st.sites[id][field] = val;
} else if (cmd === "log") {
  const [agent, ...t] = a; if (!t.length) die("teks log kosong");
  st.log.unshift({ ts: now, agent, text: t.join(" ") }); st.log = st.log.slice(0, 200);
} else die("perintah: status | site | log");
writeFileSync(FILE, JSON.stringify(st, null, 2) + "\n");
console.log("ok");
