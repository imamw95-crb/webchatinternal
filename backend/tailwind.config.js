import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                wa: {
                    teal: '#075E54',
                    green: '#25D366',
                    'green-dark': '#128C7E',
                    'green-light': '#D9FDD3',
                    bg: '#ECE5DD',
                    'bg-dark': '#111B21',
                    header: '#075E54',
                    gray: '#667781',
                    border: '#E9EDEF',
                    input: '#F0F2F5',
                    bubble: '#D9FDD3',
                    'bubble-other': '#FFFFFF',
                },
            },
        },
    },

    plugins: [forms],
};
