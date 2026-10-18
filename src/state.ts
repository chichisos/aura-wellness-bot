import type { Env, UserState } from "./types";

/** TTL временных состояний — 24 часа. */
const STATE_TTL_SECONDS = 24 * 60 * 60;

const KEY_PREFIX = "user:";

export const EMPTY_STATE: UserState = { step: "idle" };

export async function getState(env: Env, userId: number): Promise<UserState> {
	const raw = await env.BOT_STATE.get(`${KEY_PREFIX}${userId}`);
	if (!raw) return { ...EMPTY_STATE };
	try {
		return { ...EMPTY_STATE, ...(JSON.parse(raw) as UserState) };
	} catch {
		return { ...EMPTY_STATE };
	}
}

export async function saveState(
	env: Env,
	userId: number,
	state: UserState,
): Promise<void> {
	await env.BOT_STATE.put(`${KEY_PREFIX}${userId}`, JSON.stringify(state), {
		expirationTtl: STATE_TTL_SECONDS,
	});
}

export async function clearState(env: Env, userId: number): Promise<void> {
	await env.BOT_STATE.delete(`${KEY_PREFIX}${userId}`);
}
