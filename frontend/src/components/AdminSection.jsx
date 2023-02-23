import React from "react";
import Grid from "@mui/material/Grid";
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CheckIcon from "@mui/icons-material/Check";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

export default function AdminSection(props) {
  const [redcapKey, setRedcapKey] = useState("");
  const [redcapURL, setRedcapURL] = useState("");
  const [prevRedcapURL, setPrevRedcapURL] = useState("");
  const [umlsKey, setUMLSKey] = useState("");
  const [editModeRedcapKey, setEditModeRedcapKey] = useState(false);
  const [editModeRedcapURL, setEditModeRedcapURL] = useState(false);
  const [editModeUMLS, setEditModeUMLS] = useState();
  const [error, setError] = useState(false);
  const [redcapAPITest, setRedcapAPITest] = useState(false);
  const [umlsAPITest, setUMLSAPITest] = useState(false);

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
        const redcapKeyResult = resultObj.find(
          (api) => api.name === "redcapAPIKey"
        );
        const redcapURLResult = resultObj.find(
          (api) => api.name === "redcapAPIURL"
        );
        const umlsResult = resultObj.find((api) => api.name === "umlsAPIKey");
        if (redcapKeyResult) {
          setRedcapKey("****************");
          console.log("redcapresult", redcapKeyResult);
        }
        if (redcapURLResult) {
          console.log("url result", redcapURLResult);
          setRedcapURL(redcapURLResult.endpoints);
        }
        if (umlsResult) {
          setUMLSKey("****************");
        }
      })
      .catch((error) => console.log("error", error));
  }, [propsToken]);

  const handleAPIKeySubmit = (event, formName) => {
    event.preventDefault();
    console.log("form", formName);

    console.log("event", event.target[formName].value);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();
    formdata.append("name", formName);
    if (formName === "redcapAPIKey")
      formdata.append("apiKey", event.target[formName].value);
    if (formName === "umlsAPIKey")
      formdata.append("apiKey", event.target[formName].value);
    if (formName === "redcapAPIURL")
      formdata.append("endpoints", event.target.redcapAPIURL.value);

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
        console.log("respons", response.status);
        if (response.status === 200) {
          if (formName === "redcapAPIKey") {
            setRedcapKey("****************");
            setEditModeRedcapKey(false);
          }
          if (formName === "redcapAPIURL") {
            // setRedcapKey("****************");
            setEditModeRedcapURL(false);
          }
          if (formName === "umlsAPIKey") {
            setUMLSKey("****************");
            setEditModeUMLS(false);
          }
        } else {
          setError(true);
        }
      })
      .catch((error) => console.log("error", error));
  };

  const handleEdit = (event) => {
    event.preventDefault();
    console.log("handle key edit");
    console.log("event.!!", event.target.value);
    switch (event.target.value) {
      case "redcapAPIKey": {
        console.log("what");
        setRedcapKey("");
        setEditModeRedcapKey(true);
        break;
      }
      case "redcapAPIURL": {
        console.log("what");
        setPrevRedcapURL(redcapURL);
        // setRedcapURL("");
        setEditModeRedcapURL(true);
        break;
      }
      case "umlsAPIKey": {
        setUMLSKey("");
        setEditModeUMLS(true);
        break;
      }
      default: {
        break;
      }
    }
  };

  const handleCancel = (event) => {
    event.preventDefault();
    console.log("handle cancel", event.target.value);
    setRedcapKey("****************");
    switch (event.target.value) {
      case "redcapAPIKey": {
        setRedcapKey("****************");
        setEditModeRedcapKey(false);
        break;
      }
      case "redcapAPIURL": {
        setRedcapURL(prevRedcapURL);
        setEditModeRedcapURL(false);
        break;
      }
      case "umlsAPIKey": {
        setUMLSKey("****************");
        setEditModeUMLS(false);
        break;
      }
      default: {
        break;
      }
    }
  };

  const testRedcapAPI = (event) => {
    // event.preventDefault();
    console.log("test redcap api");
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/keys/testRedcapAPI`,
      requestOptions
    )
      .then((response) => {
        console.log("response stat", response.status);
        if (response.status !== 200) {
          throw new Error();
        }
        return response.text();
      })
      .then((result) => {
        console.log(result);
        setRedcapAPITest("REDCap API Connected!");
      })
      .catch((error) => {
        console.log("error", error);
        setRedcapAPITest("Error");
      });
  };

  const testUMLSAPI = (event) => {
    // event.preventDefault();
    console.log("test umls api");
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/keys/testUMLSAPI`,
      requestOptions
    )
      .then((response) => {
        console.log("response stat", response.status);
        if (response.status !== 200) {
          throw new Error();
        }
        return response.text();
      })
      .then((result) => {
        console.log(result);
        setUMLSAPITest("UMLS API Connected!");
      })
      .catch((error) => {
        console.log("error", error);
        setUMLSAPITest("Error");
      });
  };

  if (propsUserObj.role === "admin") {
    return (
      <>
        <Grid>
          <h1>Admin</h1>
        </Grid>
        <Grid container spacing={0}>
          {/* REDCAP KEY */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              // alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Box
              component="form"
              onSubmit={(event) => handleAPIKeySubmit(event, "redcapAPIKey")}
              value="redcapAPIKey"
              // noValidate
              sx={{
                // alignItems: "center",
                justifyContent: "center",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              <TextField
                InputLabelProps={{ shrink: true }}
                disabled={!editModeRedcapKey}
                onChange={(event) => setRedcapKey(event.target.value)}
                value={redcapKey}
                margin="normal"
                required
                minLength="10"
                fullWidth
                name="redcapAPIKey"
                label="REDCap API Key"
                type="password"
                id="redcapAPIKey"
              />
              {!editModeRedcapKey ? (
                <Button
                  variant="contained"
                  onClick={(event) => handleEdit(event)}
                  value="redcapAPIKey"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  value="umlsAPIKey"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Submit
                </Button>
              )}

              <Button
                // type="submit"
                disabled={!editModeRedcapKey}
                onClick={(event) => handleCancel(event)}
                variant="contained"
                value="redcapAPIKey"
                sx={{
                  ml: 4,
                  padding: "10px 30px 10px 30px",
                  maxHeight: "60px",
                }}
              >
                Cancel
              </Button>
            </Box>

            {/* REDCAP URL */}
            <Box
              component="form"
              onSubmit={(event) => handleAPIKeySubmit(event, "redcapAPIURL")}
              value="redcapAPIURL"
              // noValidate
              sx={{
                // alignItems: "center",
                justifyContent: "center",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              <TextField
                InputLabelProps={{ shrink: true }}
                disabled={!editModeRedcapURL}
                value={redcapURL}
                onChange={(event) => setRedcapURL(event.target.value)}
                margin="normal"
                required
                fullWidth
                name="redcapAPIURL"
                label="REDCap API URL"
                type="text"
                id="redcapAPIURL"
              />
              {!editModeRedcapURL ? (
                <Button
                  variant="contained"
                  onClick={(event) => handleEdit(event)}
                  value="redcapAPIURL"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  value="umlsAPIKey"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Submit
                </Button>
              )}

              <Button
                // type="submit"
                disabled={!editModeRedcapURL}
                onClick={(event) => handleCancel(event)}
                variant="contained"
                value="redcapAPIURL"
                sx={{
                  ml: 4,
                  padding: "10px 30px 10px 30px",
                  maxHeight: "60px",
                }}
              >
                Cancel
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Button
                onClick={(event) => testRedcapAPI(event)}
                variant="outlined"
                value="umlsAPIKey"
                sx={{
                  ml: 4,
                  padding: "10px 30px 10px 30px",
                  maxHeight: "60px",
                  marginTop: "20px",
                }}
              >
                Test REDCap API
              </Button>
              <Box sx={{ display: "block", marginTop: "10px" }}>
                <Typography>{redcapAPITest}</Typography>
              </Box>
            </Box>
          </Grid>

          {/* UMLS KEY */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              justifyContent: "center",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <Box
              component="form"
              onSubmit={(event) => handleAPIKeySubmit(event, "umlsAPIKey")}
              value="umlsAPIKey"
              // noValidate
              sx={{
                // alignItems: "center",
                justifyContent: "center",
                // display: "flex",
                flexWrap: "wrap",
              }}
            >
              <TextField
                InputLabelProps={{ shrink: true }}
                disabled={!editModeUMLS}
                onChange={(event) => setUMLSKey(event.target.value)}
                value={umlsKey}
                margin="normal"
                required
                fullWidth
                name="umlsAPIKey"
                label="UMLS API Key"
                type="text"
                id="umlsAPIKey"
              />
              {!editModeUMLS ? (
                <Button
                  variant="contained"
                  onClick={(event) => handleEdit(event)}
                  value="umlsAPIKey"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  value="umlsAPIKey"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                  }}
                >
                  Submit
                </Button>
              )}

              <Button
                // type="submit"
                disabled={!editModeUMLS}
                onClick={(event) => handleCancel(event)}
                variant="contained"
                value="umlsAPIKey"
                sx={{
                  ml: 4,
                  padding: "10px 30px 10px 30px",
                  maxHeight: "60px",
                }}
              >
                Cancel
              </Button>
            </Box>
            <Grid item xs={12}>
              <Box sx={{ display: "block", marginTop: "10px" }}>
                <Button
                  // type="submit"
                  // disabled={!editModeUMLS}

                  onClick={(event) => testUMLSAPI(event)}
                  variant="outlined"
                  value="umlsAPIKey"
                  sx={{
                    ml: 4,
                    padding: "10px 30px 10px 30px",
                    maxHeight: "60px",
                    backgroundColor: "theme.primary.main",
                  }}
                >
                  Test UMLS API
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "block", marginTop: "10px" }}>
                <Typography>{umlsAPITest}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </>
    );
  } else {
    return;
  }
}
