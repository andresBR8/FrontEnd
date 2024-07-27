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
        'login-background': "url('https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2FLOGOEMI.jpg?alt=media&token=8aecd739-397a-4b90-8954-04971521b1ad')",
        'login-background2': "url('https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2FLOGOEMI.jpg?alt=media&token=8aecd739-397a-4b90-8954-04971521b1ad')"
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
      }
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
