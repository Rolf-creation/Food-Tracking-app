const FOOD_LIST = `Wasser; Kräutertee; Knoblauch; Brokkoli; Spinat; Topfen/Quark/Yogurt; Blumenkohl; Tomate; Zitrone; Lachs; Grüne Bohne; Soja; Forelle; Tintenfisch; Hirse; Gurke; Kaffee; Grapefruit; Sonnenblumenöl; Pfirsich; Spargel; Truthahn; Thunfisch; Karotte; Zwiebel; Hering; Banane; Dorsch; Pflaume; Honigmelone; Erbse; Schwarzer Tee; Mandarine; Kuhmilchkäse; Paprika; Huhn; Erdbeere; Gerste; Marille/Aprikose; Hafer; Birne; Lammfleisch; Ei; Linse; Olivenöl; Kirsche; Weisse Bohne; Weisskraut; Apfel; Shrimp; Buchweizen; Ananas; Reis; Weintraube; Ente; Mais; Kuhmilch; Kartoffel; Orange; Roggen; Weisswein; Kakao; Rotwein; Hefe; Rindfleisch; Butter; Weizen; Schlagobers/Sahne; Bier; Schweinefleisch; Zucker; Cola/Energy Drink`;

const schema = {
  type: "object",
  properties: {
    dish_name: { type: "string", description: "Kurzer deutscher Name des erkannten Gerichts." },
    ingredients: {
      type: "array",
      description: "Einzelne Zutaten bzw. klar getrennte Lebensmittel auf dem Bild.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          grams: { type: "number", minimum: 0 },
          kcal: { type: "number", minimum: 0 },
          protein_g: { type: "number", minimum: 0 },
          carbs_g: { type: "number", minimum: 0 },
          fat_g: { type: "number", minimum: 0 },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        },
        required: ["name", "grams", "kcal", "protein_g", "carbs_g", "fat_g", "confidence"]
      }
    },
    notes: { type: "string" }
  },
  required: ["dish_name", "ingredients", "notes"]
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

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
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

    if (!env.GEMINI_API_KEY) {
      return json({ error: "GEMINI_API_KEY fehlt im Worker" }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Ungültige JSON-Anfrage" }, 400, cors);
    }

    const image = body?.image;
    const dishHint = typeof body?.dish_hint === "string" ? body.dish_hint.trim().slice(0, 160) : "";
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return json({ error: "Kein gültiges Bild übermittelt" }, 400, cors);
    }
    if (image.length > 10_000_000) {
      return json({ error: "Bild ist zu gross" }, 413, cors);
    }

    const parsedImage = parseDataUrl(image);
    if (!parsedImage) {
      return json({ error: "Bildformat konnte nicht verarbeitet werden" }, 400, cors);
    }

    const prompt = `Analysiere dieses Foto einer Mahlzeit für ein persönliches Ernährungstagebuch.

${dishHint ? `Nutzerhinweis zum Gericht: "${dishHint}". Verwende diesen Hinweis, wenn er zum Bild passt. Zerlege dieses Gericht besonders sorgfältig in plausible Einzelzutaten.` : ""}

WICHTIG: Gemischte und verarbeitete Gerichte müssen in einzelne Zutaten zerlegt werden. Gib NICHT nur den Namen des Gerichts als Zutat zurück.

Vorgehen:
1. Bestimme zuerst das Hauptgericht bzw. die einzelnen Komponenten auf dem Teller.
2. Bei zusammengesetzten Speisen (z. B. Ratatouille, Curry, Eintopf, Auflauf, Suppe, Sauce, Salat, Pasta-Gericht, Sandwich, Pizza) rekonstruiere die wahrscheinlichen Einzelzutaten anhand von sichtbaren Bildmerkmalen UND typischer Rezeptzusammensetzung.
3. Zerlege auch Saucen, Dressings und Mischgemüse soweit sinnvoll. Beispiel Ratatouille: Zucchetti/Zucchini, Tomate, Paprika/Peperoni, Zwiebel, Knoblauch und typischerweise etwas Olivenöl.
4. Zutaten, die nur aus Rezeptwissen abgeleitet und im Bild nicht klar sichtbar sind, dürfen aufgenommen werden, wenn sie für das erkannte Gericht sehr typisch sind. Setze dann eine niedrigere confidence.
5. Schätze für jede einzelne Zutat die verzehrte Menge in Gramm. Bei Getränken entspricht 1 ml ungefähr 1 g.
6. Schätze für genau diese Menge kcal, Protein, Kohlenhydrate und Fett.
7. Gib pro Zutat confidence von 0 bis 1 an.

Benennung: Verwende wenn sinnvoll exakt einen Namen aus dieser persönlichen Lebensmittelliste: ${FOOD_LIST}. Wenn eine Zutat dort nicht vorkommt, verwende einen kurzen üblichen deutschen Namen.

Qualitätsregeln:
- Keine Sammelbegriffe wie \"Gemüse\", \"Sauce\", \"Ratatouille\" oder \"Curry\" als einzige Zutat, wenn eine Aufschlüsselung möglich ist.
- Lieber 4–8 plausible Einzelzutaten als 1 Sammelbegriff.
- Keine exotischen oder untypischen Zutaten erfinden.
- Öl, Butter, Rahm oder Zucker nur aufnehmen, wenn für das erkannte Gericht plausibel; bei Unsicherheit confidence reduzieren.
- dish_name kurz auf Deutsch.
- notes nur für relevante Unsicherheiten; sonst leere Zeichenkette.`;

    const model = env.GEMINI_MODEL || "gemini-3-flash-preview";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-goog-api-key": env.GEMINI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: parsedImage.mimeType,
                data: parsedImage.data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    });

    const apiText = await apiResponse.text();
    let apiData;
    try { apiData = JSON.parse(apiText); } catch { apiData = null; }

    if (!apiResponse.ok) {
      const msg = apiData?.error?.message || `Gemini API Fehler ${apiResponse.status}`;
      return json({ error: msg }, 502, cors);
    }

    try {
      const candidate = apiData?.candidates?.[0];
      if (!candidate) {
        throw new Error("Keine Gemini-Antwort erhalten");
      }

      const finishReason = candidate?.finishReason || "";
      const parts = candidate?.content?.parts || [];
      const rawText = parts
        .filter(p => typeof p?.text === "string" && p.text.trim())
        .map(p => p.text.trim())
        .join("\n")
        .trim();

      if (!rawText) {
        throw new Error(`Leere Gemini-Antwort (finishReason: ${finishReason || "unbekannt"})`);
      }

      // Normalerweise liefert responseMimeType bereits sauberes JSON.
      // Diese Fallbacks machen den Worker robust gegen Markdown-Fences oder Begleittext.
      let cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let result;
      try {
        result = JSON.parse(cleaned);
      } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start < 0 || end <= start) {
          throw new Error(`Ungültiges JSON (finishReason: ${finishReason || "unbekannt"})`);
        }
        result = JSON.parse(cleaned.slice(start, end + 1));
      }

      if (!result || typeof result !== "object") throw new Error("Antwort ist kein JSON-Objekt");
      if (!Array.isArray(result.ingredients)) throw new Error("Zutatenliste fehlt");

      result.dish_name = String(result.dish_name || "Mahlzeit");
      result.notes = String(result.notes || "");
      result.ingredients = result.ingredients
        .filter(x => x && typeof x === "object" && String(x.name || "").trim())
        .map(x => ({
          name: String(x.name || "").trim(),
          grams: Math.max(0, Number(x.grams) || 0),
          kcal: Math.max(0, Number(x.kcal) || 0),
          protein_g: Math.max(0, Number(x.protein_g) || 0),
          carbs_g: Math.max(0, Number(x.carbs_g) || 0),
          fat_g: Math.max(0, Number(x.fat_g) || 0),
          confidence: Math.min(1, Math.max(0, Number(x.confidence) || 0))
        }));

      if (!result.ingredients.length) throw new Error("Keine verwertbaren Zutaten erkannt");
      return json(result, 200, cors);
    } catch (e) {
      const finishReason = apiData?.candidates?.[0]?.finishReason || "unbekannt";
      const usage = apiData?.usageMetadata || {};
      return json({
        error: "KI-Antwort konnte nicht verarbeitet werden",
        detail: String(e?.message || e),
        finishReason,
        usage: {
          promptTokenCount: usage.promptTokenCount || 0,
          candidatesTokenCount: usage.candidatesTokenCount || 0,
          thoughtsTokenCount: usage.thoughtsTokenCount || 0,
          totalTokenCount: usage.totalTokenCount || 0
        }
      }, 502, cors);
    }
  }
};
