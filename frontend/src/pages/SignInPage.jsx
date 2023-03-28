import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import SignIn from "../components/SignIn";
import Alert from "@mui/material/Alert";

export default function SignIn_Page(props) {
  console.log('sign in props', props)
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
            {/* <Alert severity="error">Server Error. Check the backend server is up and running as well as the Redis server.</Alert> */}
            <SignIn props={props}/>
            </Grid>
          </Grid>
        </Paper>
      </Container>
  );
}
