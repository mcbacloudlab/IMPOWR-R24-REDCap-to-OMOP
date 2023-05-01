import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import { useState } from "react";
import Cookies from "js-cookie";

export default function SignUp({ props }) {
  console.log('sign up props', props)
  const [signUpError, setSignUpError] = useState(false);

  const navigate = useNavigate();
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    var formdata = new FormData();
    formdata.append("firstName", data.get("firstName"));
    formdata.append("lastName", data.get("lastName"));
    formdata.append("email", data.get("email"));
    formdata.append("password", data.get("password"));

    var requestOptions = {
      method: "POST",
      body: data,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/users/createUser`,
      requestOptions
    )
    .then((response) => {
      if (response.status === 200) {
        response.text().then((response) => {
          console.log('resp,', response)
          let respJSON = JSON.parse(response)
          console.log(respJSON.jwtToken);
          let token = respJSON.jwtToken;
          let userInfo = JSON.stringify(respJSON.userInfo)
          Cookies.set("token", token, { expires: 7, secure: true });
          Cookies.set("user", userInfo, { expires: 7, secure: true });
          props.setToken(token)
          navigate("/myaccount"); // navigate to another component
          setSignUpError(false);
        });
      } else {
        setSignUpError(true);
      }
    })
    .catch((error) => console.log("error", error));
  };

  return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          {signUpError && (
            <Alert severity="error">Error</Alert>
          )}
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="signin" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
  );
}
