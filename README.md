# Handyspiele 🫧🌷🧪🚀

Vier Spiele für zwischendurch – laufen direkt im Handy-Browser, offline und als App auf dem Homescreen.

| Spiel | Adresse | Prinzip |
|---|---|---|
| **Blubberei** | `https://deralo.github.io/Handygame-/` | Physik-Merge: gleiche Blubbs verschmelzen |
| **Blockgarten** | `https://deralo.github.io/Handygame-/blockgarten/` | Block-Puzzle: volle Reihen erblühen |
| **Quantensalat** | `https://deralo.github.io/Handygame-/quantensalat/` | Point-&-Click-Adventure-Trilogie im Stil der Klassiker |
| **URLICHT** | `https://deralo.github.io/Handygame-/urlicht/` | 3D-Arcade-Weltraumshooter (Rail-Shooter) |

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

## Kapitel 2: Der Unwahrscheinlichkeitssturm

Drei Wochen später: Kai ist Doktorand – und in Wasserburg passieren unmögliche Dinge. Der Inn fließt rückwärts, die Tauben gurren auf Latein, und der Kaffeeautomat **funktioniert**. Glanz’ Superposition hat sich in zwei Richtungen aufgelöst: Der gute „Glanzi“ wischt glücklich Mehmets Kebabstand, der böse betreibt irgendwo eine nachgebaute **Q-Box Pro Max**.

- **Fuchsjagd:** Kai baut eine echte Maßband-Yagi (aus dem Besenstiel seines alten Mopps), lädt das Handfunkgerät an KARL (nach einer Autowäsche mit rückwärts fließendem Innwasser) und peilt den Störsender von zwei Orten an. Der Kreuzungspunkt auf dem Stadtplan verrät das Versteck.
- **Neue Schauplätze:** Burghof und Serverraum im Burgturm.
- **Peer-Review-Duell 2.0:** acht neue Denkfehler (Strohmann, Whataboutism, Anekdote, Naturalistischer Fehlschluss, Survivorship Bias, Spielerfehlschluss, Falsches Dilemma, Torpfosten verschieben). Trainer: Glanzi – er kennt alle Tricks seines Zwillings.
- **Neue Mechanik:** Manche Gegenstände benutzt man direkt (antippen → „▶“), z. B. den Peilempfänger.
- Code: `quantensalat/js/story2.js`

## Kapitel 3: Der Katzensprung

Schrödinger sitzt auf der Q-Box UND der Pro Max – die beiden verschränken sich und reißen einen Zeitriss auf. Die Katze springt hinein und landet im **Jahr 1524** in der Kräuterhütte von Hildegard, der Ahnin der Professorin. Dort gilt sie als Hexenkatze: Der Amulettkrämer **Sigmund von Glanz** (Glanz’ Urahn) klagt Hildegard der Hexerei an. Wird sie verurteilt, gibt es in der Gegenwart weder die Professorin noch das Institut.

- **Zeitreise:** Szenen in der Gegenwart und im Jahr 1524 (Hütte, Holz-Innbrücke mit Salzschiff, Marktplatz mit Pranger, Ratssaal) – die Vergangenheit im Sepia-Look.
- **Funk durch die Zeit:** Mit „Rudi“ (▶ Funken) spricht Kai mit der Professorin; sie wirft Dinge durch den Riss (Würfelzucker für Mehmed Efendi, den ersten Kaffeehändler Bayerns).
- **Stadtchronik** (▶ Lesen) zeigt, wie sich die Geschichte durch Kais Handeln verändert.
- **Peer-Review-Duell vor dem Rat:** acht neue Denkfehler (Danach-also-deswegen, Beweislastumkehr, Ad hominem, Zirkelschluss, Traditionsargument, Bestätigungsfehler, Dammbruch, Argument aus Unwissenheit). Trainer: Mehmed Efendi.
- Abschluss der Trilogie – mit Kaffee.
- Code: `quantensalat/js/story3.js`

Außerdem: Gesprächsthemen erscheinen jetzt erst, wenn Kai davon wissen kann, und erledigte Themen verschwinden.

---

# URLICHT 🚀 – Flug zum Rand des Universums

3D-Arcade-Rail-Shooter im Geist der N64-Klassiker: Das Schiff fliegt automatisch vorwärts, du weichst aus, schießt, rollst und besiegst Endgegner – mit eigener Crew und eigener Story.

**Story:** Im Jahr 3127 verschwinden am Rand des beobachtbaren Universums Galaxien, und die kosmische Hintergrundstrahlung wird leiser. „Die Stille“ frisst sich von außen nach innen. Kurierpilotin **Juno „Funke“ Varga**, Astrophysikerin **Mira**, der grummelige Ex-Bergbauroboter **Brakk** und **Pip** – ein Photon aus dem ersten Licht des Universums, das nach 13,8 Milliarden Jahren Flug zu denken begonnen hat – fliegen zum Rand. Dort zeigt sich: Die Stille ist die perfekte Symmetrie von *vor* dem Anfang. Das Universum existiert nur, weil diese Symmetrie einmal gebrochen wurde.

**5 Missionen:** Ceres-Werft · Eismond Tethys (Tiefflug mit Saturn am Himmel) · Aurin-Nebel (Sternentstehung) · Das Letzte Licht (Sterne erlöschen) · Urlicht (die glühende Plasmawand am Rand des Sichtbaren). Jede mit eigenem Endgegner – der letzte lässt sich nur besiegen, indem man seine Symmetrie bricht.

**Gameplay:** Zwillings-/Hyperlaser, zielsuchender Ladeschuss (Feuer halten), Rolle zum Abprallen gegnerischer Schüsse, Bomben, Schildringe (3 goldene = stärkerer Schild), Flügelmänner, die Hilfe brauchen, Treffer-Medaillen, Checkpoints, Funk-Dialoge mit Pixel-Porträts und „Piep-Stimmen“.

**Steuerung (Handy):** linke Bildschirmhälfte = virtueller Joystick, rechts FEUER / ROLLE / BOMBE. Tastatur: WASD/Pfeile, Leertaste, Q/E, B, P.

**Technik:** three.js (MIT, liegt unter `urlicht/js/three.module.min.js`, damit das Spiel offline läuft). Alles andere selbst gebaut: 3D-Modelle mit PBR-Materialien, Nebel-Panoramahimmel und Planeten (`models.js`), Endgegner (`bosses.js`), Spielkern mit Partikeln und Kollisionen (`game.js`), Level & Story (`levels.js`), Synth-Musik mit Schlagzeug und Effekte (`audio.js`), UI (`main.js`). Werbe-Hook: „Weiterfliegen“ nach einem Abschuss als Belohnungs-Video.
