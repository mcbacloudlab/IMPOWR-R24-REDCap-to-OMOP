import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import SignIn from "../components/SignIn";


const theme = createTheme();
export default function SignIn_Page() {
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="90%">
        <CssBaseline />

        <Paper
          sx={{
            minHeight: "90vh",
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 1,
            margin: 'auto',
            m: 2,
          }}
        >
          <Grid container spacing={1} justifyContent="center">
            <Grid item md={12} lg={4}>
            <SignIn/>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
