# Mein Food Tracker – GitHub Pages + KI-Fotoanalyse

Die Web-App läuft weiterhin statisch auf GitHub Pages. Persönliche Trackingdaten bleiben lokal im Browser. Für die KI-Bildanalyse wird zusätzlich ein kleiner Cloudflare Worker als sicherer Backend-Endpunkt verwendet. Der OpenAI-API-Schlüssel liegt nur dort als Secret und **nicht** im GitHub-Repository.

## 1. GitHub Pages aktualisieren

1. Den Inhalt dieses Ordners in Dein bestehendes `food-tracker`-Repository hochladen und die bisherigen Dateien ersetzen.
2. `index.html` muss direkt im Hauptverzeichnis liegen.
3. GitHub Pages bleibt wie bisher auf `main` + `/(root)`.
4. Nach dem Deployment die App auf dem iPhone einmal vollständig schliessen und neu öffnen. Der PWA-Cache wurde auf Version 9 erhöht.

## 2. OpenAI API vorbereiten

Du brauchst einen OpenAI-API-Schlüssel mit aktivierter API-Abrechnung. Der Schlüssel wird **nicht** in die Web-App eingetragen und nicht auf GitHub gespeichert.

## 3. Cloudflare Worker anlegen

Ein kostenloser Cloudflare-Account reicht für den Start meist aus.

1. Cloudflare Dashboard öffnen → **Workers & Pages** → **Create** → Worker erstellen.
2. Den Standardcode vollständig durch den Inhalt von `worker.js` ersetzen und deployen.
3. Unter **Settings → Variables and Secrets** folgende Werte anlegen:
   - Secret `OPENAI_API_KEY` = Dein OpenAI API Key
   - Secret `APP_TOKEN` = ein langes persönliches Passwort/Token, z. B. mindestens 24 zufällige Zeichen
   - Variable `ALLOWED_ORIGIN` = `https://DEIN-GITHUB-NAME.github.io`
   - optional Variable `OPENAI_MODEL` = `gpt-6-luna`
4. Worker erneut deployen.
5. Die Worker-Adresse kopieren, z. B. `https://food-tracker-ai.DEIN-SUBDOMAIN.workers.dev/analyze`.

Hinweis: Die GitHub-Pages-Origin enthält bei Projektseiten **nicht** den Repository-Namen. Bei `https://name.github.io/food-tracker/` ist `ALLOWED_ORIGIN` also `https://name.github.io`.

## 4. KI in der App verbinden

1. Food Tracker öffnen → **Profil** → **KI-Verbindung**.
2. Bei **KI-Endpunkt** die Worker-Adresse mit `/analyze` eintragen.
3. Bei **App-Token** denselben Wert eintragen, den Du im Worker als `APP_TOKEN` gespeichert hast.
4. **KI-Verbindung speichern**.

Das App-Token wird nur lokal in Deinem Browser gespeichert. Der eigentliche OpenAI-API-Schlüssel bleibt ausschliesslich im Cloudflare Worker.

## 5. Foto analysieren

1. In der Mitte auf `+` gehen.
2. **Kamera** oder **Foto auswählen** verwenden.
3. **✨ Foto mit KI analysieren** drücken.
4. Die KI versucht Gericht, Zutaten, Mengen und Makronährstoffe zu erkennen.
5. Bei gemischten Gerichten wie Ratatouille werden plausible Bestandteile einzeln aufgelistet.
6. Vor dem Speichern jede Zutat und Menge prüfen und bei Bedarf korrigieren.

Die Mengen und Nährwerte aus einem Foto sind Schätzungen. Besonders Öl, Saucen, versteckte Zutaten und Portionsgrössen lassen sich aus einem einzelnen Bild nur näherungsweise bestimmen.

## Datenschutz

- Mahlzeiten, Check-ins und Körperdaten: lokal im Browser (`localStorage`).
- Foto bei KI-Analyse: wird an Deinen Cloudflare Worker und von dort an die OpenAI API übertragen.
- Das Foto wird von dieser App nicht dauerhaft gespeichert.
- Der OpenAI-API-Schlüssel ist nicht im GitHub-Pages-Code enthalten.

## Version 9

- echte KI-Fotoanalyse vorbereitet und im Frontend integriert
- verarbeitet Kamera- und Foto-Upload
- erkennt auch zusammengesetzte Gerichte und zerlegt sie in Zutaten
- schätzt Mengen und Makronährstoffe je Zutat
- gleicht erkannte Zutaten mit Deiner persönlichen Verträglichkeitsliste ab
- unbekannte Lebensmittel werden als `Nicht zugeordnet` markiert
- KI-Endpunkt und persönliches App-Token können direkt in der App konfiguriert werden
- API-Key bleibt serverseitig im Cloudflare Worker


## Version 9
- Cloudflare-Endpunkt ist in der App bereits voreingetragen.
- Der Hinweistext unter der Fotoanalyse wurde entfernt.
- Die KI-Anweisung für gemischte/verarbeitete Gerichte wurde deutlich verschärft; solche Gerichte sollen in einzelne Zutaten zerlegt werden.
- Standardmodell im Worker ist GPT-6.1 Sol mit hoher Bilddetailstufe.
