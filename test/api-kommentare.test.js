// KI-Log B49: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Aufrufe der Kommentare aus js/api.js (PB-32, PB-33 und PB-35).
import test from "node:test";
import assert from "node:assert";
import {
  holeKommentare,
  schreibeKommentar,
  aendereKommentar,
  loescheKommentar,
  setzeSitzungsHandler,
  ApiFehler,
} from "../js/api.js";
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

const seite = {
  page: 1,
  totalPages: 1,
  comments: [
    { commentId: "c_1042", userId: "u_58", firstName: "Lena", text: "Spannend!", createdAt: "2026-10-01T18:30:00Z", updatedAt: null },
  ],
};

//--> holeKommentare

test("holeKommentare ruft GET /bff/movies/{ID}/comments mit Token auf und liefert die Seite", async () => {
  await mitToken("abc123", () => antwort(200, seite), async (aufrufe) => {
    const ergebnis = await holeKommentare(157336);
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336/comments"));
    assert.strictEqual(aufrufe[0].optionen.method, "GET");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(ergebnis, seite);
  });
});

test("holeKommentare hängt die Seite nur ab Seite 2 an die Adresse an", async () => {
  await mitToken("abc123", () => antwort(200, seite), async (aufrufe) => {
    await holeKommentare(1, 1);
    await holeKommentare(1, 2);
    await holeKommentare(1, 0);
    await holeKommentare(1, "3");
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/1/comments"));
    assert.ok(aufrufe[1].url.endsWith("/bff/movies/1/comments?page=2"));
    assert.ok(aufrufe[2].url.endsWith("/bff/movies/1/comments"));
    assert.ok(aufrufe[3].url.endsWith("/bff/movies/1/comments"));
  });
});

test("holeKommentare liefert bei einem Film ohne Kommentare eine leere Liste", async () => {
  const leer = { page: 1, totalPages: 1, comments: [] };
  await mitToken("abc123", () => antwort(200, leer), async () => {
    assert.deepStrictEqual(await holeKommentare(1), leer);
  });
});

test("holeKommentare wirft bei einem unbekannten Film (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No movie found for this ID." }), async () => {
    await assert.rejects(holeKommentare(1), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 404);
      return true;
    });
  });
});

test("holeKommentare meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeKommentare(157336), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

test("holeKommentare schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(200, {}), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(holeKommentare(157336), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

//--> schreibeKommentar

test("schreibeKommentar schickt POST /bff/movies/{ID}/comments mit dem Text und dem Token", async () => {
  const gespeichert = { message: "Your comment has been posted.", commentId: "c_1043" };
  await mitToken("abc123", () => antwort(201, gespeichert), async (aufrufe) => {
    const ergebnis = await schreibeKommentar(157336, "Toller Film");
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336/comments"));
    assert.strictEqual(aufrufe[0].optionen.method, "POST");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), { text: "Toller Film" });
    assert.deepStrictEqual(ergebnis, gespeichert);
  });
});

test("schreibeKommentar wirft bei falscher Länge (400) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(400, { message: "Comment must have 1 to 500 characters." }), async () => {
    await assert.rejects(schreibeKommentar(157336, ""), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 400);
      return true;
    });
  });
});

test("schreibeKommentar wirft bei nicht erreichbarem BFF einen ApiFehler mit Status 0", async () => {
  await mitToken(
    "abc123",
    () => {
      throw new TypeError("fetch failed");
    },
    async () => {
      await assert.rejects(schreibeKommentar(157336, "Hallo"), (fehler) => fehler instanceof ApiFehler && fehler.status === 0);
    }
  );
});

test("schreibeKommentar schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(201, {}), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(schreibeKommentar(157336, "Hallo"), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

//--> aendereKommentar

test("aendereKommentar schickt PUT /bff/movies/{ID}/comments/{commentId} mit dem neuen Text", async () => {
  const geaendert = { message: "Your comment has been updated." };
  await mitToken("abc123", () => antwort(200, geaendert), async (aufrufe) => {
    const ergebnis = await aendereKommentar(157336, "c_1042", "Doch nicht so gut");
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336/comments/c_1042"));
    assert.strictEqual(aufrufe[0].optionen.method, "PUT");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), { text: "Doch nicht so gut" });
    assert.deepStrictEqual(ergebnis, geaendert);
  });
});

test("aendereKommentar wirft bei einem fremden Kommentar (403) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(403, { message: "You can only edit your own comments." }), async () => {
    await assert.rejects(aendereKommentar(1, "c_7", "x"), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 403);
      return true;
    });
  });
});

test("aendereKommentar wirft bei einem unbekannten Kommentar (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No comment found for this ID." }), async () => {
    await assert.rejects(aendereKommentar(1, "c_999", "x"), (fehler) => fehler.status === 404);
  });
});

test("aendereKommentar meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(aendereKommentar(1, "c_7", "x"), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});

//--> loescheKommentar

test("loescheKommentar schickt DELETE /bff/movies/{ID}/comments/{commentId} ohne Body", async () => {
  const geloescht = { message: "Comment was deleted." };
  await mitToken("abc123", () => antwort(200, geloescht), async (aufrufe) => {
    const ergebnis = await loescheKommentar(157336, "c_1042");
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/157336/comments/c_1042"));
    assert.strictEqual(aufrufe[0].optionen.method, "DELETE");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.strictEqual(aufrufe[0].optionen.body, undefined);
    assert.deepStrictEqual(ergebnis, geloescht);
  });
});

test("loescheKommentar kodiert die Kommentar-ID für die Adresse", async () => {
  await mitToken("abc123", () => antwort(200, {}), async (aufrufe) => {
    await loescheKommentar(1, "c_1/../2");
    assert.ok(aufrufe[0].url.endsWith("/bff/movies/1/comments/c_1%2F..%2F2"));
  });
});

test("loescheKommentar wirft bei einem fremden Kommentar (403) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(403, { message: "You can only delete your own comments." }), async () => {
    await assert.rejects(loescheKommentar(1, "c_7"), (fehler) => fehler instanceof ApiFehler && fehler.status === 403);
  });
});

test("loescheKommentar wirft bei einem unbekannten Kommentar (404) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(404, { message: "No comment found for this ID." }), async () => {
    await assert.rejects(loescheKommentar(1, "c_999"), (fehler) => fehler.status === 404);
  });
});

test("loescheKommentar schickt ohne Token keine Anfrage und meldet die fehlende Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken(null, () => antwort(200, {}), async (aufrufe) => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(loescheKommentar(1, "c_7"), (fehler) => fehler.status === 401);
    assert.strictEqual(aufrufe.length, 0);
    assert.strictEqual(handlerAufrufe, 1);
  });
});