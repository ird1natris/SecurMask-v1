/** @type {import('tailwindcss').Config} */
export const content = ["./index.html", "./src/**/*.{js,jsx}"];
export const theme = {
  extend: {
    colors: {
      primary: "#1F1E23",
      secondary: "#00f6ff",
      third: "#EEEDED",
      login: '#131135',
      side: "#312F37",
      hover: "#872DFB",
      dimWhite: "rgba(255, 255, 255, 0.7)",
      dimBlue: "rgba(9, 151, 124, 0.1)",
    },
    fontFamily: {
      poppins: ["Poppins", "sans-serif"],
    },
  },
  screens: {
    xs: "480px",
    ss: "620px",
    sm: "768px",
    md: "1060px",
    lg: "1200px",
    xl: "1700px",
  },
};
export const plugins = [];
