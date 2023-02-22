import React from "react";
import Grid from "@mui/material/Grid";
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function AdminSection(props) {
  let propsObj = JSON.parse(props.props.user)

  useEffect(()=>{
    //check for existing keys
    
  }, [])
  const handleRedcapAPIKey = (event) => {
    event.preventDefault();
    console.log("handle redcap key");
  };

  if (propsObj.role === "admin") {
    return (
      <>
        <Grid>
          <h1>Admin</h1>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="form"
            onSubmit={handleRedcapAPIKey}
            noValidate
            sx={{
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              name="redcapAPIKey"
              label="REDCap API Key"
              type="password"
              id="redcapAPIKey"
            />

            <Button
              type="submit"
              variant="contained"
              sx={{
                ml: 4,
                padding: "10px 30px 10px 30px",
                maxHeight: "60px",
              }}
            >
              Submit
            </Button>
          </Box>
        </Grid>
      </>
    );
  } else {
    return;
  }
}
