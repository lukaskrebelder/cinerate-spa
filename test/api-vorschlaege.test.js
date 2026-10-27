// KI-Log B30: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für den Aufruf der Filmvorschläge aus js/api.js (PB-26).
import test from "node:test";
import assert from "node:assert";
import { holeVorschlaege, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
import { speichereToken } from "../js/auth.js";

// Baut eine Antwort, wie fetch sie liefert (ok, status und json()).
function antwort(status, inhalt) {
  return { ok: status >= 200 && status < 300, status, json: async () => inhalt };
}

// Ersatz für localStorage mit Token und für fetch. Danach ist alles wieder wie vorher.
async function mitToken(token, ersatz, pruefung) {
  const speicher = new Map();
  const originalSpeicher = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => speicher.set(k, String(v)),
      removeItem: (k) => speicher.delete(k),
    },
  });
  if (token) speichereToken(token);

  const originalFetch = globalThis.fetch;
  const aufrufe = [];
  globalThis.fetch = async (url, optionen) => {
    aufrufe.push({ url, optionen });
    return ersatz();
  };
  try {
    await pruefung(aufrufe);
  } finally {
    setzeSitzungsHandler(() => {});
    globalThis.fetch = originalFetch;
    if (originalSpeicher) Object.defineProperty(globalThis, "localStorage", originalSpeicher);
    else delete globalThis.localStorage;
  }
}

const vorschlaege = {
  favoriteGenre: "Science Fiction",
  movies: [
    { movieId: 329865, title: "Arrival", description: "Linguistin soll Außerirdische verstehen.", posterUrl: "https://image.tmdb.org/t/p/w500/a.jpg" },
    { movieId: 603, title: "Matrix", description: null, posterUrl: null },
  ],
};

//--> holeVorschlaege

test("holeVorschlaege ruft GET /bff/recommendations mit Token auf und liefert Genre und Filme", async () => {
  await mitToken("abc123", () => antwort(200, vorschlaege), async (aufrufe) => {
    const ergebnis = await holeVorschlaege();
    assert.ok(aufrufe[0].url.endsWith("/bff/recommendations"));
    assert.strictEqual(aufrufe[0].optionen.method, "GET");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(ergebnis, vorschlaege);
  });
});

test("holeVorschlaege wirft bei zu wenigen Bewertungen (400) einen ApiFehler und behält die Meldung", async () => {
  await mitToken("abc123", () => antwort(400, { message: "Please rate at least 3 movies first." }), async () => {
    await assert.rejects(holeVorschlaege(), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 400);
      assert.strictEqual(fehler.message, "Please rate at least 3 movies first.");
      return true;
    });
  });
});

test("holeVorschlaege wirft ohne neue Vorschläge (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No new recommendations available." }), async () => {
    await assert.rejects(holeVorschlaege(), (fehler) => fehler instanceof ApiFehler && fehler.status === 404);
  });
});

test("holeVorschlaege wirft bei nicht erreichbarem BFF einen ApiFehler mit Status 0", async () => {
  await mitToken(
    "abc123",
    () => {
      throw new TypeError("fetch failed");
    },
    async () => {
      await assert.rejects(holeVorschlaege(), (fehler) => fehler instanceof ApiFehler && fehler.status === 0);
    }
  );
});

test("holeVorschlaege meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeVorschlaege(), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

test("holeVorschlaege schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(200, vorschlaege), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeVorschlaege(), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});