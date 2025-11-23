//import Anthropic from '@anthropic-ai/sdk';

//const anthropic = new Anthropic();

// useAnthropicFlipbookPrompts.js
import { useState, useRef, useCallback } from "react";

/**
 * useAnthropicFlipbookPrompts
 *
 * @param {Object} opts
 * @param {string} [opts.endpoint] - Anthropic responses endpoint (default: https://api.anthropic.com/v1/responses)
 * @param {string} [opts.model] - Anthropic model name (optional)
 */
export default function useAnthropicFlipbookPrompts({ endpoint, model } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // parsed JSON according to schema
  const abortRef = useRef(null);

  const defaultEndpoint = endpoint || "https://api.anthropic.com/v1/responses";
  const defaultModel = model || "claude-haiku-4-5"; // replace with your desired Anthropic model
  const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_KEY;

  /**
   * generatePrompts
   * @param {Object} params
   * @param {string} params.storyIdea - user's short story idea text
   * @param {Array<{id:string,url:string,short_description?:string}>} params.previousImages
   * @param {number} [params.maxFramesPerEvent] - default 3
   * @param {string} [params.falHtmlPath] - local path to FLUX rules HTML (we will pass this as attachment url). Example: /mnt/data/Hack FLUX_ Beyond One - API and Prompting Guide.html
   * @param {string} [params.systemOverride] - optional override of the system message
   * @param {Object} [opts.fetchOptions] - extra fetch options if needed
   */
  const generatePrompts = useCallback(
    async ({
      storyIdea,
      previousImages = [],
      maxFramesPerEvent = 3,
      falHtmlPath = "/mnt/data/Hack FLUX_ Beyond One - API and Prompting Guide.html",
      systemOverride,
      fetchOptions = {},
    } = {}) => {
      if (!anthropicApiKey) {
        throw new Error("Anthropic API key is required");
      }
      setLoading(true);
      setError(null);
      setData(null);

      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Use the improved system and user messages (systemOverride allows custom)
      const systemMessage = systemOverride || `You are an expert children's storytelling and image-prompt engineer. Your job is to turn a short story idea into a structured, consistent sequence of image-generation prompts suitable for producing a flipbook.

Important constraints:
- The output must be valid JSON (no extra prose).
- The top-level JSON schema required:
  {
    "story": "Full short story text (1-3 paragraphs)",
    "events": [
      { "id": "E1", "title": "short title", "summary": "one-sentence summary" , "frame_count": n }
    ],
    "frames": [
      { "event_id": "E1", "frame_index": 0, "caption": "one-line caption", "prompt": "image prompt string", "negative_prompt": "", "style": "hand-drawn", "references": ["prev_img_1", ...] }
    ],
    "prompts": ["prompt1", "prompt2", ...]
  }

- Each frame entry should be carefully written so a separate image generator can produce that frame.
- The style must be explicitly "hand-drawn" and mention substyle.
- References: the attached HTML file at the provided URL must be consulted for fal rules and safety.
- Preserve character identity across frames.

Return JSON only. If you cannot follow the rules, return an error object with {"error": "explanation"} in JSON.
`;

      // Compose user message using the provided story idea and previous images
      const userMessage = `Task: Turn this story idea into a flipbook-ready sequence of frame prompts.

Inputs:
- story_idea: ${JSON.stringify(storyIdea)}
- previous_images: ${JSON.stringify(previousImages)}
- max_frames_per_event: ${maxFramesPerEvent}
- next_in_sequence: true

Requirements:
1. Produce a short full story (1–3 paragraphs).
2. Break the story into main events and assign an id to each event (E1, E2, ...).
3. For each event, create up to max_frames_per_event frames that animate the event.
4. For each frame include: caption, prompt, negative_prompt, style, references.
5. Follow fal rules in the attached HTML. Use style "hand-drawn".
6. Output only JSON following the schema described in the system message.
`;

      // Build request body according to Anthropic Responses API format.
      // We include attachments array with the local file path as an url (per your instruction)
      const body = {
        model: defaultModel,
        // messages-style array
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        // attachments: include a single file attachment pointing to the local path
        attachments: [
          {
            filename: "Hack FLUX_ Beyond One - API and Prompting Guide.html",
            url: falHtmlPath, // developer instruction: use the uploaded file path as the url
            content_type: "text/html"
          }
        ],
        // prefer JSON/text output in the top-level response text
        // adjust any Anthropic-specific params here as needed (temperature, max tokens, etc)
        temperature: 0.3,
        max_tokens: 3000
      };

      try {
        const resp = await fetch(defaultEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anthropicApiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          ...fetchOptions,
        });

        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          const err = new Error(`Anthropic API error ${resp.status}: ${txt}`);
          setError(err);
          setLoading(false);
          return { error: err };
        }

        // The Anthropic responses API returns content differently per version.
        // We'll attempt to parse a textual JSON blob from the response.
        const json = await resp.json();

        // Try to find the assistant text output in a few common places
        let assistantText = null;
        if (json.output && typeof json.output === "string") {
          assistantText = json.output;
        } else if (json.completion && typeof json.completion === "string") {
          assistantText = json.completion;
        } else if (json.result && json.result.output_text) {
          assistantText = json.result.output_text;
        } else if (json.choices && Array.isArray(json.choices) && json.choices[0]) {
          // Anthropic older style might put text in choices[0].text
          assistantText = json.choices[0].text || json.choices[0].message?.content || null;
        } else if (json.output?.[0]?.content?.[0]?.text) {
          assistantText = json.output[0].content[0].text;
        }

        if (!assistantText) {
          // fallback: stringified response (for debugging)
          const fallback = JSON.stringify(json);
          setError(new Error("Could not locate assistant text in Anthropic response"));
          setLoading(false);
          return { error: "no_assistant_text", raw: fallback };
        }

        // The assistantText should be JSON. Try to parse it.
        let parsed;
        try {
          parsed = JSON.parse(assistantText);
        } catch (parseErr) {
          // If there is extra content before/after JSON, attempt to extract a JSON substring
          const match = assistantText.match(/\{[\s\S]*\}$/);
          if (match) {
            try {
              parsed = JSON.parse(match[0]);
            } catch (e2) {
              setError(new Error("Assistant returned text but it wasn't valid JSON"));
              setLoading(false);
              return { error: "invalid_json", raw: assistantText };
            }
          } else {
            setError(new Error("Assistant returned text but no JSON found"));
            setLoading(false);
            return { error: "no_json", raw: assistantText };
          }
        }

        // minimal validation of parsed schema
        if (!parsed || typeof parsed !== "object") {
          setError(new Error("Parsed assistant output is not an object"));
          setLoading(false);
          return { error: "bad_parsed_output", parsed };
        }

        setData(parsed);
        setLoading(false);
        return { data: parsed };
      } catch (err) {
        if (err.name === "AbortError") {
          setError(new Error("Request aborted"));
          setLoading(false);
          return { error: "aborted" };
        }
        setError(err);
        setLoading(false);
        return { error: err };
      } finally {
        abortRef.current = null;
      }
    },
    [anthropicApiKey, defaultModel, defaultEndpoint]
  );

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return {
    loading,
    error,
    data,
    generatePrompts,
    abort,
  };
}
