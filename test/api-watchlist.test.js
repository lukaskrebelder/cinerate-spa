// KI-Log B28: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Aufrufe der Watchlist aus js/api.js (PB-21 und PB-22).
import test from "node:test";
import assert from "node:assert";
import { holeWatchlist, fuegeZurWatchlistHinzu, entferneVonWatchlist, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
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

//--> holeWatchlist

test("holeWatchlist ruft GET /bff/watchlist mit Token auf und liefert die Filme", async () => {
  const liste = { movies: [{ movieId: 157336, title: "Interstellar", posterUrl: null }] };
  await mitToken("abc123", () => antwort(200, liste), async (aufrufe) => {
    const ergebnis = await holeWatchlist();
    assert.ok(aufrufe[0].url.endsWith("/bff/watchlist"));
    assert.strictEqual(aufrufe[0].optionen.method, "GET");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(ergebnis, liste);
  });
});

test("holeWatchlist liefert bei einer leeren Watchlist eine leere Liste", async () => {
  await mitToken("abc123", () => antwort(200, { movies: [] }), async () => {
    assert.deepStrictEqual(await holeWatchlist(), { movies: [] });
  });
});

test("holeWatchlist meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeWatchlist(), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

test("holeWatchlist schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(200, { movies: [] }), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeWatchlist(), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

//--> fuegeZurWatchlistHinzu

test("fuegeZurWatchlistHinzu schickt POST /bff/watchlist mit der Film-ID als Zahl und dem Token", async () => {
  const bestaetigung = { message: "Movie was added to your watchlist." };
  await mitToken("abc123", () => antwort(201, bestaetigung), async (aufrufe) => {
    const ergebnis = await fuegeZurWatchlistHinzu(157336);
    assert.ok(aufrufe[0].url.endsWith("/bff/watchlist"));
    assert.strictEqual(aufrufe[0].optionen.method, "POST");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), { movieId: 157336 });
    assert.deepStrictEqual(ergebnis, bestaetigung);
  });
});

test("fuegeZurWatchlistHinzu wandelt eine Film-ID als Text in eine Zahl um", async () => {
  await mitToken("abc123", () => antwort(201, {}), async (aufrufe) => {
    await fuegeZurWatchlistHinzu("157336");
    assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), { movieId: 157336 });
  });
});

test("fuegeZurWatchlistHinzu wirft bei einem Film, der schon auf der Watchlist steht (409), einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(409, { message: "Movie is already on your watchlist." }), async () => {
    await assert.rejects(fuegeZurWatchlistHinzu(157336), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 409);
      return true;
    });
  });
});

test("fuegeZurWatchlistHinzu wirft bei einem unbekannten Film (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No movie found for this ID." }), async () => {
    await assert.rejects(fuegeZurWatchlistHinzu(1), (fehler) => fehler instanceof ApiFehler && fehler.status === 404);
  });
});

test("fuegeZurWatchlistHinzu meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(fuegeZurWatchlistHinzu(157336), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

//--> entferneVonWatchlist

test("entferneVonWatchlist schickt DELETE /bff/watchlist/{ID} mit Token", async () => {
  const bestaetigung = { message: "Movie was removed from your watchlist." };
  await mitToken("abc123", () => antwort(200, bestaetigung), async (aufrufe) => {
    const ergebnis = await entferneVonWatchlist(157336);
    assert.ok(aufrufe[0].url.endsWith("/bff/watchlist/157336"));
    assert.strictEqual(aufrufe[0].optionen.method, "DELETE");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.strictEqual(aufrufe[0].optionen.body, undefined);
    assert.deepStrictEqual(ergebnis, bestaetigung);
  });
});

test("entferneVonWatchlist kodiert die ID in der Adresse", async () => {
  await mitToken("abc123", () => antwort(404, { message: "Movie is not on your watchlist." }), async (aufrufe) => {
    await assert.rejects(entferneVonWatchlist("12/3?x=1"));
    assert.ok(aufrufe[0].url.endsWith("/bff/watchlist/12%2F3%3Fx%3D1"));
  });
});

test("entferneVonWatchlist wirft bei einem Film, der nicht auf der Watchlist steht (404), einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "Movie is not on your watchlist." }), async () => {
    await assert.rejects(entferneVonWatchlist(1), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 404);
      return true;
    });
  });
});

test("entferneVonWatchlist wirft bei nicht erreichbarem BFF einen ApiFehler mit Status 0", async () => {
  await mitToken(
    "abc123",
    () => {
      throw new TypeError("fetch failed");
    },
    async () => {
      await assert.rejects(entferneVonWatchlist(157336), (fehler) => fehler instanceof ApiFehler && fehler.status === 0);
    }
  );
});

test("entferneVonWatchlist meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(entferneVonWatchlist(157336), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});