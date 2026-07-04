# Data format

The V0 content database is local JSON. Edit `src/data/content.example.json` by hand, then place real images in `public/captures/`.

## Add a capture

1. Add the image file in `public/captures/`, for example `public/captures/CAP-0006.jpg`.
2. Add a capture entry with a stable `capture_id`, for example `CAP-0006`.
3. Set `image_path` to the public URL of that file, for example `/captures/CAP-0006.jpg`.
4. Use the same `capture_id` in every question that belongs to this screenshot.
5. The app reads the question, finds the matching capture by `capture_id`, then displays the linked `image_path`, context, answers, and correction.
6. Use `context_to_display` only when the screenshot needs extra context. It can stay empty.
7. Keep `hidden_context` for internal notes that should not be shown to the player.
8. Start with `validation_status: "draft"` until the capture has been reviewed.

## Add a question

1. Add a question with a stable id, for example `CAP-0006-Q01`.
2. Link it to the capture with `capture_id`.
3. Choose `answer_format`: `single`, `multiple`, or `ranking`.
4. Add answers with stable ids, display order, feedback, and error tags.
5. For `single`, exactly one answer must have `is_correct: true`.
6. For `multiple`, every correct answer should have `is_correct: true`; the player must select all of them.
7. For `ranking`, every answer must have a unique `ranking_position`.
8. Fill the correction fields so the player learns what to observe and what principle to remember.

## Validation

`src/lib/content.ts` exposes:

- `loadTrainingContent()`
- `getCaptures()`
- `getActiveQuestions()`
- `getQuestionSummaries()`
- `getCaptureById(captureId)`
- `validateTrainingContent(content)`

The validation checks obvious mistakes such as unknown capture references, invalid capture image paths, missing answers, wrong `single` answer count, and duplicate ranking positions.
