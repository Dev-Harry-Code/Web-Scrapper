import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function scrapeUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return "";
    }

    const html = await response.text();

    /* ---------------- Clean HTML ---------------- */

    const $ = cheerio.load(html);

    $(
      "script, style, noscript, svg, img, iframe, canvas, video, footer, nav, aside, form, button, header"
    ).remove();

    const cleanedHtml = $.html();

    /* ---------------- Readability ---------------- */

    const dom = new JSDOM(cleanedHtml, {
      url,
    });

    const reader = new Readability(dom.window.document);

    const article = reader.parse();

    if (!article || !article.textContent) {
      return "";
    }

    /* ---------------- Normalize ---------------- */

    let text = article.textContent ?? "";

    text = text
      .replace(/\r/g, "")
      .replace(/\n+/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (text.length < 100) {
      return "";
    }

    /* ---------------- Token Safety ---------------- */

    return text.slice(0, 20000);
  } catch (err) {
    console.error(`Scraping failed for ${url}:`, err);
    return "";
  }
}

interface SourceRank {
  title: string;
  url: string;
  score: number;
}

async function rankSources(
  query: string,
  results: { title: string; link: string; snippet: string }[]
) {
  
  const prompt = `
You are Scrappy SourceRank AI.

Your ONLY job is to rank Google search results.

You DO NOT answer the user's question.

------------------------------------------------

User Query

"${query}"

------------------------------------------------

Google Search Results

${JSON.stringify(results, null, 2)}

------------------------------------------------

Evaluate every result using the following criteria:

1. Relevance to the user's question
2. Website authority
3. Technical depth
4. Accuracy
5. Trustworthiness
6. Freshness
7. Originality

Prefer:

• Official documentation
• Government websites
• Universities
• Research papers
• Company documentation
• GitHub repositories
• High-quality technical blogs

Avoid:

• SEO spam
• Clickbait
• AI-generated spam
• Thin content
• Marketing pages
• Duplicate websites
• Content farms

Scoring:

100 = perfect source

90+ = excellent

80+ = very good

70+ = acceptable

Below 70 = poor

------------------------------------------------

Return ONLY valid JSON.

Format:

[
  {
    "title": "...",
    "url": "...",
    "score": 97
  }
]

Do not include explanations.

Do not include markdown.

Only output JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
  responseMimeType: "application/json",
  temperature: 0.1,
  responseSchema: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
        },
        url: {
          type: Type.STRING,
        },
        score: {
          type: Type.NUMBER,
        },
      },
      required: ["title", "url", "score"],
    },
  },
},
  });

  const ranked: SourceRank[] = JSON.parse(response.text!);

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function chunkText(
  text: string,
  size = 5000
) {
  const chunks: string[] = [];

  for (
    let i = 0;
    i < text.length;
    i += size
  ) {
    chunks.push(
      text.slice(i, i + size)
    );
  }

  return chunks;
}

function deduplicate(text: string) {
  const seen = new Set<string>();

  return text
    .split("\n")
    .filter((line) => {
      const t = line.trim();

      if (t.length < 40) return false;

      if (seen.has(t)) return false;

      seen.add(t);

      return true;
    })
    .join("\n");
}



export async function POST(req: Request) {
  try {
    const {
    query,
    urls,
    auto,
    searchResults
} = await req.json();

    if (
  (!urls || urls.length === 0) &&
  (!searchResults || searchResults.length === 0)
) {
  return NextResponse.json(
    { error: "No search results or URLs provided" },
    { status: 400 }
  );
}
let urlsToScrape: string[] = urls ?? [];

if (auto && searchResults?.length) {
  console.log("Automatic Mode: Ranking sources...");

  const rankedSources = await rankSources(query, searchResults);

  urlsToScrape = rankedSources.map(source => source.url);

  console.log("Selected Sources:", urlsToScrape);
}

    // Process scraping concurrently
    const scrapePromises = urlsToScrape.map(async (url: string) => {
      const content = await scrapeUrl(url);
      const chunks = chunkText(content);

return chunks
  .map(
    (chunk, index) => `
Source URL: ${url}

Chunk ${index + 1}

${chunk}

------------------------
`
  )
  .join("\n");
    });
    
    const scrapedContexts = (
  await Promise.all(scrapePromises)
).filter((text) => text.length > 1000);
    const combinedContext =
deduplicate(
  scrapedContexts.join("\n")
);

    // AI Engine Prompt
    const prompt = `
You are Scrappy AI.

You are an expert researcher, technical writer, and analyst.

Your task is to generate a professional research report using ONLY the supplied research material.

Never use outside knowledge.

Never invent facts.

If something is missing from the supplied sources, state that it is unavailable.

------------------------------------------------

USER QUERY

"${query}"

------------------------------------------------

RESEARCH MATERIAL

${combinedContext}

------------------------------------------------

Rules

• Use ONLY the supplied context.

• Ignore advertisements.

• Ignore navigation.

• Ignore cookie banners.

• Ignore duplicate information.

• Merge overlapping information.

• Prefer authoritative sources.

• If multiple sources disagree, explain both viewpoints.

• Never hallucinate.

• Every section must include citations.

• References must correspond to supplied URLs only.

------------------------------------------------

Writing Style

Write like a senior researcher.

Use professional language.

Be objective.

Explain concepts clearly.

Avoid repetition.

Use markdown formatting inside content.

Allowed markdown:

# Heading

## Subheading

- Bullet List

1. Numbered List

**Bold**

Markdown tables when useful.

------------------------------------------------

Generate the following report:

1. Research Title

Create a concise professional title.

------------------------------------------------

2. Executive Summary

Write 2–3 detailed paragraphs summarizing the findings.

------------------------------------------------

3. Research Findings

Generate between 3 and 8 sections.

Each section must contain:

• id
• title
• content
• citations

Content should include:

- explanation
- bullets
- tables if appropriate

------------------------------------------------

4. Conclusion

Summarize the report.

Mention important takeaways.

Mention limitations if applicable.

------------------------------------------------

5. References

List every source used.

------------------------------------------------

Return ONLY valid JSON matching the provided response schema.

Do not output markdown outside JSON.

Do not explain your reasoning.

Only output JSON.
`;

    // Define strict JSON Schema for Gemini
    const responseSchema = {
  type: Type.OBJECT,

  properties: {

    title: {
      type: Type.STRING,
    },

    summary: {
      type: Type.STRING,
    },

    sections: {

      type: Type.ARRAY,

      items: {

        type: Type.OBJECT,

        properties: {

          id: {
            type: Type.STRING,
          },

          title: {
            type: Type.STRING,
          },

          content: {
            type: Type.STRING,
          },

          citations: {

            type: Type.ARRAY,

            items: {

              type: Type.OBJECT,

              properties: {

                label: {
                  type: Type.STRING,
                },

                url: {
                  type: Type.STRING,
                }

              },

              required: [
                "label",
                "url"
              ]

            }

          }

        },

        required: [
          "id",
          "title",
          "content",
          "citations"
        ]

      }

    },

    conclusion: {
      type: Type.STRING,
    },

    references: {

      type: Type.ARRAY,

      items: {

        type: Type.OBJECT,

        properties: {

          id: {
            type: Type.NUMBER,
          },

          title: {
            type: Type.STRING,
          },

          url: {
            type: Type.STRING,
          }

        },

        required: [
          "id",
          "title",
          "url"
        ]

      }

    }

  },

  required: [
    "title",
    "summary",
    "sections",
    "conclusion",
    "references"
  ]

};

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for factual RAG tasks
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("AI returned empty response");

    return NextResponse.json({
    report: JSON.parse(outputText),
    usedSources: urlsToScrape,
});
  } catch (error) {
    console.error('Process API Error:', error);
    return NextResponse.json({ error: 'Failed to process AI extraction' }, { status: 500 });
  }
}