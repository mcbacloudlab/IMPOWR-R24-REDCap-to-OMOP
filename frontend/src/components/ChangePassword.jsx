import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Divider from "@mui/material/Divider";

const ChangePasswordButton = ({ token }) => {
  //   console.log("toknen", token);
  const [showFields, setShowFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    validatePasswords();
  }, [newPassword, confirmPassword]);

  const handleClick = () => {
    setShowFields(true);
    resetChangePasswordFields();
  };

  const handleCancel = (event) => {
    event.preventDefault();
    setShowFields(false);
    resetChangePasswordFields();
    setSubmitMessage('')
  };

  const resetChangePasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordVisible(false);
    setNewPasswordVisible(false);
    setConfirmPasswordVisible(false);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic here
    if (newPassword !== confirmPassword || !validatePasswords()) {
      setErrorMessage("New password and confirm password must match!");
      return;
    } else {
      setErrorMessage("");

      var myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      var formdata = new FormData();
      formdata.append("currentPassword", currentPassword);
      formdata.append("newPassword", newPassword);

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/users/changeUserPassword`,
        requestOptions
      )
        .then((response) => {
          if (response.ok) return response.text();
          else throw new Error("Error");
        })
        .then((result) => {
          setShowFields();
          setSubmitMessage("Success");
          resetChangePasswordFields();
          setTimeout(() => {
            setSubmitMessage("");
          }, 5000);
        })
        .catch((error) => {
          console.log("error", error);
          setSubmitMessage("Error");
          //   resetChangePasswordFields()
        });
    }

    // Proceed with changing password
    // ...
  };

  const toggleCurrentPasswordVisibility = () => {
    setCurrentPasswordVisible(!currentPasswordVisible);
  };

  const toggleNewPasswordVisibility = () => {
    setNewPasswordVisible(!newPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const validatePasswords = () => {
    if (newPassword.length >= 8 && confirmPassword.length >= 8) {
      if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirm password must match!");
        return false;
      } else if (!passwordIsValid(newPassword)) {
        setErrorMessage(
          "Password must be at least 8 characters, contain 1 uppercase, 1 lowercase, 1 number, and 1 special character"
        );
        return false;
      } else {
        setErrorMessage("");
        return true;
      }
    } else {
      setErrorMessage("");
      return true;
    }
  };

  return (
    <Box sx={{ float: "left" }}>
      {!showFields ? (
        <>
          <Button variant="contained" color="primary" onClick={handleClick}>
            Change Password
          </Button>
          {submitMessage === 'Success' && (
            <Grid item xs={12} sm={12}>
              <Alert
                severity={submitMessage === "Success" ? "success" : "error"}
              >
                {submitMessage}
              </Alert>
            </Grid>
          )}
        </>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          <Grid item container spacing={1} md={4}>
            <Grid item xs={12} sm={12}>
              <TextField
                type={currentPasswordVisible ? "text" : "password"}
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={{ marginBottom: "1rem", width: "100%" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleCurrentPasswordVisibility}
                        edge="end"
                      >
                        {currentPasswordVisible ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <TextField
                type={newPasswordVisible ? "text" : "password"}
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ marginBottom: "1rem", width: "100%" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleNewPasswordVisibility}
                        edge="end"
                      >
                        {newPasswordVisible ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <TextField
                type={confirmPasswordVisible ? "text" : "password"}
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ marginBottom: "1rem", width: "100%" }}
                error={errorMessage !== ""}
                helperText={errorMessage ? errorMessage : ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {confirmPasswordVisible ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {submitMessage === 'Error' && (
            <Grid item xs={12} sm={12}>
              <Alert
                severity={submitMessage === "Success" ? "success" : "error"}
              >
                {submitMessage}
              </Alert>
            </Grid>
          )}

            <Grid item xs={12} sm={12}>
              <Box display="flex" justifyContent="space-between">
                <Button
                  type="reset"
                  color="error"
                  variant="contained"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  sx={{ float: "right" }}
                >
                  Submit
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ChangePasswordButton;
