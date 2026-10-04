# Mein Food Tracker – GitHub Pages Version

Diese Version ist für GitHub Pages vorbereitet. Alle Pfade sind relativ, damit die App auch unter einer Projektadresse wie
`https://DEIN-BENUTZERNAME.github.io/food-tracker/` funktioniert.

## Veröffentlichung auf GitHub Pages

1. Auf GitHub ein neues Repository anlegen, z. B. `food-tracker`.
2. Den **Inhalt dieses Ordners** ins Repository hochladen – `index.html` muss direkt auf oberster Ebene liegen.
3. Auf GitHub im Repository zu **Settings → Pages** gehen.
4. Unter **Build and deployment** bei **Source** `Deploy from a branch` wählen.
5. Branch `main` und Ordner `/(root)` auswählen und speichern.
6. Nach kurzer Zeit erscheint die veröffentlichte HTTPS-Adresse, typischerweise:
   `https://DEIN-BENUTZERNAME.github.io/food-tracker/`

## iPhone

- Die veröffentlichte HTTPS-Adresse in Safari oder Chrome öffnen.
- Für die Installation auf dem Homescreen ist Safari am zuverlässigsten:
  **Teilen → Zum Home-Bildschirm**.
- Kamera und lokale Speicherung funktionieren erst zuverlässig über HTTPS.

## Datenschutz / Speicherung

Die Trackingdaten werden in dieser Version lokal im Browser über `localStorage` gespeichert. Es gibt keinen Benutzeraccount und keine Server-Datenbank. Browserdaten zu löschen oder die Websitedaten zu entfernen kann daher auch die Trackingdaten löschen. Regelmässiger JSON-Export ist empfehlenswert.

## Wichtiger Hinweis zur KI-Fotoanalyse

Die aktuelle Version kann Fotos aufnehmen bzw. auswählen, führt aber noch keine echte KI-Bildanalyse aus. Für die automatische Erkennung von Gerichten, Zutaten, Mengen und Makronährstoffen braucht die App später einen sicheren serverseitigen API-Endpunkt. Ein API-Schlüssel darf nicht direkt in dieser statischen GitHub-Pages-App gespeichert werden.
