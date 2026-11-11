// ===== INTRO-BILD: zwei Bilder vermischen sich in Wellen =====
//
// So funktioniert's:
//   Bild 1 (z. B. dein Gesicht) liegt unten.
//   Bild 2 (z. B. du im Trikot / mit Ball) wird nur dort gezeigt, wo eine "Maske" ist.
//   Die Maske besteht aus:
//     a) einer Welle, die von unten hoch und wieder runter schwappt
//     b) wabbeligen Klecksen, die deiner Maus folgen und langsam verschwinden
//
// EIGENE BILDER: Leg zwei Fotos in den Website-Ordner und nenn sie
//   intro-1.jpg  (das erste Bild, z. B. dein Gesicht)
//   intro-2.jpg  (das zweite Bild, z. B. dasselbe Foto im Trikot oder bearbeitet)
// Am besten gleich groß und mit dir an derselben Stelle – dann sieht das Vermischen am coolsten aus.
// Solange die Fotos fehlen, malt das Programm Platzhalter.

function starteIntroBild(canvas) {
  const ctx = canvas.getContext("2d");
  // Zweite, unsichtbare Zeichenfläche für die Maske
  const maske = document.createElement("canvas");
  const mctx = maske.getContext("2d");

  let breite, hoehe;
  const pixelDichte = Math.min(window.devicePixelRatio || 1, 1.5);  // nicht zu hoch, sonst ruckelt's

  function groesseAnpassen() {
    breite = canvas.width = maske.width = window.innerWidth * pixelDichte;
    hoehe = canvas.height = maske.height = window.innerHeight * pixelDichte;
  }
  groesseAnpassen();
  window.addEventListener("resize", groesseAnpassen);

  // ----- Bilder laden (oder Platzhalter malen, falls es sie nicht gibt) -----
  const bild1 = ladeBild("intro-1.jpg", "#0d0f0b", "#d4ff00");
  const bild2 = ladeBild("intro-2.jpg", "#d4ff00", "#0d0f0b");

  function ladeBild(datei, hintergrund, vordergrund) {
    const platzhalter = malePlatzhalter(hintergrund, vordergrund);
    const ergebnis = { quelle: platzhalter };
    const img = new Image();
    img.onload = () => { ergebnis.quelle = img; };   // Foto gefunden → Foto benutzen
    img.src = datei;                                 // nicht gefunden → Platzhalter bleibt
    return ergebnis;
  }

  function malePlatzhalter(hintergrund, vordergrund) {
    const c = document.createElement("canvas");
    c.width = 1600; c.height = 1000;
    const p = c.getContext("2d");
    p.fillStyle = hintergrund;
    p.fillRect(0, 0, c.width, c.height);
    p.textAlign = "center";
    p.textBaseline = "middle";
    p.font = "380px sans-serif";
    p.fillText("🤾", 800, 470);
    p.fillStyle = vordergrund;
    p.font = "60px Anton, Impact, sans-serif";
    p.fillText("FOTO: intro-1.jpg + intro-2.jpg", 800, 830);
    return c;
  }

  // Bild so zeichnen, dass es den ganzen Bildschirm füllt (wie "object-fit: cover")
  function zeichneFuellend(kontext, quelle, zoom) {
    const qb = quelle.width, qh = quelle.height;
    const faktor = Math.max(breite / qb, hoehe / qh) * zoom;
    const b = qb * faktor, h = qh * faktor;
    kontext.drawImage(quelle, (breite - b) / 2, (hoehe - h) / 2, b, h);
  }

  // ----- Maus-Kleckse -----
  const kleckse = [];
  let letzteMaus = null;

  function mausBewegt(x, y) {
    x *= pixelDichte; y *= pixelDichte;
    // Je schneller die Maus, desto größer der Klecks
    const tempo = letzteMaus ? Math.hypot(x - letzteMaus.x, y - letzteMaus.y) : 0;
    kleckse.push({ x, y, radius: 60 + Math.min(tempo, 120) * pixelDichte, leben: 1, drehung: Math.random() * 6 });
    letzteMaus = { x, y };
  }
  const beiMaus = (e) => mausBewegt(e.clientX, e.clientY);
  const beiTouch = (e) => mausBewegt(e.touches[0].clientX, e.touches[0].clientY);
  window.addEventListener("mousemove", beiMaus);
  window.addEventListener("touchmove", beiTouch);

  // Einen wabbeligen Kreis malen (Radius schwankt rundherum wie Wackelpudding)
  function maleKlecks(k, zeit) {
    mctx.beginPath();
    for (let winkel = 0; winkel <= Math.PI * 2 + 0.01; winkel += 0.2) {
      const wabbel = 1 + 0.18 * Math.sin(winkel * 5 + zeit * 4 + k.drehung);
      const r = k.radius * k.leben * wabbel;
      const x = k.x + Math.cos(winkel) * r;
      const y = k.y + Math.sin(winkel) * r;
      winkel === 0 ? mctx.moveTo(x, y) : mctx.lineTo(x, y);
    }
    mctx.fill();
  }

  // ----- Die Animations-Schleife: läuft ca. 60-mal pro Sekunde -----
  const startZeit = performance.now();
  let laeuft = true;

  function bild() {
    if (!laeuft) return;
    const zeit = (performance.now() - startZeit) / 1000;   // Sekunden seit Start

    // 1) MASKE malen
    mctx.globalCompositeOperation = "source-over";
    mctx.clearRect(0, 0, breite, hoehe);
    mctx.fillStyle = "#000";

    // a) Die Welle: Wasserstand schwappt hoch und runter (Kosinus = sanftes Hin und Her)
    const stand = hoehe * (0.5 + 0.62 * Math.cos(zeit * 1.1));
    mctx.beginPath();
    mctx.moveTo(0, hoehe);
    for (let x = 0; x <= breite + 20; x += 20) {
      // Zwei Sinus-Wellen übereinander → sieht natürlicher aus
      const y = stand
        + Math.sin(x * 0.006 + zeit * 3) * 45 * pixelDichte
        + Math.sin(x * 0.015 - zeit * 2) * 20 * pixelDichte;
      mctx.lineTo(x, y);
    }
    mctx.lineTo(breite, hoehe);
    mctx.fill();

    // b) Die Maus-Kleckse (werden mit der Zeit kleiner und verschwinden)
    for (let i = kleckse.length - 1; i >= 0; i--) {
      kleckse[i].leben -= 0.015;
      if (kleckse[i].leben <= 0) kleckse.splice(i, 1);
      else maleKlecks(kleckse[i], zeit);
    }

    // c) Bild 2 NUR dort hineinmalen, wo die Maske ist ("source-in")
    mctx.globalCompositeOperation = "source-in";
    zeichneFuellend(mctx, bild2.quelle, 1.08 + 0.02 * Math.sin(zeit * 0.8 + 1));

    // 2) BILDSCHIRM malen: erst Bild 1, dann die Maske mit Bild 2 obendrauf
    // Bild 1 "atmet" leicht (zoomt minimal rein und raus)
    zeichneFuellend(ctx, bild1.quelle, 1.05 + 0.02 * Math.sin(zeit * 0.8));
    ctx.drawImage(maske, 0, 0);

    requestAnimationFrame(bild);
  }
  bild();

  // Gibt eine "Stopp"-Funktion zurück, damit script.js die Animation beenden kann
  return function stoppen() {
    laeuft = false;
    window.removeEventListener("mousemove", beiMaus);
    window.removeEventListener("touchmove", beiTouch);
    window.removeEventListener("resize", groesseAnpassen);
  };
}
