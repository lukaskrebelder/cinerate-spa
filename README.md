# cinerate-spa

Single Page Application (Frontend) von CineRate – einer IMDB-ähnlichen
Filmbewertungsseite. Teil der Fallstudie Software Engineering, WS 2026/27.

## Architektur

Diese SPA spricht **ausschließlich mit dem BFF** ([cinerate-bff](../cinerate-bff)),
nie direkt mit dem Kern-Backend oder der TMDB-API. Das BFF bündelt alle
benötigten Daten zu einer für die SPA passenden Antwort (Backend-for-Frontend-Muster).

## Setup

```
npm install
npm start
```

Läuft dann z. B. auf [http://localhost:3000](http://localhost:3000)
(abhängig vom genutzten Static-Server).

Die Basis-URL des BFF wird in `js/api.js` über `BFF_BASE_URL` konfiguriert.

## Tech-Stack

HTML / CSS / Vanilla JavaScript
