# VocabFlix

**Englisch-Vokabeln lernen mit Musik, Spiel und deiner eigenen Welt – mit den Vokabeln aus deinem Schulbuch.**

Made by Werner.

VocabFlix ist ein Vokabeltrainer für die Klassen 5 bis 7 im Stil von Duolingo. Die Vokabeln kommen nicht aus
einem fertigen Kurs, sondern aus dem eigenen Schulbuch: einfach die Vokabelseite fotografieren. Beim Lernen baut
sich mit jeder richtigen Antwort die Musik auf, bis zum großen Finale.

Die App ist eine Web-App (PWA): Sie läuft im Browser und lässt sich auf dem Handy wie eine normale App auf den
Home-Bildschirm legen. Danach funktioniert sie auch **ohne Internet**. Es gibt kein Konto, keine Werbung und kein
Tracking – **alle Daten bleiben auf dem Gerät**.

## Vibes: Jedes Kind wählt seine Welt

Beim ersten Start wählt jedes Kind seinen Namen, seine Welt und seine Figur. Die Welt bestimmt Musik, Farben,
Figur, Ränge, Belohnungen und Sprüche. Unter „Mehr“ lässt sich alles jederzeit ändern.

| | 🎧 Club | 🎮 Gaming | 🐴 Pferde |
|---|---|---|---|
| Musik | Tech-House, Hard-Tekk, Schranz | 8-Bit-Chiptune | Akustik-Pop mit Galopp-Rhythmus |
| Look | Neon | Pixel, Retro | warm, Reiterhof |
| Figur | Zemi, Manga-DJ | Pixel-Held (Farbe wählbar) | eigenes Pferd (Name, Fellfarbe) |
| Ränge | Bedroom-DJ → DJ-Legende | Noob → Gaming-Legende | Stallhilfe → Legende des Reiterhofs |
| Belohnung pro Unit | Schallplatten | Pokale | Schleifen |

Die Musik wird live im Browser erzeugt (Web Audio), es werden keine Audiodateien oder fremden Songs verwendet.
Jeder Musikstil lässt sich mit jeder Welt kombinieren.

## Funktionen

- **Kurze Runden** mit 10 Wörtern: Multiple Choice, Hören (auch langsam), selbst Eintippen, Paare finden.
  Die Übungen werden schwieriger, je besser ein Wort sitzt.
- **Musik als Belohnung:** Richtige Antworten in Folge schalten Spur für Spur frei (Kick → Hi-Hats → Bass → … →
  Finale). Ein Fehler lässt die Musik kurz einbrechen.
- **Wiederholung nach dem Karteikasten-Prinzip:** Gewusste Wörter kommen nach 1, 2, 4, 7, 14 und 30 Tagen wieder.
- **Vokabeln per Foto erfassen:** Seite fotografieren, Rahmen um die Vokabeln ziehen, prüfen, speichern.
  Die Texterkennung liegt in der App selbst – Fotos verlassen das Gerät nicht.
- **Ziele fürs ganze Schuljahr:** Belohnungen pro Unit (Bronze → Silber → Gold → Platin), 14 Erfolgs-Serien mit
  79 Stufen, Spezial-Erfolge, wöchentlich wechselnde Challenge, 12 Ränge pro Welt.
- **Freiwilliger Lernpass:** Ein Bild mit Rang, Units und Lernserie, das das Kind selbst teilen kann – zum Beispiel
  mit Eltern oder Lehrkraft.
- **Sicherung** als Datei exportieren und auf einem anderen Gerät importieren.

## Installation

Die App muss einmal über **https** erreichbar sein, zum Beispiel mit GitHub Pages:

1. Im Repository unter **Settings → Pages** den Branch und den Ordner `/ (root)` auswählen.
2. Die angezeigte Adresse auf dem Handy öffnen.
3. **iPhone:** in Safari auf **Teilen → „Zum Home-Bildschirm“**. **Android:** in Chrome im Menü auf
   **„App installieren“**.

## Vokabeln aus dem Buch fotografieren

Die Erfassung erkennt typische Schulbuch-Layouts mit den Spalten **Englisch (mit Lautschrift) | Deutsch |
Beispielsatz** – zum Beispiel aus English G Lighthouse (Cornelsen). Die Spalten werden anhand der Wortpositionen
erkannt, Lautschrift und Beispielsätze fallen weg, zweizeilige Übersetzungen werden zusammengefügt.

1. **Erfassen** → Unit eintragen → **Foto machen**
2. **Rahmen um die Vokabeln ziehen** – ohne Bilder und ohne die Nachbarseite.
3. **Text erkennen** → in der Vorschau prüfen, korrigieren, falsche Zeilen mit ✕ löschen → **Speichern**

Tipps: Buch flach hinlegen, gerade von oben und mit gutem Licht fotografieren. Die Texterkennung ist nicht
perfekt – einzelne Buchstaben oder Umlaute können falsch sein, deshalb immer kurz über die Vorschau schauen.

Die Beispiel-Unit in der App ist ein kurzer Auszug aus Lighthouse 1 zum Ausprobieren.
Vokabellisten aus Schulbüchern sind urheberrechtlich geschützt und werden nicht mit der App verbreitet.

## Daten und Datenschutz

- Kein Konto, keine Anmeldung, keine Werbung, kein Tracking.
- Vokabeln, Fortschritt und Einstellungen liegen nur im Browser-Speicher des Geräts.
- Die Texterkennung läuft vollständig auf dem Gerät; die nötigen Dateien werden von derselben Seite geladen wie die App.
- Wer die App oder die Website-Daten löscht, verliert den Stand. Deshalb ab und zu unter
  **Mehr → Sicherung exportieren** eine Sicherung ablegen.

## Technik

Reines HTML/CSS/JavaScript ohne Build-Schritt:

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst |
| `js/app.js` | App-Logik: Ansichten, Runden, Speicherung, Kamera/Texterkennung, Ersteinstieg, Lernpass |
| `js/vibes.js` | Die Welten (Club, Gaming, Pferde): Ränge, Begriffe, Sprüche, Farben |
| `js/mascots.js` | Figuren als SVG: Zemi, Pixel-Held, Pferd |
| `js/beat.js` | Musik-Engine (Web Audio): Tech-House, Hard-Tekk, Schranz, Chiptune, Akustik-Pop; Soundeffekte |
| `js/goals.js` | Ziele: Unit-Belohnungen, Erfolgs-Serien, Spezial-Erfolge, Wochen-Challenge |
| `js/answers.js` | Antwortprüfung und Auswertung der Texterkennung (Spaltenlayout) |
| `css/style.css` | Design inklusive der Farbwelten |
| `sw.js` | Service Worker für den Offline-Betrieb |
| `vendor/tesseract/` | Texterkennung [tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0), lokal mitgeliefert |

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.
Tests: `node --test tests/*.test.js`

Nach Änderungen an der App in `sw.js` die `VERSION` erhöhen, damit installierte Apps das Update laden.
