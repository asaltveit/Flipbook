import { fal } from "@fal-ai/client";

const FAL_MODEL = "fal-ai/alpha-image-232/edit-image";

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

export function extractImageUrl(data) {
  if (data?.images?.[0]?.url) return data.images[0].url;
  if (data?.image?.url) return data.image.url;
  if (typeof data?.url === "string") return data.url;
  throw new Error("Unexpected Fal response format");
}

export async function createImage({ prompt, referenceImageUrl, onProgress }) {
  const result = await fal.subscribe(FAL_MODEL, {
    input: {
      prompt,
      image_size: "auto",
      output_format: "png",
      image_urls: [referenceImageUrl],
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && onProgress) {
        onProgress(update);
      }
    },
  });

  return extractImageUrl(result.data);
}

export async function createImagesForFrames({
  frames,
  referenceImageUrl,
  onFrameStart,
  onFrameComplete,
}) {
  const generated = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const prompt = frame.prompt || frame;
    if (!prompt) continue;

    onFrameStart?.(i + 1, frames.length, frame);

    const imageUrl = await createImage({
      prompt,
      referenceImageUrl,
      onProgress: (update) => {
        update.logs?.map((log) => log.message).forEach(console.log);
      },
    });

    generated.push({
      imageUrl,
      caption: frame.caption,
      eventId: frame.event_id,
      frameIndex: frame.frame_index ?? i,
    });

    onFrameComplete?.(i + 1, frames.length, generated[generated.length - 1]);
  }

  return generated;
}
