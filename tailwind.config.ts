import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // If you have other directories with components/pages, add them here
  ],
  theme: {
    extend: {
      colors: {
        // Theme-agnostic names using CSS variables from globals.css
        'background-start': 'var(--color-background-start)',
        'background-end': 'var(--color-background-end)',
        'foreground': 'var(--color-foreground)',
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'card': {
          DEFAULT: 'var(--card-background)',
          'alt': 'var(--card-background-alt)',
          'darker': 'var(--card-background-darker)',
          'lighter': 'var(--card-background-lighter)',
        },
        'border': 'var(--border-color)',

        // Direct Archer Review palette access
        'archer-dark-teal': 'var(--archer-dark-teal)',
        'archer-darker-teal': 'var(--archer-darker-teal)',
        'archer-medium-teal': 'var(--archer-medium-teal)',
        'archer-bright-teal': 'var(--archer-bright-teal)',
        'archer-light-blue': 'var(--archer-light-blue)',
        'archer-white': 'var(--archer-white)',
        'archer-light-grey': 'var(--archer-light-grey)',
        'archer-dark-text': 'var(--archer-dark-text)',
        'archer-light-text': 'var(--archer-light-text)',
        'card-background-dark': 'var(--card-background-dark)',
        'card-background-darker': 'var(--card-background-darker)',
        'card-background-lighter': 'var(--card-background-lighter)',
        'border-color-light': 'var(--border-color-light)',
        'border-color-dark': 'var(--border-color-dark)',
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
        'button': 'var(--button-shadow)',
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins you might be using or want to use
    require('tailwindcss-scrollbar'),
  ],
}
export default config
