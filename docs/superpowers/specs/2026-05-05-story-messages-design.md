# Story Message Display Refactor — Design Spec

## Background

Currently:
- `renderStoryFromMessages` only renders the **last** AI round's `maintext`
- Player inputs from `sendCustomInput` are appended as raw `story-paragraph` DOM nodes to `story-text-area`, causing accumulation at the bottom
- "回顾前文" and "天道运转" buttons use `position: absolute` and scroll out of view
- There is only a single global "编辑" button that toggles edit mode for the entire story content

## Goals

1. Display all historical rounds in an alternating AI / Player flow
2. Make "回顾前文" and "天道运转" buttons always visible while scrolling
3. Add an edit button to the top-right corner of every AI and Player message

## Out of Scope

- Editing a message does NOT trigger re-generation of subsequent rounds
- No visual mockups needed; follow existing style variables

---

## Data Model Changes

### `storyHistory` Round Shape (extended)

```js
{
  round: number,
  maintext: string,
  options: string[],
  vars: object,
  timestamp: number,
  snapshot: object,
  userInput: string   // NEW — player input that led to this round
}
```

- Round 1: `userInput` = opening prompt (or empty string)
- Round N (N > 1): `userInput` = the assembled player operations text sent to LLM
- Old saves without `userInput`: render fallback text `"【历史操作未记录】"`

### Write Path

In the LLM request flow (`sendToLLM`), after assembling `userInput`, store it into `roundData` before pushing to `storyHistory`:

```js
const roundData = {
  round: currentRound,
  maintext: currentRoundMaintext,
  options: ...,
  vars: ...,
  timestamp: Date.now(),
  snapshot,
  userInput        // NEW
};
```

### Read Path

`renderStoryFromMessages` iterates the full `storyHistory` array and renders each round as an AI message block + (optionally) a Player message block.

---

## Rendering Architecture

### Message Block Structure

Each round produces 1–2 DOM blocks inside `#story-content`:

```html
<!-- AI message -->
<div class="story-message story-message-ai" data-round="1" data-type="ai">
  <button class="msg-edit-btn" data-round="1" data-type="ai" title="编辑">
    <svg>...</svg>
  </button>
  <div class="story-message-content">...formatted maintext...</div>
</div>

<!-- Player message (for round > 1) -->
<div class="story-message story-message-player" data-round="2" data-type="player">
  <button class="msg-edit-btn" data-round="2" data-type="player" title="编辑">
    <svg>...</svg>
  </button>
  <div class="story-message-content">...userInput...</div>
</div>
```

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.story-message` | Base message container, `position: relative`, `margin-bottom: 20px` |
| `.story-message-ai` | AI styling: left border accent, default text color |
| `.story-message-player` | Player styling: `var(--jade-glow)` left border, indented |
| `.story-message-editing` | Edit mode: `contenteditable` container with dashed border |
| `.msg-edit-btn` | Edit button, `position: absolute`, `top: 8px`, `right: 8px` |

### Rendering Order

For `history.length === 0`: show default placeholder (unchanged).

For `history.length > 0`:
1. Render AI block for `history[0]` (opening round)
2. For `i = 1` to `history.length - 1`:
   - Render Player block with `history[i].userInput`
   - Render AI block with `history[i].maintext`
3. Append all blocks to `#story-content`

**Pending state** (player submitted input, waiting for LLM response):
- `sendCustomInput` no longer appends raw DOM nodes to `story-text-area`
- The action logs panel already provides immediate feedback
- When AI responds, `renderStoryFromMessages` renders the complete alternating flow including the newly completed round

---

## Sticky Buttons

Change `story-recap-btn` and `think-view-btn` from `position: absolute` to `position: sticky`:

```css
.story-recap-btn,
.think-view-btn {
  position: sticky;
  top: 12px;
  z-index: 10;
}
```

Place them in a wrapper at the top of `#story-text-area`, before `#story-content`:

```html
<div class="story-sticky-bar">
  <div class="story-recap-btn" onclick="openRecapPanel()">...</div>
  <div class="think-view-btn" onclick="openThinkPanel()">...</div>
</div>
<div id="story-content">...</div>
```

Remove `padding-top: 52px` from `#story-content` (was compensating for absolute buttons).

---

## Edit Functionality

### Edit Button Click

1. Find the parent `.story-message`
2. Find `.story-message-content` inside it
3. Toggle `contenteditable="true"`, add `.story-message-editing` class
4. Focus the content area
5. Change edit button icon to "保存" (checkmark)

### Save Trigger

- Blur event on `.story-message-content`
- Or click the save button again
- Or press `Ctrl+Enter` inside the editable area

### Save Logic

```js
function saveMessageEdit(roundIndex, type, newContent) {
  const round = history[roundIndex];
  if (type === 'ai') {
    round.maintext = newContent;
  } else {
    round.userInput = newContent;
    // Also sync to chat.messages user message
    syncUserInputToChatMessages(roundIndex, newContent);
  }
  // gameStateManager proxy auto-triggers save
}
```

### `syncUserInputToChatMessages`

- Find the `chat.messages` array
- Locate the user message that corresponds to this round (the user message before the N-th assistant message)
- Update its `content` field
- Save chat via `db.chats.put`

---

## Migration & Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| Old save, no `userInput` | Round 1 player block shows `"【开局】"`; rounds > 1 show `"【历史操作未记录】"` |
| New save with `userInput` | Full alternating display |
| Editing old save AI text | Works normally |
| Editing old save player text | Content is `"【历史操作未记录】"`; user can overwrite it |

---

## Files to Modify

1. `index.html` — rendering, CSS, edit handlers, sticky buttons
2. `sillytavern/game-state.js` — extend `StoryRoundSchema` with `userInput` (optional; schema is lenient for extra fields)

Actually, `storyHistory` items are plain objects, not strictly schema-validated. Adding `userInput` at write time is sufficient; `mergeWithDefaults` will preserve the extra field because of the `else out[k] = deepClone(data[k])` branch in object merging.

---

## Testing Checklist

- [ ] New game: opening renders as AI block, no player block
- [ ] After player input + LLM response: AI block + Player block appear in alternating order
- [ ] Scroll down: sticky buttons remain visible
- [ ] Edit AI message: saves to `storyHistory`, persists after refresh
- [ ] Edit Player message: saves to `storyHistory` and `chat.messages`
- [ ] Load old save without `userInput`: displays fallback text, no crash
- [ ] Recap panel: still shows all rounds correctly
- [ ] Rewind: works correctly after editing a message
