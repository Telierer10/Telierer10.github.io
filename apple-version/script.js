// JavaScript = das VERHALTEN der Seite: Was passiert, wenn man scrollt oder klickt?

// Ein "Beobachter", der merkt, wann ein Element im Bildschirm auftaucht
const beobachter = new IntersectionObserver((eintraege) => {
  eintraege.forEach((eintrag) => {
    if (eintrag.isIntersecting) {
      eintrag.target.classList.add("sichtbar");  // Klasse "sichtbar" startet die Animation (siehe style.css)
      beobachter.unobserve(eintrag.target);      // Nur einmal animieren
    }
  });
}, { threshold: 0.15 });  // Sobald 15 % des Elements zu sehen sind

// Alle Elemente mit der Klasse "reveal" beobachten
document.querySelectorAll(".reveal").forEach((element) => {
  beobachter.observe(element);
});
