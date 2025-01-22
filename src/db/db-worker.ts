// we could use the worker file from ./lib/kysely-official-wasm-worker/worker/index.ts, but somehow that doesn't get bundled correctly
import { createOnMessageCallback } from "~/lib/kysely-official-wasm-worker";

self.onmessage = createOnMessageCallback();
