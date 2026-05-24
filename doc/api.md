# API Connection

## `POST /chat`

Streams a chat response for a new or existing conversation. The request selects the model with `model`.
The `model` field is required. The frontend currently sends `gemini` by default until the model selector is implemented.

Available models:

| Model | Provider | Backend model | Notes |
| :--- | :--- | :--- | :--- |
| `gemini` | Gemini | `gemini-3.1-flash-lite` | Only supported model currently. |

Response type:

```http
Content-Type: text/event-stream
```

Request for a new conversation:

```json
{
  "model": "gemini",
  "prompt": "Where is Kyoto located?"
}
```

Request for an existing conversation:

```json
{
  "model": "gemini",
  "conversation_id": 1,
  "prompt": "What is it famous for?"
}
```

SSE events:

Normal chunks are sent as default `message` events:

```text
data: Kyoto

data:  is located

data:  in Japan.

```

When streaming completes, the backend sends a named `done` event:

```text
event: done
data: {"data":{"conversation_id":1}}

```

If an error occurs after the stream has started, the backend sends:

```text
event: error
data: {"error":{"code":"internal_error","message":"Internal server error","request_id":"b5ff4f6d-8d4c-4b96-80f4-4a41c7c1b942"}}

```

Important frontend parsing notes:

- The backend streams plain text chunks as SSE `data:` lines.
- Multiline chunks are split into multiple `data:` lines according to the SSE format.
- The final `done` event data is a JSON envelope: `{ "data": { "conversation_id": 1 } }`.
- The `error` event data is a JSON envelope: `{ "error": { "code": "...", "message": "...", "request_id": "..." } }`.
- `EventSource` cannot send custom `Authorization` headers, so use `fetch` streaming instead of `EventSource`.

Common error responses before streaming starts:

| Status | Meaning |
| :--- | :--- |
| `400` | Invalid or missing JSON fields, missing `model`, or unsupported `model`. |
| `401` | Missing or invalid access token. |
| `413` | Request body is too large. |
| `429` | Rate limit exceeded. |
| `500` | LLM service initialization error, database error, or unsupported streaming writer. |

Errors after streaming starts are sent as SSE `error` events because the HTTP status has already been committed.
