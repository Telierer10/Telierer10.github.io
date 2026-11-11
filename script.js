// JavaScript = das VERHALTEN der Seite: Was passiert, wenn man scrollt oder klickt?
// Für die großen Effekte benutzen wir zwei Bibliotheken (in index.html eingebunden):
//   gsap   → macht Animationen ("bewege das von A nach B in 1 Sekunde")
//   Lenis  → macht das Scrollen weich


// ===== 1. Einfaches Einblenden beim Scrollen (wie vorher) =====
// Ein "Beobachter", der merkt, wann ein Element im Bildschirm auftaucht
const beobachter = new IntersectionObserver((eintraege) => {
  eintraege.forEach((eintrag) => {
    if (eintrag.isIntersecting) {
      eintrag.target.classList.add("sichtbar");  // Klasse "sichtbar" startet die Animation (siehe style.css)
      beobachter.unobserve(eintrag.target);      // Nur einmal animieren
    }
  });
}, { threshold: 0.15 });  // Sobald 15 % des Elements zu sehen sind

document.querySelectorAll(".reveal").forEach((element) => {
  beobachter.observe(element);
});


// ===== 2. Eigener Mauszeiger =====
const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

// Über Links und Karten wird der Kreis groß
document.querySelectorAll("a, .card, .projekt-karte").forEach((element) => {
  element.addEventListener("mouseenter", () => cursor.classList.add("gross"));
  element.addEventListener("mouseleave", () => cursor.classList.remove("gross"));
});


// ===== Sicherheitsnetz =====
// Falls GSAP nicht geladen werden konnte (z. B. kein Internet), zeigen wir
// einfach die normale Seite ohne Effekte und hören hier auf.
if (typeof gsap === "undefined" || typeof Lenis === "undefined") {
  document.querySelector(".intro").remove();
} else {
  starteEffekte();
}


function starteEffekte() {
  gsap.registerPlugin(ScrollTrigger);


  // ===== 3. Weiches Scrollen mit Lenis =====
  const lenis = new Lenis({ lerp: 0.1 });   // lerp: je kleiner, desto "gleitender"
  lenis.on("scroll", ScrollTrigger.update);  // ScrollTrigger Bescheid sagen, wenn gescrollt wird
  gsap.ticker.add((zeit) => lenis.raf(zeit * 1000));  // Lenis in jedem Bild aktualisieren
  gsap.ticker.lagSmoothing(0);

  // Klicks auf Links wie "#projekte" sollen auch weich scrollen
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();   // normales Springen verhindern
      lenis.scrollTo(link.getAttribute("href"));
    });
  });


  // ===== 4. Überschriften in einzelne Buchstaben zerlegen =====
  // Aus "Tom" wird <span class="wort"><span class="buchstabe">T</span>...</span>
  // So kann jeder Buchstabe einzeln animiert werden.
  function zerlegeInBuchstaben(element) {
    // Alle Textstücke in der Überschrift einsammeln (auch die in <span>s)
    const textKnoten = [];
    const sucher = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (sucher.nextNode()) textKnoten.push(sucher.currentNode);

    textKnoten.forEach((knoten) => {
      const neu = document.createDocumentFragment();
      // Text an Leerzeichen trennen, Leerzeichen aber behalten
      knoten.textContent.split(/(\s+)/).forEach((teil) => {
        if (teil === "") return;
        if (teil.trim() === "") { neu.append(" "); return; }
        const wort = document.createElement("span");
        wort.className = "wort";
        for (const zeichen of teil) {
          const buchstabe = document.createElement("span");
          buchstabe.className = "buchstabe";
          buchstabe.textContent = zeichen;
          wort.append(buchstabe);
        }
        neu.append(wort);
      });
      knoten.replaceWith(neu);
    });
    return element.querySelectorAll(".buchstabe");
  }

  document.querySelectorAll(".split").forEach(zerlegeInBuchstaben);


  // ===== 5. Intro mit Wellen-Bildern + Start-Animation =====
  lenis.stop();   // während des Intros nicht scrollen
  const intro = document.querySelector(".intro");
  const introStoppen = starteIntroBild(document.querySelector(".intro-canvas"));  // aus intro.js

  // Hauptüberschrift und Rest schon mal verstecken (kommen nach dem Intro rein)
  gsap.set("h1 .buchstabe", { yPercent: 110 });
  gsap.set(".hero-teil", { opacity: 0, y: 30 });

  // Name von unten reinrutschen, "Los geht's"-Knopf nach 2 Sekunden einblenden
  gsap.from(".intro-name", { yPercent: 100, opacity: 0, duration: 1.2, ease: "power4.out", delay: 0.2 });
  gsap.to(".intro-start", { opacity: 1, duration: 0.6, delay: 2 });

  let introVorbei = false;
  function introBeenden() {
    if (introVorbei) return;   // nur einmal ausführen
    introVorbei = true;

    // Eine "Timeline" ist eine Liste von Animationen, die nacheinander ablaufen.
    gsap.timeline()
      // Intro nach oben wegfahren
      .to(intro, { yPercent: -100, duration: 1.1, ease: "power4.inOut" })
      // Buchstaben der Hauptüberschrift von unten reinrutschen lassen
      // "-=0.4" heißt: 0,4 Sekunden BEVOR die vorige Animation fertig ist starten
      .to("h1 .buchstabe", { yPercent: 0, duration: 1, stagger: 0.04, ease: "power4.out" }, "-=0.4")
      .to(".hero-teil", { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, "-=0.6")
      .add(() => {
        introStoppen();   // Wellen-Animation anhalten (spart Rechenleistung)
        intro.remove();
        lenis.start();    // jetzt darf gescrollt werden
      });
  }

  // Intro endet bei Klick auf den Knopf ODER wenn man versucht zu scrollen
  document.querySelector(".intro-start").addEventListener("click", introBeenden);
  window.addEventListener("wheel", (e) => { if (e.deltaY > 0) introBeenden(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === "ArrowDown") introBeenden(); });


  // ===== 6. Andere Überschriften: Buchstaben rutschen beim Scrollen rein =====
  document.querySelectorAll(".split:not(h1)").forEach((ueberschrift) => {
    gsap.from(ueberschrift.querySelectorAll(".buchstabe"), {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.025,
      ease: "power4.out",
      scrollTrigger: { trigger: ueberschrift, start: "top 85%" }   // startet, wenn die Überschrift bei 85 % der Bildschirmhöhe ist
    });
  });


  // ===== 7. Foto wird beim Scrollen aufgedeckt =====
  // clip-path schneidet einen Teil weg: "inset(100% 0 0 0)" = oben 100 % weg → unsichtbar
  gsap.fromTo(".foto-rahmen",
    { clipPath: "inset(100% 0% 0% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      // scrub = die Animation hängt direkt am Scrollen (vor- und zurückspulbar)
      scrollTrigger: { trigger: ".foto-rahmen", start: "top 90%", end: "top 30%", scrub: 1 }
    }
  );
  // Das Foto selbst zoomt dabei leicht heraus
  gsap.fromTo(".foto", { scale: 1.3 }, {
    scale: 1,
    ease: "none",
    scrollTrigger: { trigger: ".foto-rahmen", start: "top bottom", end: "bottom top", scrub: true }
  });


  // ===== 8. Projekte seitlich durchscrollen =====
  // matchMedia: nur auf großen Bildschirmen, auf dem Handy scrollt es normal nach unten
  const mm = gsap.matchMedia();
  mm.add("(min-width: 769px)", () => {
    const spur = document.querySelector(".spur");
    // So weit muss die Spur nach links: ihre Breite minus Bildschirmbreite
    const strecke = () => spur.scrollWidth - window.innerWidth;

    gsap.to(spur, {
      x: () => -strecke(),
      ease: "none",
      scrollTrigger: {
        trigger: "#projekte",
        pin: true,                         // Abschnitt "festnageln", solange wir seitlich fahren
        scrub: 1,
        end: () => "+=" + strecke(),       // so lange scrollen, wie die Spur lang ist
        invalidateOnRefresh: true          // bei Fenstergröße-Änderung neu berechnen
      }
    });
  });


  // ===== 9. Magnetischer Knopf =====
  document.querySelectorAll(".magnet").forEach((knopf) => {
    knopf.addEventListener("mousemove", (e) => {
      const box = knopf.getBoundingClientRect();
      // Abstand der Maus zur Mitte des Knopfs
      const x = e.clientX - (box.left + box.width / 2);
      const y = e.clientY - (box.top + box.height / 2);
      gsap.to(knopf, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: "power3.out" });
    });
    // Maus weg → Knopf schnappt wie ein Gummiband zurück
    knopf.addEventListener("mouseleave", () => {
      gsap.to(knopf, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    });
  });
}
