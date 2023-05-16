import * as React from "react";
// import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
// import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import { useState } from "react";
import Cookies from "js-cookie";
import OrcidLogo from "../assets/orcid.logo.svg";
import { Divider } from "@mui/material";
import Logo from "../assets/logo.png";

export default function SignUp({ props }) {
  const [signUpError, setSignUpError] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const navigate = useNavigate();
  const handleSubmit = (event) => {
    event.preventDefault();
    if(passwordError) return;
    
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
            setSignUpError(false);
            let respJSON = JSON.parse(response);
            let token = respJSON.jwtToken;
            let userInfo = JSON.stringify(respJSON.userInfo);
            Cookies.set("token", token, { expires: 7, secure: true });
            Cookies.set("user", userInfo, { expires: 7, secure: true });
            props.setToken(token);
            setTimeout(() => {
              navigate("/myaccount");
            }, 1000);
          });
        } else {
          setSignUpError(true);
        }
      })
      .catch((error) => console.log("error", error));
  };

  // Function to initiate the ORCID login process
  const loginWithORCID = () => {
    // Redirect the user to the /login endpoint on the backend
    window.location.href = `${process.env.REACT_APP_BACKEND_API_URL}/api/orcid/orcidLogin`;
  };

   // Password validation
   const passwordIsValid = (password) => {
    const numberRegex = /\d/;
    const specialCharRegex = /[!@#$%^&*]/;
    const lowerCaseRegex = /[a-z]/;
    const upperCaseRegex = /[A-Z]/;

    if (
      password.length < 8 ||
      !numberRegex.test(password) ||
      !specialCharRegex.test(password) ||
      !lowerCaseRegex.test(password) ||
      !upperCaseRegex.test(password)
    ) {
      return false;
    }
    return true;
  };

  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    setPassword(newPassword);
    setPasswordError(!passwordIsValid(newPassword));
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
        <img src={Logo} alt="logo" width="48" height="48" />
        {/* <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar> */}
        <Typography component="h1" variant="h5">
          CDE to OMOP
        </Typography>
        {signUpError && <Alert severity="error">Error</Alert>}
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                value={password}
                onChange={handlePasswordChange}
                error={passwordError}
                helperText={
                  passwordError
                    ? "Password must be at least 8 characters, contain 1 uppercase, 1 lowercase, 1 number and 1 special character"
                    : ""
                }
              />
            </Grid>
            <Grid item xs={12}></Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={loginWithORCID}
            startIcon={
              <img src={OrcidLogo} alt="ORCID logo" width="24" height="24" />
            }
            sx={{
              mt: 2,
              backgroundColor: "rgb(68, 116, 5)",
              color: "white",
              "&:hover": {
                backgroundColor: "rgb(85, 145, 10)", // Specify the desired hover background color here
                // If you don't want a boxShadow on hover, you can set it to 'none'
                boxShadow: "none",
              },
            }}
          >
            Login with ORCID
          </Button>
          <Divider sx={{ mb: 2, mt: 2 }} />
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
