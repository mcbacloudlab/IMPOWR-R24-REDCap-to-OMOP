import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
// import Cookies from "js-cookie";
// import { useState, useEffect } from "react";
// import { Typography } from "@mui/material";
// import Box from "@mui/material/Box";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";

const theme = createTheme();
export default function ProjectManagementPage(props) {
  // const handleSubmit = (event) => {
  //   event.preventDefault();
  // };

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
            margin: "auto",
            m: 2,
          }}
        >
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12}>
              <h1>Project Management</h1>
            </Grid>
            <Grid item xs={12}></Grid>
            <Grid item xs={12}></Grid>
          </Grid>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
