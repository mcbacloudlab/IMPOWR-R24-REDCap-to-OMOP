import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import SignUp from "../components/SignUp";



export default function SignUp_Page(props) {
console.log('sign up page props', props)
  return (
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
            <SignUp props={props}/>
            </Grid>
          </Grid>
        </Paper>
      </Container>
  );
}
