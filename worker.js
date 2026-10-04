const FOOD_LIST = `Wasser; Kräutertee; Knoblauch; Brokkoli; Spinat; Topfen/Quark/Yogurt; Blumenkohl; Tomate; Zitrone; Lachs; Grüne Bohne; Soja; Forelle; Tintenfisch; Hirse; Gurke; Kaffee; Grapefruit; Sonnenblumenöl; Pfirsich; Spargel; Truthahn; Thunfisch; Karotte; Zwiebel; Hering; Banane; Dorsch; Pflaume; Honigmelone; Erbse; Schwarzer Tee; Mandarine; Kuhmilchkäse; Paprika; Huhn; Erdbeere; Gerste; Marille/Aprikose; Hafer; Birne; Lammfleisch; Ei; Linse; Olivenöl; Kirsche; Weisse Bohne; Weisskraut; Apfel; Shrimp; Buchweizen; Ananas; Reis; Weintraube; Ente; Mais; Kuhmilch; Kartoffel; Orange; Roggen; Weisswein; Kakao; Rotwein; Hefe; Rindfleisch; Butter; Weizen; Schlagobers/Sahne; Bier; Schweinefleisch; Zucker; Cola/Energy Drink`;

const schema = {
  type: "object",
  properties: {
    dish_name: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          grams: { type: "number" },
          kcal: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          confidence: { type: "number" }
        },
        required: ["name", "grams", "kcal", "protein_g", "carbs_g", "fat_g", "confidence"],
        additionalProperties: false
      }
    },
    notes: { type: "string" }
  },
  required: ["dish_name", "ingredients", "notes"],
  additionalProperties: false
};

function corsHeaders(origin, allowedOrigin) {
  const allow = allowedOrigin || "*";
  const effective = allow === "*" ? "*" : (origin === allow ? origin : allow);
  return {
    "Access-Control-Allow-Origin": effective,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || !["/", "/analyze"].includes(url.pathname)) {
      return json({ error: "Not found" }, 404, cors);
    }

    if (env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN !== "*" && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed" }, 403, cors);
    }

    if (env.APP_TOKEN && request.headers.get("X-App-Token") !== env.APP_TOKEN) {
      return json({ error: "Ungültiges App-Token" }, 401, cors);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "OPENAI_API_KEY fehlt im Worker" }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Ungültige JSON-Anfrage" }, 400, cors);
    }

    const image = body?.image;
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return json({ error: "Kein gültiges Bild übermittelt" }, 400, cors);
    }
    if (image.length > 10_000_000) {
      return json({ error: "Bild ist zu gross" }, 413, cors);
    }

    const prompt = `Analysiere dieses Foto einer Mahlzeit für ein persönliches Ernährungstagebuch.

WICHTIG: Gemischte und verarbeitete Gerichte müssen in einzelne Zutaten zerlegt werden. Gib NICHT nur den Namen des Gerichts als Zutat zurück.

Vorgehen:
1. Bestimme zuerst das Hauptgericht bzw. die einzelnen Komponenten auf dem Teller.
2. Bei zusammengesetzten Speisen (z. B. Ratatouille, Curry, Eintopf, Auflauf, Suppe, Sauce, Salat, Pasta-Gericht, Sandwich, Pizza) rekonstruiere die wahrscheinlichen Einzelzutaten anhand von Bildmerkmalen UND typischer Rezeptzusammensetzung.
3. Zerlege auch Saucen, Dressings und Mischgemüse soweit sinnvoll. Beispiel Ratatouille: Zucchetti/Zucchini, Tomate, Paprika/Peperoni, Zwiebel, Knoblauch und typischerweise etwas Olivenöl.
4. Zutaten, die nur aus Rezeptwissen abgeleitet und im Bild nicht klar sichtbar sind, dürfen aufgenommen werden, wenn sie für das erkannte Gericht sehr typisch sind. Setze dann eine niedrigere confidence.
5. Schätze für jede einzelne Zutat die verzehrte Menge in Gramm. Bei Getränken entspricht 1 ml ungefähr 1 g.
6. Schätze für genau diese Menge kcal, Protein, Kohlenhydrate und Fett.
7. Gib pro Zutat confidence von 0 bis 1 an.

Benennung: Verwende wenn sinnvoll exakt einen Namen aus dieser persönlichen Lebensmittelliste: ${FOOD_LIST}. Wenn eine Zutat dort nicht vorkommt, verwende einen kurzen üblichen deutschen Namen.

Qualitätsregeln:
- Keine Sammelbegriffe wie "Gemüse", "Sauce", "Ratatouille" oder "Curry" als einzige Zutat, wenn eine Aufschlüsselung möglich ist.
- Lieber 4–8 plausible Einzelzutaten als 1 Sammelbegriff.
- Keine exotischen oder untypischen Zutaten erfinden.
- Öl, Butter, Rahm oder Zucker nur aufnehmen, wenn für das erkannte Gericht plausibel; bei Unsicherheit confidence reduzieren.
- dish_name kurz auf Deutsch.
- notes nur für relevante Unsicherheiten; sonst leere Zeichenkette.`

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-6.1-sol",
        max_output_tokens: 2200,
        reasoning: { effort: "medium" },
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image, detail: "high" }
          ]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "meal_image_analysis",
            strict: true,
            schema
          }
        }
      })
    });

    const apiText = await apiResponse.text();
    let apiData;
    try { apiData = JSON.parse(apiText); } catch { apiData = null; }

    if (!apiResponse.ok) {
      const msg = apiData?.error?.message || `OpenAI API Fehler ${apiResponse.status}`;
      return json({ error: msg }, 502, cors);
    }

    try {
      const message = (apiData.output || []).find(x => x.type === "message");
      const part = (message?.content || []).find(x => x.type === "output_text");
      if (!part?.text) throw new Error("Keine strukturierte Antwort erhalten");
      const result = JSON.parse(part.text);
      return json(result, 200, cors);
    } catch (e) {
      return json({ error: "KI-Antwort konnte nicht verarbeitet werden", detail: String(e?.message || e) }, 502, cors);
    }
  }
};
