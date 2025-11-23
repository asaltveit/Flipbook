import { fal } from "@fal-ai/client";

// Combine prompts for all generation and 
// individual story component input?

export async function createImage() {
    /*
        get last 2 images
        pass a flag for in progress/done/error/atarted
        send request
        save to local file or eventually supabase/postgres
        - both may make sense? like a cache?
        some sort of id for most recent images
    */
    const result = await fal.subscribe("fal-ai/alpha-image-232/edit-image", {
        input: {
            prompt: ""
        },
        logs: true,
        onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
        }
        },
    });

}

const result = await fal.subscribe("fal-ai/alpha-image-232/edit-image", {
  input: {
    prompt: ""
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