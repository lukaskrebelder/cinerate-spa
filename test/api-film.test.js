// KI-Log B23: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für den Aufruf der Filmdetails aus js/api.js (PB-17).
import test from "node:test";
import assert from "node:assert";
import { holeFilm, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
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

const interstellar = {
  movieId: 157336,
  title: "Interstellar",
  description: "Eine Reise durch ein Wurmloch.",
  genres: ["Abenteuer", "Science Fiction"],
  fsk: 12,
  releaseYear: 2014,
  runtime: 169,
  posterUrl: "https://image.tmdb.org/t/p/w500/a.jpg",
  avgRating: null,
};

//--> holeFilm

test("holeFilm ruft GET /bff/movies/{ID} mit Token auf und liefert den Film", async () => {
  await mitToken("abc123", () => antwort(200, interstellar), async (aufrufe) => {
    const film = await holeFilm("157336");
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336"));
    assert.strictEqual(aufrufe[0].optionen.method, "GET");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(film, interstellar);
  });
});

test("holeFilm kodiert die ID in der Adresse", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No movie found for this ID." }), async (aufrufe) => {
    await assert.rejects(holeFilm("12/3?x=1"));
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/12%2F3%3Fx%3D1"));
  });
});

test("holeFilm wirft bei einem unbekannten Film (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No movie found for this ID." }), async () => {
    await assert.rejects(holeFilm("1"), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 404);
      return true;
    });
  });
});

test("holeFilm wirft bei nicht erreichbarem BFF einen ApiFehler mit Status 0", async () => {
  await mitToken(
    "abc123",
    () => {
      throw new TypeError("fetch failed");
    },
    async () => {
      await assert.rejects(holeFilm("157336"), (fehler) => fehler instanceof ApiFehler && fehler.status === 0);
    }
  );
});

test("holeFilm meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeFilm("157336"), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

test("holeFilm schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(200, interstellar), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeFilm("157336"), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});