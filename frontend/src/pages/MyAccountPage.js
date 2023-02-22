import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
// import Box from "@mui/material/Box";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
import AdminSection from "../components/AdminSection";

const theme = createTheme();
export default function MyAccountPage(props) {
  // console.log("props", props);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  useEffect(() => {
    try {
      let userCookie = JSON.parse(Cookies.get("user"));
      setUsername(userCookie.email);
      setName(userCookie.firstName + " " + userCookie.lastName);
      let userInfo = JSON.parse(props.user);
      // console.log("prfewefwefops.", userInfo);
      setRole(userInfo.role);
    } catch (error) {
      console.log("error", error);
    }
  }, [props.user]);

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
            <Grid item md={12} lg={4}></Grid>
            <Grid item xs={12}>
              <Typography>Name: {name}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>Email: {username}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>Role: {role}</Typography>
            </Grid>
            <Grid item xs={12}>
              {role === "admin" ? <AdminSection props={props} /> : ""}
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
