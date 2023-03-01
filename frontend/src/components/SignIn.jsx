import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Cookies from "js-cookie";


export default function SignIn({ props }) {
  console.log('sign in props', props)
  const [loginError, setLoginError] = useState(false);

  const navigate = useNavigate();
  const jwtToken = Cookies.get("token");

  //check if user has token
  useEffect(() => {
    if (jwtToken) {
      //now we to actually validate it on the server checking the signature
      var myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + jwtToken);

      var formdata = new FormData();

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/users/validateUser`,
        requestOptions
      )
        .then((response) => response.status)
        .then((result) => {
          if (result === 200) {
            props.updateUser("loggedIn");
            navigate("/myaccount");
          } else {
            navigate("/signin");
          }
        })
        .catch((error) => console.log("error", error));
    }
  }, [jwtToken, navigate, props]);

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
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/users/signInUser`,
      requestOptions
    )
      .then((response) => {
        if (response.status === 200) {
        } else {
          navigate("/signin"); // navigate to another component
          setLoginError(true);
        }
        response.text().then((result) => {
          if (result !== "Error") {
            result = JSON.parse(result);
            // set the cookie
            Cookies.set("token", result.jwtToken, { expires: 7, secure: true });
            Cookies.set("user", JSON.stringify(result.userInfo), {
              expires: 7,
              secure: true,
            });
            props.updateUser(data.get("email"));
            props.setToken(result.jwtToken)
            navigate("/myaccount");
          } else {
            navigate("/signin"); // navigate to another component
            setLoginError(true);
          }
        });
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
          <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          {loginError && (
            <Alert severity="error">Incorrect Username/Password</Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="signup" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
  );
}
