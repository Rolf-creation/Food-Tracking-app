# Mein Food Tracker – Version 10 mit Gemini-KI

Die Web-App läuft weiterhin statisch auf GitHub Pages. Persönliche Trackingdaten bleiben lokal im Browser. Für die KI-Bildanalyse wird ein Cloudflare Worker als sicherer Backend-Endpunkt verwendet. Der Gemini-API-Schlüssel liegt nur dort als Secret und **nicht** im GitHub-Repository.

## 1. GitHub Pages aktualisieren

1. Den Inhalt dieses Ordners in Dein bestehendes `food-tracker`-Repository hochladen und die bisherigen Dateien ersetzen.
2. `index.html` muss direkt im Hauptverzeichnis liegen.
3. GitHub Pages bleibt wie bisher auf `main` + `/(root)`.
4. Nach dem Deployment die App auf dem iPhone einmal vollständig schliessen und neu öffnen. Der PWA-Cache wurde für die Gemini-Version aktualisiert.

## 2. Gemini API vorbereiten

Du brauchst einen Gemini-API-Schlüssel. Der Schlüssel wird **nicht** in die Web-App eingetragen und nicht auf GitHub gespeichert.

## 3. Cloudflare Worker aktualisieren

1. Cloudflare Dashboard öffnen → Deinen Worker `food-tracker-ai` → **Edit code**.
2. Den vorhandenen Worker-Code vollständig durch den Inhalt von `worker.js` aus diesem Ordner ersetzen.
3. Deployen.
4. Unter **Settings → Variables and Secrets** folgende Werte anlegen bzw. anpassen:
   - Secret `GEMINI_API_KEY` = Dein Gemini API Key
   - Secret `APP_TOKEN` = Dein bestehendes persönliches Token
   - Variable `ALLOWED_ORIGIN` = `https://DEIN-GITHUB-NAME.github.io`
   - optional Variable `GEMINI_MODEL` = `gemini-3-flash-preview`
5. Das alte Secret `OPENAI_API_KEY` kann danach entfernt werden.
6. Worker erneut deployen.

Hinweis: Bei einer GitHub-Projektseite wie `https://name.github.io/food-tracker/` lautet die Origin nur `https://name.github.io`.

## 4. KI in der App verbinden

Der Cloudflare-Endpunkt ist in dieser Version bereits im Frontend voreingetragen. Auf jedem Gerät musst Du nur noch Dein bestehendes `APP_TOKEN` unter **Profil → KI-Verbindung** eintragen und speichern. Wenn Du einen anderen Worker-Endpunkt nutzt, kannst Du ihn dort überschreiben.

Das App-Token wird nur lokal im jeweiligen Browser gespeichert. Der Gemini-API-Schlüssel bleibt ausschliesslich im Cloudflare Worker.

## 5. Foto analysieren

1. In der Mitte auf `+` gehen.
2. **Kamera** oder **Foto auswählen** verwenden.
3. **✨ Foto mit KI analysieren** drücken.
4. Gemini versucht Gericht, Zutaten, Mengen und Makronährstoffe zu erkennen.
5. Bei gemischten Gerichten wie Ratatouille werden plausible Bestandteile einzeln aufgelistet.
6. Vor dem Speichern jede Zutat und Menge prüfen und bei Bedarf korrigieren.

Die Mengen und Nährwerte aus einem Foto bleiben Schätzungen. Besonders Öl, Saucen, versteckte Zutaten und Portionsgrössen lassen sich aus einem einzelnen Bild nur näherungsweise bestimmen.

## Datenschutz

- Mahlzeiten, Check-ins und Körperdaten: lokal im Browser (`localStorage`).
- Foto bei KI-Analyse: wird an Deinen Cloudflare Worker und von dort an die Gemini API übertragen.
- Das Foto wird von dieser App nicht dauerhaft gespeichert.
- Der Gemini-API-Schlüssel ist nicht im GitHub-Pages-Code enthalten.

## Version 9 – Gemini-Anpassung

- Frontend bleibt mit der bisherigen Version 9 kompatibel
- Cloudflare Worker von OpenAI auf Gemini umgestellt
- Gemini-Bildinput via `inline_data`
- strukturierte JSON-Ausgabe für Gericht, Zutaten, Mengen und Makros
- verbesserte Aufschlüsselung von verarbeiteten/gemischten Gerichten
- Standardmodell: `gemini-3-flash-preview` (über `GEMINI_MODEL` änderbar)
- bestehender `/analyze`-Endpunkt und `APP_TOKEN` bleiben unverändert


## Stabilitaetsfix V9.1
- `maxOutputTokens` auf 8192 erhoeht
- Gemini Thinking auf `low` gesetzt
- robustere JSON-Auswertung (mehrere Text-Parts, Code-Fences, Begleittext)
- bessere Fehlermeldungen mit `finishReason` und Token-Nutzung


## Version 10 – Auswertungen und Erfassung
- Rubrik «Heute»: Trinkmenge als normale Kennzahl plus Aufteilung nach Wasser, Kaffee und Kräutertee
- Rubrik «Woche»: immer die letzten 7 Tage einschliesslich heute, keine Kalenderwoche
- «Selten» enthält in der Wochenansicht zusätzlich nicht zugeordnete Lebensmittel
- Manuelle Erfassung beliebiger, nicht zugeordneter Lebensmittel möglich
- Feld «Analyse von verarbeiteten Speisen» wieder aufgenommen und als Hinweis an Gemini übermittelt
- 30-Tage-Analyse: Trinkmenge in derselben Kennzahlen-Darstellung
- Reaktionsverlauf als Chart
- Gewicht und Bauchumfang als separate Verlaufcharts
- Lokale Daten bleiben kompatibel: der bestehende localStorage-Key `foodTrackerState` wurde unverändert beibehalten

## Version 10.3 – gemeinsamer KI-Analyseknopf
- Ein einziger Button **«✨ Mit KI analysieren»** wird für beide Eingabearten verwendet.
- Analyse ist möglich entweder mit Foto **oder** nur über das Feld «Analyse von verarbeiteten Speisen».
- Bei Texteingabe ohne Foto rekonstruiert Gemini eine typische Portion und zerlegt sie in plausible Einzelzutaten.
- Bestehende lokal gespeicherte Daten bleiben unverändert nutzbar; der Speicher-Schlüssel wurde nicht geändert.


## Version 10.3
Bei der KI-Erfassung ist immer nur eine Eingabeart aktiv: Wird ein Foto gewählt, wird das Feld für verarbeitete Speisen automatisch geleert. Sobald dort Text eingegeben wird, wird ein bereits ausgewähltes Foto inklusive Vorschau entfernt. Beide Eingaben verwenden denselben Button „Mit KI analysieren“. Die lokalen Trackingdaten und der bestehende Speicherschlüssel bleiben unverändert.


## Version 10.3
- Der Button „Mit KI analysieren“ bleibt auf iPhone/Chrome/Safari sichtbar und wird je nach Eingabe aktiviert/deaktiviert.
- Texteingaben reagieren zusätzlich auf input, change, keyup und paste, damit iOS-Eingabemethoden zuverlässig erkannt werden.
- Foto und Texteingabe bleiben gegenseitig ausschliessend.
- Der lokale Speicherschlüssel foodTrackerState bleibt unverändert.
