import React from "react";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import FormSelect from "../components/FormSelect";
// import DataDictionaryList from "../components/DataDictionaryList";
import CssBaseline from "@mui/material/CssBaseline";
// import ProjectBottomBar from "../components/ProjectBottomBar";
import CircularProgress from "@mui/material/CircularProgress";
import AddHomeWorkIcon from '@mui/icons-material/AddHomeWork';

export default function ProjectManagementPage(props) {
  const [addSSError, setAddSSError] = useState();
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    //get available forms
    // console.log("use effect formselect ran");
    setIsLoading(true);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/redcap/getForms`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        // console.log(JSON.parse(result));
        setForms(JSON.parse(result));
        // console.log("forms", forms);
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        setAddSSError(true);
        console.log("error", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // setIsLoading(false);
  }, [forms]);

  return (
    <Container component="main" maxWidth="90%">
      <CssBaseline />
      <Paper
        sx={{
          minHeight: "90vh",
          maxWidth: "90vw",
          paddingLeft: 1,
          paddingRight: 1,
          m: 2,
        }}
      >
        <Grid container spacing={1} justifyContent="center">
          <Grid item xs={12}>
            <h1><AddHomeWorkIcon/> Project Management</h1>
            {/* <h2>REDCap Forms</h2> */}
            {addSSError && (
              <Alert severity="error">
                Error Loading REDCap Dictionaries. Check REDCap API settings
                under My Account.
              </Alert>
            )}
            {isLoading ? (
              <CircularProgress />
            ) : (
              <>
                <FormSelect
                  props={props}
                  forms={forms}
                  isLoading={isLoading}
                />
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
