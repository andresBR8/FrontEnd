/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
        'login-background': "url('/src/assets/logo_desenfocao.JPG')"
      },
      backgroundImage: {
        'login-background2': "url('/src/assets/logoo_emi.jpg')"
      },
      backgroundSize: {
        'size-cover': 'cover'  // Cubre completamente sin repetirse
      },
      backgroundRepeat: {
        'no-repeat': 'no-repeat'  // No se repite la imagen
      },
      backgroundPosition: {
        'position-center': 'center'  // Centra la imagen de fondo
      },
      opacity: {
        '80': '0.90'  // Opacidad al 25%
      }
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
