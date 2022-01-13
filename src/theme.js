import { red } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#041417",
    },
    primary: {
      main: "#008080ff",
    },
    secondary: {
      main: "#76ffffff",
    },
    error: {
      main: red.A700,
    },
  },
});

export default theme;
