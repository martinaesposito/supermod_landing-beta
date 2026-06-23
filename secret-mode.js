/* secret-mode.js — SuperModerno
   Modalita' segreta Macintosh System 7 (classe .sys7 sul body).
   - Bottone discreto in basso a destra.
   - Entrata "segreta": digita  MAC   |   ESC per uscire.
   - Costruisce barra dei menu + title bar delle finestre + boot "Welcome to Macintosh".
   - Lo stato viene ricordato tra le visite.
*/

(function () {
  const KEY = "sm-secret-os";
  const SECRET = "mac";

  // Titoli "Finder" per ogni sezione (per classe).
  const TITLES = [
    ["hero",    "SuperModerno"],
    ["about",   "What we do"],
    ["founder", "Founder"],
    ["naming",  "Read Me"],
    ["find",    "Get in touch"],
  ];

  /* ---------- costruzione della chrome (una volta sola) ---------- */
  function buildChrome() {
    if (document.querySelector(".s7-menubar")) return;

    // barra dei menu
    const bar = document.createElement("div");
    bar.className = "s7-menubar";
    bar.innerHTML =
      '<svg class="apple" viewBox="0 0 100 110" fill="#000" aria-hidden="true">'
      + '<path d="M73 58c0-13 10-19 11-20-6-9-15-10-18-10-8-1-15 4-19 4s-10-4-16-4C23 28 14 34 9 44c-9 17-2 42 7 56 4 6 9 13 16 13s9-4 17-4 10 4 17 4 11-6 15-12c3-5 5-9 6-12-15-6-15-23-14-31z"/>'
      + '<path d="M60 18c4-5 7-11 6-17-6 0-13 4-17 9-4 4-7 11-6 17 7 1 13-4 17-9z"/>'
      + "</svg>"
      + '<span class="mi">File</span><span class="mi">Edit</span>'
      + '<span class="mi">View</span><span class="mi">Label</span>'
      + '<span class="mi">Special</span><span class="sp"></span>';
    document.body.appendChild(bar);

    // title bar in cima a ogni sezione
    document.querySelectorAll("section.container").forEach((sec) => {
      let title = "Untitled";
      for (const [cls, name] of TITLES) {
        if (sec.classList.contains(cls)) { title = name; break; }
      }
      const tb = document.createElement("div");
      tb.className = "s7-titlebar";
      tb.innerHTML =
        '<span class="box"></span><span class="sp"></span>'
        + '<span class="ttl">' + title + "</span>"
        + '<span class="sp"></span><span class="box"></span>';
      sec.insertBefore(tb, sec.firstChild);
    });
  }

  /* ---------- toggle ---------- */
  const btn = document.createElement("button");
  btn.className = "s7-toggle";
  btn.type = "button";
  document.body.appendChild(btn);

  function label() {
    const on = document.body.classList.contains("sys7");
    btn.textContent = on ? "back to 2026" : "back to 1984";
    btn.setAttribute("aria-label", on ? "Torna al sito odierno" : "Modalita' System 7");
  }

  function setMode(on, withBoot) {
    if (on) buildChrome();
    document.body.classList.toggle("sys7", on);
    try { localStorage.setItem(KEY, on ? "sys7" : "now"); } catch (e) {}
    label();
      // if (on && withBoot) boot(); 
  }

  btn.addEventListener("click", () => {
    const turningOn = !document.body.classList.contains("sys7");
    setMode(turningOn, turningOn);
  });

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("sys7")) setMode(false, false);
  });

  // entrata segreta: digitare "mac"
  let buf = "";
  addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-SECRET.length);
    if (buf === SECRET && !document.body.classList.contains("sys7")) setMode(true, true);
  });

  /* ---------- boot "Welcome to Macintosh" ---------- */
  function boot() {
    const overlay = document.createElement("div");
    overlay.className = "s7-boot";
    overlay.innerHTML =
      '<div class="dialog">'
      + '<img class="happymac" src="assets/Happy_MacBN.webp" viewBox="0 0 80 80" aria-hidden="true"/>'
      + "</svg>"
      + "<div>Welcome to Macintosh</div>"
      + "</div>";
    document.body.appendChild(overlay);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 400 : 1300;
    setTimeout(() => {
      overlay.classList.add("fade");
      setTimeout(() => overlay.remove(), 380);
    }, hold);
  }

  /* ---------- stato iniziale (senza boot) ---------- */
  let saved = "now";
  try { saved = localStorage.getItem(KEY) || "now"; } catch (e) {}
  setMode(saved === "sys7", false);
})();
