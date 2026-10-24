// KI-Log B26: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Aufrufe der Bewertungen aus js/api.js (PB-18 bis PB-20).
import test from "node:test";
import assert from "node:assert";
import { holeBewertungen, bewerteFilm, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
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

//--> holeBewertungen

test("holeBewertungen ruft GET /bff/movies/{ID}/ratings mit Token auf und liefert die Bewertungen", async () => {
  const bewertungen = { avgRating: 4.5, ratingCount: 2, ownStars: 5 };
  await mitToken("abc123", () => antwort(200, bewertungen), async (aufrufe) => {
    const ergebnis = await holeBewertungen(157336);
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336/ratings"));
    assert.strictEqual(aufrufe[0].optionen.method, "GET");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(ergebnis, bewertungen);
  });
});

test("holeBewertungen liefert ohne Bewertungen null, 0 und null", async () => {
  const leer = { avgRating: null, ratingCount: 0, ownStars: null };
  await mitToken("abc123", () => antwort(200, leer), async () => {
    assert.deepStrictEqual(await holeBewertungen(1), leer);
  });
});

test("holeBewertungen wirft bei einem unbekannten Film (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No movie found for this ID." }), async () => {
    await assert.rejects(holeBewertungen(1), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 404);
      return true;
    });
  });
});

test("holeBewertungen meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeBewertungen(157336), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

test("holeBewertungen schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(200, {}), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeBewertungen(157336), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

//--> bewerteFilm

test("bewerteFilm schickt POST /bff/movies/{ID}/ratings mit den Sternen und dem Token", async () => {
  const gespeichert = { message: "Your rating has been saved.", stars: 4, avgRating: 4.0 };
  await mitToken("abc123", () => antwort(201, gespeichert), async (aufrufe) => {
    const ergebnis = await bewerteFilm(157336, 4);
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336/ratings"));
    assert.strictEqual(aufrufe[0].optionen.method, "POST");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), { stars: 4 });
    assert.deepStrictEqual(ergebnis, gespeichert);
  });
});

test("bewerteFilm akzeptiert auch die Antwort 200 für eine geänderte Bewertung", async () => {
  const geaendert = { message: "Your rating has been updated.", stars: 2, avgRating: 3.5 };
  await mitToken("abc123", () => antwort(200, geaendert), async () => {
    assert.deepStrictEqual(await bewerteFilm(157336, 2), geaendert);
  });
});

test("bewerteFilm wirft bei ungültigen Sternen (400) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(400, { message: "Please choose 1 to 5 stars." }), async () => {
    await assert.rejects(bewerteFilm(157336, 9), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 400);
      return true;
    });
  });
});

test("bewerteFilm wirft bei nicht erreichbarem BFF einen ApiFehler mit Status 0", async () => {
  await mitToken(
    "abc123",
    () => {
      throw new TypeError("fetch failed");
    },
    async () => {
      await assert.rejects(bewerteFilm(157336, 3), (fehler) => fehler instanceof ApiFehler && fehler.status === 0);
    }
  );
});

test("bewerteFilm meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(bewerteFilm(157336, 3), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

test("bewerteFilm schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(201, {}), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(bewerteFilm(157336, 3), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});