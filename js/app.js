(() => {
"use strict";
const BW = 1080, BH = 1080;
const GOLD = "#e8b94f", CREAM = "#fbe9bd", DARK = "#2b1c08";
const SERIF = '"Playfair Display","Times New Roman",Times,serif';
/* ===== À MODIFIER : textes écrits sur l'image ===== */
const CFG = { l1: "PAROISSE DE CIMPUNDA", l2: "COCATH ISTM BUKAVU", l3: "CONCERT DE PAIX",
  date: "Dimanche 1er novembre 2026 · 12h00", place: "Salle Saint'Egidio, Bugabo (en face de l'UCB)" };
/* ==================================================== */
const FONT = '"Poppins",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const $ = id => document.getElementById(id);
const cv = $("cv"), poster = $("poster");
const st = { step: 1, img: null, ox: 0, oy: 0 };
const tpl = new Image();
let tplReady = false, raf = 0;
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

/* ---------- Texte nettoyé (jamais injecté en HTML, seulement dessiné) ---------- */
const cleanName = s => s.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
const isGroup = () => $("grp").checked;

/* ---------- Netteté douce (masque flou) : 0 = photo telle quelle ---------- */
function soft(c, f) {
  const w = Math.max(1, c.width / f | 0), h = Math.max(1, c.height / f | 0);
  const t = mk(w, h), g = t.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(c, 0, 0, w, h);
  const u = mk(c.width, c.height), q = u.getContext("2d"); q.imageSmoothingQuality = "high"; q.drawImage(t, 0, 0, c.width, c.height);
  return q.getImageData(0, 0, c.width, c.height).data;
}
function sharpen(c) {
  const a = +$("n").value / 100 * 1.3; if (!a) return;
  const g = c.getContext("2d"), o = g.getImageData(0, 0, c.width, c.height), d = o.data;
  const b = soft(c, Math.max(2, Math.round(2 * c.width / 300)));
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] += a * (d[i + k] - b[i + k]);
  g.putImageData(o, 0, 0);
}

/* Cadrage de départ : photo centrée */
function recenter() { st.ox = 0; st.oy = 0; }

/* ---------- Mise en page : même forme que l'image exemple ---------- */
const OV = { cx: 790, cy: 470, rx: 190, ry: 205 };
function geo() {
  const s = Math.max(2 * OV.rx / st.img.width, 2 * OV.ry / st.img.height) * (+$("z").value / 100);
  return { w: st.img.width * s / (2 * OV.rx), h: st.img.height * s / (2 * OV.ry) };
}
function clamp() {
  if (!st.img) return;
  const m = geo(), mx = Math.max(0, (m.w - 1) / 2), my = Math.max(0, (m.h - 1) / 2);
  st.ox = Math.max(-mx, Math.min(mx, st.ox)); st.oy = Math.max(-my, Math.min(my, st.oy));
}
const fit = (g, t, f, s, min, max) => { g.font = f.replace("{s}", s); while (s > min && g.measureText(t).width > max) { s -= 1; g.font = f.replace("{s}", s); } return s; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function bg(g) {
  const l = g.createLinearGradient(0, 0, 0, BH); l.addColorStop(0, "#4a2a14"); l.addColorStop(1, "#150b06");
  g.fillStyle = l; g.fillRect(0, 0, BW, BH);
  const o = mk(40, 40), q = o.getContext("2d"), s = Math.max(40 / tpl.width, 40 / tpl.height);
  q.drawImage(tpl, (40 - tpl.width * s) / 2, (40 - tpl.height * s) / 2, tpl.width * s, tpl.height * s);
  g.globalAlpha = .55; g.drawImage(o, 0, 0, BW, BH); g.globalAlpha = 1;
  const r = g.createRadialGradient(780, 460, 40, 780, 460, 560); r.addColorStop(0, "rgba(255,200,110,.28)"); r.addColorStop(1, "rgba(0,0,0,.35)");
  g.fillStyle = r; g.fillRect(0, 0, BW, BH);
}
/* En-tête : 1) Paroisse de Cimpunda  2) COCATH ISTM Bukavu  3) Concert de Paix */
function head(g) {
  g.textAlign = "center"; g.textBaseline = "alphabetic"; g.save();
  g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 14; g.shadowOffsetY = 4;
  g.fillStyle = CREAM; fit(g, CFG.l1, "700 {s}px " + SERIF, 32, 18, 700); g.fillText(CFG.l1, BW / 2, 54);
  const w1 = g.measureText(CFG.l1).width;
  g.fillStyle = GOLD; g.fillRect(BW / 2 - w1 / 2 - 150, 44, 120, 2); g.fillRect(BW / 2 + w1 / 2 + 30, 44, 120, 2);
  fit(g, CFG.l2, "{s}px Anton,Impact,sans-serif", 50, 24, 900); g.fillText(CFG.l2, BW / 2, 118);
  g.fillStyle = CREAM; fit(g, CFG.l3, "{s}px Anton,Impact,sans-serif", 112, 50, 980); g.fillText(CFG.l3, BW / 2, 236);
  g.restore();
}
function flyer(g) {
  const h = 590, w = h * tpl.width / tpl.height, x = 274 - w / 2, y = 262;
  g.save(); g.shadowColor = "rgba(0,0,0,.55)"; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(g, x, y, w, h, 12); g.fillStyle = "#111"; g.fill(); g.restore();
  g.save(); rr(g, x, y, w, h, 12); g.clip(); g.drawImage(tpl, x, y, w, h); g.restore();
  rr(g, x, y, w, h, 12); g.lineWidth = 4; g.strokeStyle = GOLD; g.stroke();
}
function oval(g, k) {
  const { cx, cy, rx, ry } = OV;
  g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 26; g.shadowOffsetY = 8;
  g.beginPath(); g.ellipse(cx, cy, rx + 9, ry + 9, 0, 0, 7); g.fillStyle = "#fff"; g.fill(); g.restore();
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip();
  if (st.img) {
    const W = Math.round(2 * rx * k), H = Math.round(2 * ry * k), w = mk(W, H), q = w.getContext("2d"), m = geo();
    q.imageSmoothingQuality = "high"; q.drawImage(st.img, W / 2 - m.w * W / 2 + st.ox * W, H / 2 - m.h * H / 2 + st.oy * H, m.w * W, m.h * H);
    sharpen(w); g.drawImage(w, cx - rx, cy - ry, 2 * rx, 2 * ry);
  } else {
    g.fillStyle = "#2b1c08"; g.fillRect(cx - rx, cy - ry, 2 * rx, 2 * ry);
    g.fillStyle = "#d9a93c"; g.textAlign = "center"; g.font = "600 28px " + FONT; g.fillText("Ta photo ici", cx, cy + 8);
  }
  g.restore();
}
/* Cadre blanc : le nom EN HAUT, « J'y serai » EN BAS (toujours au même endroit et à la même taille) */
function label(g) {
  const nm = cleanName($("nm").value), t = isGroup() ? "Nous y serons" : "J'y serai", w = 400, x = OV.cx - w / 2, YB = 864, YJ = 838;
  const y = nm ? 710 : 766;
  g.save(); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(g, x, y, w, YB - y, 22); g.fillStyle = "#fff"; g.fill(); g.restore();
  g.fillStyle = DARK; g.textAlign = "center"; g.textBaseline = "alphabetic";
  fit(g, t, '{s}px "Kaushan Script",cursive', 60, 34, w - 50); g.fillText(t, OV.cx, YJ);
  if (nm) { fit(g, nm, "800 {s}px " + SERIF, 34, 16, w - 50); g.fillText(nm, OV.cx, 756); }
}
/* Bandeau du bas : jour, date, heure et salle, en grand */
function band(g) {
  g.save(); g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 20; g.shadowOffsetY = -4; g.fillStyle = "#fff";
  g.beginPath(); g.moveTo(0, BH); g.lineTo(0, 916); g.arcTo(0, 880, 36, 880, 36);
  g.lineTo(BW - 36, 880); g.arcTo(BW, 880, BW, 916, 36); g.lineTo(BW, BH); g.closePath(); g.fill(); g.restore();
  g.fillStyle = DARK; g.textAlign = "center"; g.textBaseline = "alphabetic";
  const d = "Date : " + CFG.date, l = "Lieu : " + CFG.place;
  fit(g, d, "600 {s}px " + FONT, 36, 18, 980); g.fillText(d, BW / 2, 962);
  fit(g, l, "500 {s}px " + FONT, 32, 16, 980); g.fillText(l, BW / 2, 1020);
  
}
function render(k) {
  const c = mk(BW * k, BH * k), g = c.getContext("2d");
  g.imageSmoothingQuality = "high"; g.scale(k, k);
  bg(g); head(g); flyer(g); oval(g, k); label(g); band(g);
  return c;
}
function draw() {
  if (!tplReady) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { cv.getContext("2d").drawImage(render(1), 0, 0, cv.width, cv.height); });
}

/* ---------- Étapes ---------- */
const hints = ["L'aperçu se met à jour pendant que tu écris.", "Glisse la photo pour bien centrer ton visage.", "Vérifie ton affiche avant de la télécharger."];
function go(n, rev) {
  if (n < 1 || n > 3) return;
  st.step = n;
  document.querySelectorAll(".pane").forEach(p => {
    const on = +p.dataset.pane === n; p.classList.toggle("on", on); p.classList.toggle("rev", on && !!rev);
  });
  document.querySelectorAll("#steps li").forEach(li => li.classList.toggle("on", +li.dataset.s === n));
  $("bar").style.width = (n / 3 * 100) + "%";
  $("back").hidden = n === 1; $("next").hidden = n === 3;
  $("next").disabled = n === 2 && !st.img;
  $("hint").textContent = hints[n - 1];
  poster.classList.toggle("drag", n === 2 && !!st.img);
  if (matchMedia("(max-width:899px)").matches) window.scrollTo({ top: 0, behavior: "smooth" });
}
$("next").addEventListener("click", () => { history.pushState({ s: st.step + 1 }, ""); go(st.step + 1); });
$("back").addEventListener("click", () => history.back());
window.addEventListener("popstate", e => { const s = (e.state && e.state.s) || 1; go(s, s < st.step); });
history.replaceState({ s: 1 }, "");

/* ---------- Message et nom ---------- */
$("grp").addEventListener("change", () => {
  const g = isGroup();
  $("modeT").textContent = g ? "Nous y serons" : "J'y serai";
  $("modeS").textContent = g ? "Pour un groupe, une famille, une chorale." : "Par défaut, pour une seule personne.";
  $("nmL").textContent = g ? "Vos noms ou le nom du groupe" : "Ton nom sur l'affiche";
  $("nm").placeholder = g ? "Ex. Famille Bashamuka" : "Ex. Jean Matengo";
  draw();
});
$("nm").addEventListener("input", draw);
$("nm").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("next").click(); } });

/* ---------- Photo : vérification du vrai type de fichier ---------- */
async function sniff(f) {
  const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const s = Array.from(b, x => String.fromCharCode(x)).join("");
  return (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) || s.startsWith("\x89PNG") || (s.startsWith("RIFF") && s.slice(8, 12) === "WEBP") || s.slice(4, 8) === "ftyp";
}
const say = t => { $("msg").textContent = t || ""; };
$("f").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f) return; say();
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) || !(await sniff(f))) { say("Ce fichier n'est pas une photo acceptée (JPG, PNG ou WebP)."); return; }
  if (f.size > 25 * 1048576) { say("Photo trop lourde (25 Mo maximum)."); return; }
  try {
    let b;
    try { b = await createImageBitmap(f, { imageOrientation: "from-image" }); }
    catch (_) { const u = URL.createObjectURL(f), i = new Image(); await new Promise((ok, ko) => { i.onload = ok; i.onerror = ko; i.src = u; }); URL.revokeObjectURL(u); b = i; }
    const w = b.width, h = b.height; if (w < 50 || h < 50) throw 0;
    const m = Math.min(1, 4096 / Math.max(w, h)), c = mk(Math.round(w * m), Math.round(h * m));
    c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
    st.img = c; $("z").value = 100; recenter(); $("zo").textContent = "1.0×";
    $("ctl").classList.add("on"); $("drop").classList.add("ok"); $("dropT").textContent = "Changer de photo";
    $("next").disabled = false; poster.classList.add("drag");
    if (Math.min(w, h) < 500) say("Photo petite : le résultat peut être moins net.");
    draw();
  } catch (_) { say("Impossible de lire cette photo. Essaie-en une autre."); }
});
$("z").addEventListener("input", () => { $("zo").textContent = (+$("z").value / 100).toFixed(1) + "×"; clamp(); draw(); });
$("n").addEventListener("input", () => { $("no").textContent = $("n").value; draw(); });
$("reset").addEventListener("click", () => { $("z").value = 100; $("zo").textContent = "1.0×"; recenter(); draw(); });

/* ---------- Glisser la photo (doigt ou souris) ---------- */
let dr = null;
poster.addEventListener("pointerdown", e => { if (!st.img || st.step !== 2) return; dr = { x: e.clientX, y: e.clientY }; poster.setPointerCapture(e.pointerId); });
poster.addEventListener("pointermove", e => {
  if (!dr) return;
  const r = poster.getBoundingClientRect(), u = BW / r.width;
  st.ox += (e.clientX - dr.x) * u / (2 * OV.rx); st.oy += (e.clientY - dr.y) * u / (2 * OV.ry); dr = { x: e.clientX, y: e.clientY }; clamp(); draw();
});
["pointerup", "pointercancel"].forEach(t => poster.addEventListener(t, () => { dr = null; }));

/* ---------- Téléchargement et partage (HD) ---------- */
const slug = () => (cleanName($("nm").value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()) || "mon-affiche";
const fname = () => "affiche-concert-de-paix-" + slug() + ".jpg";
const blob = () => new Promise((ok, ko) => render(2).toBlob(b => b ? ok(b) : ko(), "image/jpeg", .95));
const say3 = t => { $("msg3").textContent = t || ""; };
$("dl").addEventListener("click", async () => {
  const b = $("dl"), old = b.textContent; b.disabled = true; b.textContent = "Création de l'affiche…"; say3();
  try {
    const bl = await blob(), u = URL.createObjectURL(bl), a = document.createElement("a");
    a.href = u; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
    say3("C'est téléchargé. Cherche-la dans ta galerie ou tes téléchargements.");
  } catch (_) { say3("Le téléchargement a échoué, réessaie."); }
  b.disabled = false; b.textContent = old;
});
try {
  if (navigator.canShare && navigator.canShare({ files: [new File([""], "a.jpg", { type: "image/jpeg" })] })) {
    $("sh").hidden = false;
    $("sh").addEventListener("click", async () => {
      try { const bl = await blob(); await navigator.share({ files: [new File([bl], fname(), { type: "image/jpeg" })] }); } catch (_) {}
    });
  }
} catch (_) {}

/* ---------- Démarrage ---------- */
tpl.onload = () => { tplReady = true; draw(); };
tpl.src = window.__TPL;
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("800 40px Poppins"), document.fonts.load("600 16px Poppins"), document.fonts.load("84px \"Kaushan Script\""), document.fonts.load("112px Anton"), document.fonts.load("700 40px \"Playfair Display\""), document.fonts.load("800 40px \"Playfair Display\"")]).then(draw).catch(() => {});
go(1);
})();
