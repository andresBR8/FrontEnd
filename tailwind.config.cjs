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
        'login-background': "url('https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2Fead9f229-bf68-46a1-bc0d-c585ef2995e4-logoo_emi.jpg?alt=media&token=c303d685-f255-4cd6-9e90-2a8b9b353e03')",
        'login-background2': "url('https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2Fead9f229-bf68-46a1-bc0d-c585ef2995e4-logoo_emi.jpg?alt=media&token=c303d685-f255-4cd6-9e90-2a8b9b353e03')"
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
