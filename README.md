# Mein Food Tracker – Version 9 mit Gemini-KI

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
