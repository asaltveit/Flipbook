import { http, HttpResponse } from 'msw'

const STORY_RESPONSE = {
  story: 'A bunny finds a carrot.',
  events: [{ id: 'E1', title: 'Discovery', summary: 'Bunny finds carrot', frame_count: 1 }],
  frames: [
    {
      event_id: 'E1',
      frame_index: 0,
      caption: 'Bunny discovers a carrot',
      prompt: 'A hand-drawn bunny finding a carrot in a garden',
      style: 'hand-drawn',
    },
  ],
  prompts: ['A hand-drawn bunny finding a carrot in a garden'],
}

export const handlers = [
  http.post('https://api.anthropic.com/v1/responses', () =>
    HttpResponse.json({ output: JSON.stringify(STORY_RESPONSE) })
  ),
]
