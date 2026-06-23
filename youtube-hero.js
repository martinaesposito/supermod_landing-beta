/* youtube-hero.js — SuperModerno (versione Data API)
   - Scarta gli Shorts in modo AFFIDABILE filtrando per DURATA (non per hashtag).
   - Puo' pescare anche video piu' vecchi (pagina la playlist uploads).
   Card leggere: il video muto parte al passaggio del mouse; click = audio.
*/

(function () {
  /* ===== CONFIG ===== */
  const API_KEY     = "AIzaSyD9VMCg8duQxWO-D9nJM4FmB7tYj7ehlNg";                  // <-- vedi istruzioni sotto
  const CHANNEL_ID  = "UC-8E9fWJmFdEfK46u2S6nFg";   // <-- formato UC...
const WANT_VIDEOS  = 6;     // quanti video lunghi mostrare (occhio: ognuno = 2 player)
  const MIN_SECONDS  = 180;   // sotto = Short -> escluso (3 min)
  const MAX_PAGES    = 5;     // pagine (50 video l'una) da frugare al massimo
  const SEC_PER_CARD = 10;    // velocita': secondi per ogni card (piu' alto = piu' lento)
  const MOUNT        = "#yt-strip";
 
  const uploadsId = CHANNEL_ID.replace(/^UC/, "UU");
 
  // Carica la IFrame Player API una volta sola.
  const apiReady = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
 
  async function loadVideos() {
    const mount = document.querySelector(MOUNT);
    if (!mount) return;
 
    try {
      const kept = [];
      let pageToken = "";
      let pages = 0;
 
      while (kept.length < WANT_VIDEOS && pages < MAX_PAGES) {
        const page = await fetchUploadPage(pageToken);
        if (!page.list.length) break;
        kept.push(...await fetchLongVideos(page.list));
        pageToken = page.next;
        pages++;
        if (!pageToken) break;
      }
 
      const videos = kept.slice(0, WANT_VIDEOS);
      if (!videos.length) throw new Error("Nessun video lungo trovato");
 
      // Binario + lista duplicata per il loop infinito.
      const track = document.createElement("div");
      track.className = "yt-track";
      [...videos, ...videos].forEach((v) => track.appendChild(makeCard(v.id)));
      track.style.animationDuration = (videos.length * SEC_PER_CARD) + "s";
 
      mount.innerHTML = "";
      mount.appendChild(track);
 
      // Inizializza un player per ogni card, quando l'API e' pronta.
      await apiReady;
      track.querySelectorAll(".yt-player").forEach(initPlayer);
    } catch (err) {
      console.error("[youtube-hero]", err);
      mount.innerHTML = '<p class="yt-msg">Impossibile caricare i video al momento.</p>';
    }
  }
 
  function initPlayer(target) {
    const id    = target.dataset.id;
    const thumb = target.closest(".yt-thumb");
    const cover = thumb.querySelector(".yt-cover"); // catturata: resta valida anche dopo
 
    new YT.Player(target, {                         // YT sostituisce 'target' con l'iframe
      host: "https://www.youtube-nocookie.com",
      videoId: id,
      playerVars: {
        autoplay: 1, mute: 1, controls: 0, playsinline: 1,
        rel: 0, modestbranding: 1, iv_load_policy: 3, disablekb: 1, fs: 0
      },
      events: {
        onReady: (e) => { e.target.mute(); e.target.playVideo(); },
        onStateChange: (e) => {
          // Mostra la copertina in TUTTO cio' che non e' "in riproduzione".
          if (e.data === YT.PlayerState.PLAYING) {
            cover.classList.add("hidden");
          } else {
            cover.classList.remove("hidden");
          }
          // Loop manuale: a fine video torna a 0 (cover gia' visibile sopra).
          if (e.data === YT.PlayerState.ENDED) {
            e.target.seekTo(0);
            e.target.playVideo();
          }
        }
      }
    });
  }
 
  async function fetchUploadPage(pageToken) {
    let url = "https://www.googleapis.com/youtube/v3/playlistItems"
      + "?part=contentDetails&maxResults=50"
      + "&playlistId=" + uploadsId + "&key=" + API_KEY;
    if (pageToken) url += "&pageToken=" + pageToken;
    const data = await (await fetch(url)).json();
    if (data.error) throw new Error(data.error.message);
    return {
      list: (data.items || []).map((i) => i.contentDetails.videoId),
      next: data.nextPageToken || ""
    };
  }
 
  async function fetchLongVideos(ids) {
    const url = "https://www.googleapis.com/youtube/v3/videos"
      + "?part=contentDetails,snippet&id=" + ids.join(",") + "&key=" + API_KEY;
    const data = await (await fetch(url)).json();
    if (data.error) throw new Error(data.error.message);
    return (data.items || [])
      .filter((v) => durationToSeconds(v.contentDetails.duration) >= MIN_SECONDS)
      .map((v) => ({ id: v.id }));
  }
 
  function durationToSeconds(iso) {
    const m = (iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  }
 
  // Card = contenitore del player + copertina (miniatura pulita) sopra.
  function makeCard(id) {
    const card = document.createElement("div");
    card.className = "yt-card";
    card.innerHTML =
      '<div class="yt-thumb">'
      + '<div class="yt-player" data-id="' + id + '"></div>'
      + '<img class="yt-cover" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="">'
      + "</div>";
    return card;
  }
 
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadVideos);
  } else {
    loadVideos();
  }
})();
 