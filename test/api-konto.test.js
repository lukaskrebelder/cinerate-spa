//--> Tests mithilfe von CLAUDE Sonnet 5.5 (zeitliche Gründe)
// Unit-Tests für das Löschen des Kontos aus js/api.js (PB-04).
import test from "node:test";
import assert from "node:assert";
import { loescheKonto, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
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

test("loescheKonto sendet DELETE an /bff/users/{userId} mit dem Token im Header", async () => {
  await mitToken("abc123", () => antwort(200, { message: "Account has been deleted." }), async (aufrufe) => {
    const ergebnis = await loescheKonto("u_67");
    assert.ok(aufrufe[0].url.endsWith("/bff/users/u_67"));
    assert.strictEqual(aufrufe[0].optionen.method, "DELETE");
    assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
    assert.strictEqual(ergebnis.message, "Account has been deleted.");
  });
});

test("loescheKonto kodiert Sonderzeichen in der ID", async () => {
  await mitToken("abc123", () => antwort(200, {}), async (aufrufe) => {
    await loescheKonto("u_6/7");
    assert.ok(aufrufe[0].url.endsWith("/bff/users/u_6%2F7"));
  });
});

test("loescheKonto wirft bei einem fremden Konto (403) einen ApiFehler", async () => {
  await mitToken("abc123", () => antwort(403, { message: "Forbidden." }), async () => {
    await assert.rejects(loescheKonto("u_1"), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 403);
      return true;
    });
  });
});

test("loescheKonto meldet bei 401 die abgelaufene Sitzung", async () => {
  let handlerAufrufe = 0;
  await mitToken("abgelaufen", () => antwort(401, { message: "Invalid token." }), async () => {
    setzeSitzungsHandler(() => {
      handlerAufrufe += 1;
    });
    await assert.rejects(loescheKonto("u_67"), (fehler) => fehler.status === 401);
    assert.strictEqual(handlerAufrufe, 1);
  });
});