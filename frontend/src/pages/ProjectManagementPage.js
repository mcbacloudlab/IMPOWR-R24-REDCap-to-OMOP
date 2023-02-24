import React from "react";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import FormSelect from "../components/FormSelect";
import DataDictionaryList from "../components/DataDictionaryList";

export default function ProjectManagementPage(props) {
  console.log("props,", props);
  const [addSSError, setAddSSError] = useState();
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    //get available forms
    console.log("use effect formselect ran");
    setIsLoading(true);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/redcap/getForms`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(JSON.parse(result));
        setForms(JSON.parse(result));
        console.log("forms", forms);
        setIsLoading(false)
      })
      .catch((error) => {
        setIsLoading(false);
        setAddSSError(true)
        console.log("error", error);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [forms]);

  return (
    <Container component="main" maxWidth="90%">
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
          <Grid item xs={12}>
            <h1>Project Management</h1>
            {addSSError && (
              <Alert severity="error">Error Adding Data Dictionary</Alert>
            )}
            {!isLoading && (
              <FormSelect props={props} forms={forms} isLoading={isLoading} />
            )}
            <DataDictionaryList props={props}/>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
