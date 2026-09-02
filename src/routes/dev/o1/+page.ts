import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * The O1 component preview harness (/dev/o1) is a development tool for
 * eyeballing the design library — it is intentionally not part of the
 * product UI. Outside of `vite dev` (import.meta.env.DEV === false) the
 * route redirects to the desktop so the gallery never ships.
 */
export const load: PageLoad = () => {
  if (!import.meta.env.DEV) {
    redirect(307, '/');
  }
};
