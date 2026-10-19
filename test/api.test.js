// KI-Log B5: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die BFF-Aufrufe aus js/api.js (US-2).
import test from "node:test";
import assert from "node:assert";
import { anfrage, registriereNutzer, meldeAn, meldeAb, ApiFehler } from "../js/api.js";
import { speichereToken } from "../js/auth.js";

// Ersetzt fetch für einen Test durch eine eigene Funktion und merkt sich den Aufruf.
// Nach dem Test wird das echte fetch wiederhergestellt.
async function mitFetch(ersatz, pruefung) {
  const original = globalThis.fetch;
  const aufrufe = [];
  globalThis.fetch = async (url, optionen) => {
    aufrufe.push({ url, optionen });
    return ersatz(url, optionen);
  };
  try {
    await pruefung(aufrufe);
  } finally {
    globalThis.fetch = original;
  }
}

// Baut eine Antwort, wie fetch sie liefert (ok, status und json()).
function antwort(status, inhalt) {
  return { ok: status >= 200 && status < 300, status, json: async () => inhalt };
}

//--> anfrage: Erfolg

test("anfrage liefert bei Erfolg den Inhalt der Antwort", async () => {
  await mitFetch(
    () => antwort(200, { nachricht: "ok" }),
    async () => {
      assert.deepStrictEqual(await anfrage("/status"), { nachricht: "ok" });
    }
  );
});

test("anfrage ruft die Adresse mit dem Präfix /bff und der Methode GET auf", async () => {
  await mitFetch(
    () => antwort(200, {}),
    async (aufrufe) => {
      await anfrage("/status");
      assert.ok(aufrufe[0].url.endsWith("/bff/status"));
      assert.strictEqual(aufrufe[0].optionen.method, "GET");
      assert.strictEqual(aufrufe[0].optionen.body, undefined);
    }
  );
});

test("anfrage schickt die Daten als JSON im Body mit", async () => {
  await mitFetch(
    () => antwort(201, {}),
    async (aufrufe) => {
      await anfrage("/users", { methode: "POST", daten: { email: "max@example.com" } });
      assert.strictEqual(aufrufe[0].optionen.method, "POST");
      assert.strictEqual(aufrufe[0].optionen.body, '{"email":"max@example.com"}');
      assert.strictEqual(aufrufe[0].optionen.headers["Content-Type"], "application/json");
    }
  );
});

test("anfrage schickt ohne Anmeldung keinen Authorization-Header mit", async () => {
  await mitFetch(
    () => antwort(200, {}),
    async (aufrufe) => {
      await anfrage("/status");
      assert.strictEqual(aufrufe[0].optionen.headers.Authorization, undefined);
    }
  );
});

//--> anfrage: Fehler 

test("anfrage wirft bei Fehlerstatus einen ApiFehler mit Status und Meldung", async () => {
  await mitFetch(
    () => antwort(409, { message: "An account with this email already exists." }),
    async () => {
      await assert.rejects(anfrage("/users", { methode: "POST", daten: {} }), (fehler) => {
        assert.ok(fehler instanceof ApiFehler);
        assert.strictEqual(fehler.status, 409);
        assert.strictEqual(fehler.message, "An account with this email already exists.");
        return true;
      });
    }
  );
});

test("anfrage wirft bei Antwort ohne JSON trotzdem einen ApiFehler", async () => {
  await mitFetch(
    () => ({ ok: false, status: 502, json: async () => { throw new Error("kein JSON"); } }),
    async () => {
      await assert.rejects(anfrage("/status"), (fehler) => fehler.status === 502);
    }
  );
});

test("anfrage wirft bei Netzwerkfehler einen ApiFehler mit Status 0", async () => {
  await mitFetch(
    () => { throw new TypeError("fetch failed"); },
    async () => {
      await assert.rejects(anfrage("/status"), (fehler) => {
        assert.ok(fehler instanceof ApiFehler);
        assert.strictEqual(fehler.status, 0);
        return true;
      });
    }
  );
});

//--> registriereNutzer

test("registriereNutzer sendet POST an /bff/users", async () => {
  await mitFetch(
    () => antwort(201, { message: "Account has been created.", userId: "u_1" }),
    async (aufrufe) => {
      const daten = { firstName: "Max", lastName: "Mustermann", email: "max@example.com", password: "geheim123" };
      const ergebnis = await registriereNutzer(daten);
      assert.ok(aufrufe[0].url.endsWith("/bff/users"));
      assert.strictEqual(aufrufe[0].optionen.method, "POST");
      assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), daten);
      assert.strictEqual(ergebnis.userId, "u_1");
    }
  );
});


//--> meldeAn 

test("meldeAn sendet POST an /bff/auth und liefert das Token", async () => {
  await mitFetch(
    () => antwort(200, { token: "abc123" }),
    async (aufrufe) => {
      const daten = { email: "max@example.com", password: "geheim123" };
      const ergebnis = await meldeAn(daten);
      assert.ok(aufrufe[0].url.endsWith("/bff/auth"));
      assert.strictEqual(aufrufe[0].optionen.method, "POST");
      assert.deepStrictEqual(JSON.parse(aufrufe[0].optionen.body), daten);
      assert.strictEqual(ergebnis.token, "abc123");
    }
  );
});

test("meldeAn wirft bei falschen Zugangsdaten einen ApiFehler mit Status 401", async () => {
  await mitFetch(
    () => antwort(401, { message: "Email or password is incorrect." }),
    async () => {
      await assert.rejects(meldeAn({ email: "x@example.com", password: "falsch" }), (fehler) => {
        assert.ok(fehler instanceof ApiFehler);
        assert.strictEqual(fehler.status, 401);
        return true;
      });
    }
  );
});

//--> meldeAb 

test("meldeAb sendet DELETE an /bff/auth mit dem Token im Header", async () => {
  // Ersatz für localStorage, damit holeToken() in Node ein Token findet
  const speicher = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => speicher.set(k, String(v)),
      removeItem: (k) => speicher.delete(k),
    },
  });
  try {
    speichereToken("abc123");
    await mitFetch(
      () => antwort(200, { message: "Logout successful." }),
      async (aufrufe) => {
        await meldeAb();
        assert.ok(aufrufe[0].url.endsWith("/bff/auth"));
        assert.strictEqual(aufrufe[0].optionen.method, "DELETE");
        assert.strictEqual(aufrufe[0].optionen.headers.Authorization, "Bearer abc123");
      }
    );
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});