// useAnthropicFlipbookPrompts.js
import { useState, useRef, useCallback } from "react";
import Anthropic from "@anthropic-ai/sdk";

export default function useAnthropicFlipbookPrompts({
  apiKey,
  model = "claude-3-5-sonnet-20241022", // or your model
} = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortRef = useRef(null);

  const generatePrompts = useCallback(
    async ({
      storyIdea,
      previousImages = [],
      maxFramesPerEvent = 3,
      falHtmlPath = "./mnt/data/Hack FLUX_ Beyond One - API and Prompting Guide.html",
      systemOverride,
    } = {}) => {
      if (!apiKey) throw new Error("Anthropic API key required");

      setLoading(true);
      setError(null);
      setData(null);

      // Anthropic client
      const anthropic = new Anthropic({ apiKey });

      const systemMessage =
        systemOverride ||
        `You are an expert children's storytelling and image-prompt engineer...
[omitted here for brevity — use the full system message I gave earlier]
`;

      const userMessage = `Task: Turn this story idea into a flipbook-ready sequence of frame prompts.

Inputs:
- story_idea: ${JSON.stringify(storyIdea)}
- previous_images: ${JSON.stringify(previousImages)}
- max_frames_per_event: ${maxFramesPerEvent}
- next_in_sequence: true

[remaining content unchanged from earlier version]
`;

      try {
        const response = await anthropic.messages.create({
          model,
          max_tokens: 3000,
          temperature: 0.3,

          // ⬇️ SDK-Standard Messages Array
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],

          // ⬇️ Attachments use the *local file path* as instructed
          attachments: [
            {
              filename: "Hack FLUX_ Beyond One - API and Prompting Guide.html",
              url: falHtmlPath, // DO NOT upload raw content per instructions
              content_type: "text/html",
            },
          ],
        });

        // Anthropic SDK response shape:
        // response.content = [{ type: "text", text: "..." }]
        const textBlock = response.content?.find(
          (c) => c.type === "text"
        );

        if (!textBlock) {
          throw new Error("Anthropic returned no text content");
        }

        let outputText = textBlock.text.trim();

        // Parse JSON from outputText
        let parsed;
        try {
          parsed = JSON.parse(outputText);
        } catch (err) {
          // Try extracting JSON if wrapped in extra text
          const match = outputText.match(/\{[\s\S]*\}$/);
          if (!match) throw new Error("Model output not valid JSON");
          parsed = JSON.parse(match[0]);
        }

        setData(parsed);
        setLoading(false);
        return { data: parsed };
      } catch (err) {
        setError(err);
        setLoading(false);
        return { error: err };
      }
    },
    [apiKey, model]
  );

  return {
    loading,
    error,
    data,
    generatePrompts,
  };
}
