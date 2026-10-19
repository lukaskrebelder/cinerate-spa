// KI-Log B4: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Filmsuche aus js/api.js (US-5).
import test from "node:test";
import assert from "node:assert";
import { baueSuchpfad, sucheFilme, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
import { speichereToken } from "../js/auth.js";

// Baut eine Antwort, wie fetch sie liefert (ok, status und json()).
function antwort(status, inhalt) {
  return { ok: status >= 200 && status < 300, status, json: async () => inhalt };
}

//--> baueSuchpfad

test("baueSuchpfad liefert ohne Eingaben nur /movies", () => {
  assert.strictEqual(baueSuchpfad(), "/movies");
  assert.strictEqual(baueSuchpfad({ query: "", genre: "", page: 1 }), "/movies");
});

test("baueSuchpfad nimmt Titel, Genre und Seite in die Adresse auf", () => {
  assert.strictEqual(
    baueSuchpfad({ query: "Interstellar", genre: "Science Fiction", page: 2 }),
    "/movies?query=Interstellar&genre=Science+Fiction&page=2"
  );
});

test("baueSuchpfad entfernt Leerzeichen am Rand und lässt Leeres weg", () => {
  assert.strictEqual(baueSuchpfad({ query: "  Matrix  ", genre: "   " }), "/movies?query=Matrix");
});

test("baueSuchpfad kodiert Sonderzeichen", () => {
  assert.strictEqual(baueSuchpfad({ query: "Tom & Jerry" }), "/movies?query=Tom+%26+Jerry");
});

test("baueSuchpfad nimmt Seite 1 und ungültige Seiten nicht auf", () => {
  assert.strictEqual(baueSuchpfad({ page: 1 }), "/movies");
  assert.strictEqual(baueSuchpfad({ page: 0 }), "/movies");
  assert.strictEqual(baueSuchpfad({ page: "2" }), "/movies");
});

//--> sucheFilme

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

test("sucheFilme ruft GET /bff/movies mit Suche und Token auf und liefert die Treffer", async () => {
  const treffer = { page: 1, totalPages: 3, movies: [{ movieId: 157336, title: "Interstellar", posterUrl: null }] };
  await mitToken("abc123", () => antwort(200, treffer), async (aufrufe) => {
    const ergebnis = await sucheFilme({ query: "Interstellar", genre: "Science Fiction" });
    assert.ok(aufrufe[0].url.endsWith("/bff/movies?query=Interstellar&genre=Science+Fiction"));
    assert.strictEqual(aufrufe[0].optionen.method, "GET");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(ergebnis, treffer);
  });
});

test("sucheFilme wirft bei einem Fehlerfilter (400) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(400, { message: "Invalid filter value." }), async () => {
    await assert.rejects(sucheFilme({ genre: "Unbekannt" }), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 400);
      return true;
    });
  });
});

test("sucheFilme meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(sucheFilme({}), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
}); 