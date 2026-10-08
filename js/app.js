import { holeStatus } from "./api.js";

const statusElement = document.getElementById("status");

holeStatus()
  .then((daten) => {
    statusElement.textContent = daten.nachricht;
  })
  .catch(() => {
    statusElement.textContent = "BFF nicht erreichbar";
  });