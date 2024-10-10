// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}",'./node_modules/@shadcn/ui/components/**/*.{js,ts,jsx,tsx}',],
  theme: {
    extend: {
      colors: {
        primary: "#ffba00",
        emi_azul: "#054473",
        emi_amarillo: "#ffba00",
        emi_green: "#c6f6d5",
        secondary: {
          100: "#054473",
          900: "#ffffff",
        },
      },
      backgroundImage: {
        'login-background': "url('https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2Flogoo_emi.jpg?alt=media&token=af571d0b-8e43-4e08-b0f2-f765c1f21b71')",
        'login-background2': "url('https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2Flogoo_emi.jpg?alt=media&token=af571d0b-8e43-4e08-b0f2-f765c1f21b71')"
      },
      backgroundSize: {
        'size-cover': 'cover'
      },
      backgroundRepeat: {
        'no-repeat': 'no-repeat'
      },
      backgroundPosition: {
        'position-center': 'center'
      },
      opacity: {
        '80': '0.90'
      },
      // Nuevas clases
      translate: {
        '-35': '-35%',
        '-50': '-50%',
      },
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
