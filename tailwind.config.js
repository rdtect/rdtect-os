/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				desktop: {
					bg: '#0f172a',
					surface: '#1e293b',
					border: '#334155',
					accent: '#6366f1'
				}
			}
		}
	},
	plugins: [require('@tailwindcss/forms')]
};
