// Unit-Tests für die BFF-Aufrufe aus js/api.js (US-2).
import test from "node:test";
import assert from "node:assert";
import { anfrage, registriereNutzer, ApiFehler } from "../js/api.js";

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