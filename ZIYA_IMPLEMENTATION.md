# Ziya — Avatar and mini chat

Ziya is mounted only on the public landing route (`/`) through `src/pages/LandingPage.tsx`.

## Avatar states

- `idle`: `public/ziya-idle.png` — relaxed, floating idle pose.
- `clicked`: `public/ziya-clicked.png` — excited pose used while the panel is open.
- `loading`: `public/ziya-loading.png` — thinking pose while the backend request is pending.
- `typing`: `public/ziya-typing.png` — chat-bubble pose while the user has drafted a question / while responding.
- `blink`: `public/ziya-blink.png` — resting blink pose, available for future idle-cycle scheduling.

CSS in `src/index.css` adds floating, glow, sparkle, thinking, typing, click-pop, and modal/backdrop open-close transitions. `prefers-reduced-motion` disables nonessential motion.

## Chat integration

The widget reuses the existing `chatService.send()` and its `/ai/chat` contract. It does not add a second AI implementation. The guest state directs unauthenticated visitors to `/login` or `/register`, while authenticated users use the existing Deen session and backend authorization.

## Validation before release

Run `npm ci`, `npm run build`, and `npm run lint` in the project directory. Verify login and chat behavior against the configured backend, including 401/403/429/503 errors. This archive does not include `.env` credentials.
