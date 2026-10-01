// Basis-URL des BFF (Backend-for-Frontend). Die SPA spricht NUR mit dem BFF,
// nie direkt mit dem Kern-Backend oder TMDB.
// Lokal: laufendes BFF (Standardport 4000), auf Heroku die echte BFF-URL.
const BFF_BASE_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:4000"
    : "https://cinerate-bff-be82e8357e5c.herokuapp.com";

fetch(`${BFF_BASE_URL}/bff/status`)
  .then((res) => res.json())
  .then((data) => {
    document.getElementById("status").textContent =
      data.nachricht + " (Filme in DB: " + data.filmeInDb + ")";
  })
  .catch(() => {
    document.getElementById("status").textContent = "BFF nicht erreichbar";
  });
