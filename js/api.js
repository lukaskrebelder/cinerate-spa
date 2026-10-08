// Basis-URL des BFF. Lokal: localhost:4000, sonst die Heroku-Adresse.
export const BFF_BASE_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:4000"
    : "https://cinerate-bff-be82e8357e5c.herokuapp.com";

export async function holeStatus() {
  const antwort = await fetch(`${BFF_BASE_URL}/bff/status`);
  return antwort.json();
}