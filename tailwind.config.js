/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./plugins/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {
			colors: {
				desktop: {
					bg: '#0f172a',
					surface: '#1e293b',
					border: '#334155',
					accent: '#6366f1',
					'accent-hover': '#818cf8',
					muted: '#94a3b8',
					subtle: '#475569',
					text: '#f8fafc',
					'text-secondary': '#cbd5e1',
					error: '#ef4444',
					'error-hover': '#f87171',
					success: '#22c55e'
				}
			},
			fontSize: {
				'desktop-xs': ['0.75rem', { lineHeight: '1rem' }],
				'desktop-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
				'desktop-base': ['0.875rem', { lineHeight: '1.375rem' }],
				'desktop-lg': ['1rem', { lineHeight: '1.5rem' }],
				'desktop-xl': ['1.125rem', { lineHeight: '1.75rem' }],
				'desktop-2xl': ['1.25rem', { lineHeight: '1.75rem' }]
			},
			borderRadius: {
				'desktop-sm': '0.375rem',
				'desktop-md': '0.5rem',
				'desktop-lg': '0.75rem',
				'desktop-xl': '1rem'
			}
		}
	},
	plugins: [require('@tailwindcss/forms')]
};
