import { fal } from "@fal-ai/client";

// Combine prompts for all generation and 
// individual story component input?

export async function createImage() {
    const url = await fal.storage.upload("../../public/Draw-a-Giraffe.jpeg");
    const result = await fal.subscribe("fal-ai/alpha-image-232/edit-image", {
      input: {
        "prompt": "This giraffe starting to jump, as one frame in a sequence, keep everything hand-drawn.",
        "image_size": "auto",
        "output_format": "png",
        "image_urls": [
          url
        ]
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    console.log(result.data);
    console.log(result.requestId);
}