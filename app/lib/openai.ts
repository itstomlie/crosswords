/**
 * Client-side OpenAI helper.
 * Calls the OpenAI API directly from the browser using a user-provided API key.
 * This keeps the app compatible with static export (no server needed).
 */

const MODEL = "chatgpt-5.4";

interface GeneratedClue {
  answer: string;
  clue: string;
}

/**
 * Generate crossword clues for a given topic/theme.
 */
export async function generateCluesForTopic(
  apiKey: string,
  topic: string,
  count: number = 8
): Promise<GeneratedClue[]> {
  const prompt = `Generate exactly ${count} crossword puzzle entries for the topic: "${topic}".

Rules:
- Each answer must be a single word (no spaces, no hyphens)
- Answers should be between 3 and 12 letters
- All answers must be real English words
- Clues should be concise (under 60 characters) and suitable for education
- Vary the difficulty — mix easy and medium difficulty
- Do not repeat words

Respond with ONLY a JSON array, no markdown, no explanation:
[{"answer": "WORD", "clue": "A brief clue description"}, ...]`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a crossword puzzle designer. You generate word-and-clue pairs for educational crossword puzzles. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) throw new Error("Invalid API key");
    if (res.status === 429) throw new Error("Rate limited — try again in a moment");
    throw new Error(`OpenAI error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from OpenAI");

  try {
    const parsed = JSON.parse(content) as GeneratedClue[];
    // Normalise
    return parsed
      .filter((e) => e.answer && e.clue)
      .map((e) => ({
        answer: e.answer.toUpperCase().replace(/[^A-Z]/g, ""),
        clue: e.clue,
      }))
      .filter((e) => e.answer.length >= 3 && e.answer.length <= 12);
  } catch {
    throw new Error("Failed to parse AI response. Try again.");
  }
}

/**
 * Generate clues for a list of existing answers.
 */
export async function generateCluesForAnswers(
  apiKey: string,
  answers: string[]
): Promise<Map<string, string>> {
  const filtered = answers.filter((a) => a.trim().length >= 2);
  if (filtered.length === 0) return new Map();

  const prompt = `Generate crossword clues for each of these words:
${filtered.map((a) => `- ${a}`).join("\n")}

Rules:
- Each clue should be concise (under 60 characters)
- Clues should be suitable for educational use
- Do not include the answer word in the clue

Respond with ONLY a JSON array, no markdown:
[{"answer": "WORD", "clue": "clue text"}, ...]`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a crossword puzzle designer. Generate concise, educational clues. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) throw new Error("Invalid API key");
    throw new Error(`OpenAI error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from OpenAI");

  try {
    const parsed = JSON.parse(content) as GeneratedClue[];
    const map = new Map<string, string>();
    for (const e of parsed) {
      if (e.answer && e.clue) {
        map.set(e.answer.toUpperCase().replace(/[^A-Z]/g, ""), e.clue);
      }
    }
    return map;
  } catch {
    throw new Error("Failed to parse AI response. Try again.");
  }
}
