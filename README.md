# Handyspiele 🫧🌷🧪

Drei Spiele für zwischendurch – laufen direkt im Handy-Browser, offline und als App auf dem Homescreen.

| Spiel | Adresse | Prinzip |
|---|---|---|
| **Blubberei** | `https://deralo.github.io/Handygame-/` | Physik-Merge: gleiche Blubbs verschmelzen |
| **Blockgarten** | `https://deralo.github.io/Handygame-/blockgarten/` | Block-Puzzle: volle Reihen erblühen |
| **Quantensalat** | `https://deralo.github.io/Handygame-/quantensalat/` | Point-&-Click-Adventure im Stil der Klassiker |

---

# Blubberei 🫧

Ein entspanntes Merge-Spiel für zwischendurch – läuft direkt im Handy-Browser, auch offline und als App auf dem Homescreen.

**Spielprinzip:** Blubbs fallen ins Glas. Zwei gleiche Blubbs verschmelzen zum nächstgrößeren. Kettenreaktionen geben Kombo-Punkte. Bleibt ein Blubb zu lange über der Linie, ist das Glas voll. Das Ziel ist König Blubb – und wer zwei Könige zusammenbringt, bekommt einen Riesenbonus.

## Warum dieses Konzept?

| Anforderung | Umsetzung |
|---|---|
| Spaß für zwischendurch | Eine Runde dauert 3–10 Minuten, jederzeit unterbrechbar – der Spielstand wird automatisch gespeichert |
| Nicht stressig | Kein Timer, kein Gegner. Man denkt in Ruhe nach, wo der nächste Blubb hin soll |
| Einhändig spielbar | Daumen aufs Display, zielen, loslassen |
| Keine Infrastruktur | Reine statische Seite, kein Server, keine Datenbank. Rekord & Spielstand liegen im Browser |
| Später Werbung | Natürliche Werbepausen: „Glas retten“ als Belohnungs-Video, Pausen-Werbung zwischen Runden – nie während des Spiels |

## Alles selbst gemacht

- **Grafik:** Alle Figuren werden per Canvas-Code gezeichnet (`js/sprites.js`) – gestochen scharf auf jedem Display, 0 KB Bilddateien. Gesichter blinzeln, schauen zum Finger, werden beim Aufprall gequetscht, schwitzen nahe der Linie und schlafen ein, wenn lange nichts passiert.
- **Sound & Musik:** Komplett mit der Web Audio API synthetisiert (`js/audio.js`): Blubb-Geräusche in einer Pentatonik, deren Tonhöhe von Größe und Kombo abhängt, dazu eine ruhige generative Hintergrundmusik.
- **Physik:** Eigene kleine Kreisphysik (`js/game.js`), keine Bibliothek.

## Projektstruktur

```
index.html            Seite + UI
css/style.css         Styling
js/main.js            UI, Eingabe, Speichern, Spielfluss
js/game.js            Physik, Spiellogik, Rendering
js/sprites.js         Figuren (per Code gezeichnet)
js/audio.js           Soundeffekte + Musik (synthetisiert)
js/ads.js             Werbe-Schnittstelle (aktuell deaktiviert)
sw.js                 Offline-Cache (PWA)
tools/make-icons.mjs  erzeugt die App-Icons aus den Sprites
```

## Lokal starten

```bash
npx http-server -p 8080 -c-1 .
# dann http://localhost:8080 öffnen (am Handy: IP des Rechners im WLAN)
```

## Veröffentlichen mit GitHub Pages

1. Im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions“** wählen.
2. Auf `main` (oder den Entwicklungs-Branch) pushen – der Workflow `.github/workflows/pages.yml` veröffentlicht das Spiel.
3. Adresse: `https://<benutzer>.github.io/<repo>/`
4. Am Handy im Browser öffnen → „Zum Startbildschirm hinzufügen“ → spielt sich wie eine App, auch offline.

Nach Änderungen die `VERSION` in `sw.js` erhöhen, damit installierte Versionen das Update bekommen.

## Werbung später aktivieren

`js/ads.js` ist für die Google **Ad Placement API** (AdSense für H5-Spiele) vorbereitet. Das Spiel ruft nur zwei Stellen auf:

- `ads.rewarded()` – „Glas retten & weiter“ nach Game-Over (1× pro Runde, freiwillig)
- `ads.interstitial()` – vor jeder 3. neuen Runde

Zum Aktivieren: AdSense-Konto + H5-Games-Freigabe, `ADS_ENABLED = true` und Publisher-ID setzen. In der EU wird zusätzlich ein Consent-Banner (CMP) benötigt, dazu Impressum und Datenschutzerklärung.

---

# Blockgarten 🌷

Ein gemütliches Block-Puzzle: Drei Beet-Teile liegen bereit, du ziehst sie auf ein 8×8-Beet. Volle Reihen und Spalten erblühen in einem Blütenregen und verschwinden. Mehrere Linien auf einmal und Serien (mehrmals hintereinander abräumen) bringen Multiplikatoren. Passt kein Teil mehr, ist die Runde vorbei.

**Warum es Spaß macht und nicht stresst:** Kein Timer. Jeder Zug kann in Ruhe überlegt werden. Die Vorschau zeigt beim Ziehen, welche Linien gleich erblühen. Der Teile-Generator ist fair (mindestens ein Teil passt immer beim Nachlegen, bei vollem Beet kommen eher kleine Teile). Im Hintergrund erblühen mit steigender Punktzahl Blumen auf der Wiese.

- Grafik (Kacheln, Blüten, Wiese, Wolken) komplett per Code: `blockgarten/js/tiles.js`
- Sounds (Holzklötzchen, Kalimba-Glockenspiel) und ruhige Kalimba-Musik synthetisiert: `blockgarten/js/audio.js`
- Spiellogik & Rendering: `blockgarten/js/game.js`, UI: `blockgarten/js/main.js`
- Werbung: nutzt dieselbe `js/ads.js` – „3 neue Teile & weiter“ als Belohnungs-Video, Pausen-Werbung vor jeder 3. Runde
- Icons neu erzeugen: `node tools/make-garten-icons.mjs` (bei laufendem `http-server -p 8080`)

---

# Quantensalat 🧪 – Das Wasserburg-Paradoxon

Ein Point-&-Click-Adventure im Geist der LucasArts-Klassiker – aber heute, in der Wissenschaft, und in Wasserburg am Inn.

**Story:** Kai Wimmer, Studienabbrecher und Nacht-Hausmeister am „Institut für Angewandte Unwahrscheinlichkeit“, will Wissenschaftler werden. In dieser Nacht klaut Tech-Bro Sven Glanz (CEO von GlanzTech) die Q-Box von Prof. Brandl – eine Maschine, die Unwahrscheinliches wahrscheinlich macht. Die Professorin landet dabei in Superposition (halb da, halb weg). Um 7 Uhr will Glanz die unkalibrierte Box beim „Zukunftsgipfel“ im Rathaus vorführen – und riskiert, dass ganz Wasserburg in Superposition fällt.

**Das Herzstück:** das *Peer-Review-Duell* – das Gegenstück zum Beleidigungsfechten. Glanz haut Pseudo-Argumente raus (Scheinkorrelation, n = 1, p-Hacking, Buzzword-Bingo, Autoritätsargument …), Kai kontert mit dem richtigen wissenschaftlichen Gegenargument. Die Konter lernt man bei Mehmet, dem Ex-Professor für Wissenschaftstheorie, der heute den Kebabstand an der Innbrücke betreibt.

**Schauplätze:** Institutsflur, Labor (mit Katze Schrödinger), Professorenbüro mit Amateurfunk-Station, Innbrücke vor dem Brucktor, Rathausplatz, Rathaussaal.

**Bedienung (Handy):** Tippen = laufen / Objekt-Menü (Ansehen, Benutzen, Reden). Gegenstand antippen und dann ein Objekt → benutzen; zwei Gegenstände nacheinander → kombinieren. 🔍 zeigt alle Hotspots, 💡 gibt einen Tipp passend zum Spielfortschritt. Im Hochformat folgt die Kamera Kai, im Querformat sieht man die ganze Szene. Automatisches Speichern.

**Technik – alles selbst gemacht:**
- `quantensalat/js/engine.js` – Adventure-Engine: Szenen, Laufen, Hotspots, Verben, Inventar, Dialogbäume, Kamera, Speichern
- `quantensalat/js/story.js` – komplette Story, Rätsel, Dialoge, Tipps
- `quantensalat/js/duel.js` – Peer-Review-Duell
- `quantensalat/js/art.js`, `sprites.js` – Pixel-Art-Hintergründe, Figuren (mit Laufanimation, Lippenbewegung, Blinzeln) und Gegenstände, alles per Code
- `quantensalat/js/audio.js` – Chiptune-Musik pro Ort und Soundeffekte (inkl. Morsezeichen)
- Später Werbung: Der 💡-Tipp-Knopf bietet sich als Belohnungs-Video an („Tipp gegen Werbung“)
