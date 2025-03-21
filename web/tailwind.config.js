/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,tsx}'],
    theme: {
        extend: {
            backgroundColor: {
                primary: '#3F3D3C',
                secondary: '#53504D',
                tertiary: '#2d2b29',
            },
            colors: {
                accent: '#CCC46A',
                primary: '#F5F5F5',
                primarybg: '#3F3D3C',
                secondary: '#858585',
                secondarybg: '#53504D',
                tertiary: '#2d2b29',
                rust: '#AA4735',
                'rust-active': '#852E1E',
                // background: 'var(--theme-bg-color)',
                // text: 'var(--theme-text-color)',
                // hint: 'var(--theme-hint-color)',
                // link: 'var(--theme-link-color)',
                // button: 'var(--theme-button-color)',
                // 'button-text': 'var(--theme-button-text-color)',
                // 'secondary-background': 'var(--theme-secondary-bg-color)',
                // 'header-background': 'var(--theme-header-bg-color)',
                // 'bottom-bar-background': 'var(--theme-bottom-bar-bg-color)',
                // 'accent-text-color': 'var(--theme-accent-text-color)',
                // 'section-background': 'var(--theme-section-bg-color)',
                // 'section-header-text': 'var(--theme-section-header-text-color)',
                // 'section-seperator': 'var(--theme-section-seperator-color)',
                // 'subtitle-text': 'var(--theme-subtitle-text-color)',
                // 'destructive-text': 'var(--theme-destructive-color)',
            },
            animation: {
                'spin-slow': 'spin 9s linear infinite',
                'zoom': 'zoom 1s ease-in-out infinite',
            }
        },
    },
    plugins: [],
};
