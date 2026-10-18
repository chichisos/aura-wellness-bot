import { handleCallback, handleMessage } from "./handlers";
import type { Env, TgUpdate } from "./types";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/") {
			return new Response("AURA bot is running", {
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		if (request.method === "POST" && url.pathname === "/webhook") {
			// Webhook security: Telegram присылает secret_token в заголовке.
			const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
			if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) {
				return new Response("Forbidden", { status: 403 });
			}

			let update: TgUpdate;
			try {
				update = (await request.json()) as TgUpdate;
			} catch {
				return new Response("Bad Request", { status: 400 });
			}

			try {
				if (update.callback_query) {
					await handleCallback(env, update.callback_query);
				} else if (update.message) {
					await handleMessage(env, update.message);
				}
			} catch (err) {
				console.error("update handling failed:", err);
			}

			return new Response("OK");
		}

		return new Response("Not Found", { status: 404 });
	},
};
