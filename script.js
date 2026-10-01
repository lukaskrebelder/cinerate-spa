// Basis-URL des BFF (Backend-for-Frontend). Die SPA spricht NUR mit dem BFF,
// nie direkt mit dem Kern-Backend oder TMDB.
// Lokal: laufendes BFF (Standardport 4000). Nach dem Deployment auf die
// echte BFF-URL anpassen (z. B. "https://cinerate-bff.herokuapp.com").
const BFF_BASE_URL = "http://localhost:4000";

fetch(`${BFF_BASE_URL}/bff/status`)
  .then((res) => res.json())
  .then((data) => {
    document.getElementById("status").textContent =
      data.nachricht + " (Filme in DB: " + data.filmeInDb + ")";
  })
  .catch(() => {
    document.getElementById("status").textContent = "BFF nicht erreichbar";
  });
