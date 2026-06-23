
(function () {

  const RESvideo = 600;  // larghezza (px) a cui viene fatto il dither: piu basso = piu "grosso".
  const RESimg = 500;

 function ditherPixels(px, w, h) {
    // 1) scala di grigi (luminanza)
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = g;
    }
    // 2) Floyd-Steinberg
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (x + y * w) * 4;
        const oldR = px[idx];
        const newR = oldR < 128 ? 0 : 255;
        px[idx] = px[idx + 1] = px[idx + 2] = newR;
        const err = oldR - newR;
        distribute(px, w, h, x + 1, y,     (err * 7) / 16);
        distribute(px, w, h, x - 1, y + 1, (err * 3) / 16);
        distribute(px, w, h, x,     y + 1, (err * 5) / 16);
        distribute(px, w, h, x + 1, y + 1, (err * 1) / 16);
      }
    }
  }

  function distribute(px, w, h, x, y, err) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (x + y * w) * 4;
    px[idx] += err;
    px[idx + 1] += err;
    px[idx + 2] += err;
  }

  function scaledSize(srcW, srcH, RES) {
    if (!srcW) return null;
    const w = RES ? Math.min(RES, srcW) : srcW;
    const h = Math.round(srcH * (w / srcW));
    return { w, h };
  }

  /* ---------- IMMAGINI ---------- */
  function ditherImage(el) {
    const src = el.currentSrc || el.src;
    if (!src) return;
    const loader = new Image();
    loader.crossOrigin = "anonymous";
    loader.onload = () => {
      const s = scaledSize(loader.naturalWidth, loader.naturalHeight, RESimg);
      if (!s) return;
      const canvas = document.createElement("canvas");
      canvas.width = s.w; canvas.height = s.h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(loader, 0, 0, s.w, s.h);
      try {
        const d = ctx.getImageData(0, 0, s.w, s.h);
        ditherPixels(d.data, s.w, s.h);
        ctx.putImageData(d, 0, 0);
        el.src = canvas.toDataURL();
        el.dataset.dithered = "true";
      } catch (e) {
        console.warn("[dither] pixel non leggibili (CORS):", src);
      }
    };
    loader.onerror = () => console.warn("[dither] immagine non caricata:", src);
    loader.src = src;
  }

  /* ---------- VIDEO (live, fotogramma per fotogramma) ---------- */
  function ditherVideo(video) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // il canvas prende il posto del video, ereditandone classe e stile inline
    canvas.className = video.className;
    canvas.style.cssText = video.getAttribute("style") || "";
    video.style.display = "none";
    video.parentNode.insertBefore(canvas, video);

    // serve l'autoplay muto perche i fotogrammi avanzino senza click
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(() => {});

    let w = 0, h = 0;
    function tick() {
      if (video.videoWidth) {
        const s = scaledSize(video.videoWidth, video.videoHeight, RESvideo);
        if (s.w !== w || s.h !== h) { w = s.w; h = s.h; canvas.width = w; canvas.height = h; }
        ctx.drawImage(video, 0, 0, w, h);
        try {
          const d = ctx.getImageData(0, 0, w, h);
          ditherPixels(d.data, w, h);
          ctx.putImageData(d, 0, 0);
        } catch (e) { /* frame cross-origin non leggibile */ }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------- avvio ---------- */
  function init() {
    document.querySelectorAll("img.img").forEach((el) => {
      if (!el.dataset.dithered) ditherImage(el);
    });
    document.querySelectorAll("video.img").forEach((el) => {
      if (!el.dataset.dithered) { el.dataset.dithered = "true"; ditherVideo(el); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
      observeSys7();
    });
  } else {
    init();
    observeSys7();
  }

  function observeSys7() {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.attributeName === "class") {
          if (document.body.classList.contains("sys7")) init();
        }
      }
    });
    observer.observe(document.body, { attributes: true });
  }
})();