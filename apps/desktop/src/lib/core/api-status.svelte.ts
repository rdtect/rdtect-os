import { PUBLIC_PYTHON_API_URL, PUBLIC_POCKETBASE_URL } from '$env/static/public';

class APIStatus {
	pythonApiAvailable = $state(false);
	pocketbaseAvailable = $state(false);
	checked = $state(false);

	async check(): Promise<void> {
		try {
			const r = await fetch(`${PUBLIC_PYTHON_API_URL}/health`, {
				signal: AbortSignal.timeout(3000)
			});
			this.pythonApiAvailable = r.ok;
		} catch {
			this.pythonApiAvailable = false;
		}

		try {
			const r = await fetch(`${PUBLIC_POCKETBASE_URL}/api/health`, {
				signal: AbortSignal.timeout(3000)
			});
			this.pocketbaseAvailable = r.ok;
		} catch {
			this.pocketbaseAvailable = false;
		}

		this.checked = true;
	}
}

export const apiStatus = new APIStatus();
