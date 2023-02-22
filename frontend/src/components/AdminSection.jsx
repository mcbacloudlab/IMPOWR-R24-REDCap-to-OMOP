import React from "react";
import Grid from "@mui/material/Grid";
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function AdminSection(props) {
  const [redcapKey, setRedcapKey] = useState();
  const [prevRedcapKey, setPrevRedcapKey] = useState();
  const [error, setError] = useState();

  let propsUserObj = JSON.parse(props.props.user);
  let propsToken = props.props.token;

  useEffect(() => {
    //check for existing keys
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/keys/queryAllKeys`,
      requestOptions
    )
      .then((response) => {
        return response.text();
      })
      .then((result) => {
        console.log("result", result);
        let resultObj = JSON.parse(result);
        console.log(resultObj);
        const redcapResult = resultObj.find((api) => api.name === "redcap");

        if (redcapResult) {
          const apikey = redcapResult.apikey;
          console.log(apikey);
          setRedcapKey('****************' + apikey);
        }
      })
      .catch((error) => console.log("error", error));
  }, []);
  const handleRedcapAPIKeySubmit = (event) => {
    event.preventDefault();
    console.log("handle redcap key");
    console.log("event", event.target.redcapAPIKey.value);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();
    formdata.append("name", "redcap");
    formdata.append("apiKey", event.target.redcapAPIKey.value);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/keys/updateRedcapKey`,
      requestOptions
    )
      .then((response) => {
        console.log('respons', response.status)
        if(response.status === 200){
          setRedcapKey('****************' + event.target.redcapAPIKey.value.slice(-4));
        }else{
          setError(true)
        }
      })
      .catch((error) => console.log("error", error));
  };

  const handleRedcapEdit = (event) => {
    event.preventDefault();
    console.log("handle redcap key edit");
    setRedcapKey(null);
  };

  if (propsUserObj.role === "admin") {
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
            onSubmit={handleRedcapAPIKeySubmit}
            noValidate
            sx={{
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
            }}
          >
            {!redcapKey ? (
              <>
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
              </>
            ) : (
              <>
                <Typography>Redcap Key: {redcapKey}</Typography>
                <Button
                  type="submit"
                  variant="contained"
                  onClick={(event) => handleRedcapEdit(event)}
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Edit
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </>
    );
  } else {
    return;
  }
}
