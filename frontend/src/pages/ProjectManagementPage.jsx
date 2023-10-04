import React from "react";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { useState, useEffect } from "react";
import { Alert, Button, Typography, styled } from "@mui/material";
import FormSelect from "../components/FormSelect";
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import CustomText from "../components/CustomText";

export default function ProjectManagementPage({ props, handleClick }) {
  let token =
    props.props?.props?.token ??
    props.props?.token ??
    props?.token ??
    props.token;

  const [addSSError, setAddSSError] = useState();
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importType, setImportType] = useState("");

  // const [createModalOpen, setCreateModalOpen] = useState(false);

  const StyledButton = styled(Button)(({ theme, isActive }) => ({
    position: "relative",
    "&::after": {
      content: isActive ? '""' : "none",
      position: "absolute",
      bottom: "-8px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "0",
      height: "0",
      borderLeft: "5px solid transparent",
      borderRight: "5px solid transparent",
      borderTop: `8px solid ${theme.palette.primary.main}`,
    },
  }));

  useEffect(() => {
    //get available forms
    setIsLoading(true);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/redcap/getForms`,
      requestOptions
    )
      .then((response) => {
        if (response.ok) return response.text();
        else throw new Error("Error");
      })
      .then((result) => {
        setForms(JSON.parse(result));
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

  function handleImportTypeClick(event) {
    setImportType(event.target.value);
  }

  return (
    <Container component="main" maxWidth="95%">
      <CssBaseline />
      <Paper
        sx={{
          minHeight: "90vh",
          maxWidth: "95vw",
        }}
      >
        <Grid container spacing={1} justifyContent="center">
          <Grid item xs={12}>
            <StyledButton
              value="redcapImport"
              variant={importType === "redcapImport" ? "contained" : "outlined"}
              onClick={(e) => handleImportTypeClick(e)}
              isactive={importType === "redcapImport" ? "true" : "false"}

            >
              REDCap Data Dictionary
            </StyledButton>

            <StyledButton
              value="customImport"
              variant={importType === "customImport" ? "contained" : "outlined"}
              onClick={(e) => handleImportTypeClick(e)}
              isactive={importType === "customImport" ? "true" : "false"}

              sx={{ margin: "20px" }}
            >
              Custom Text
            </StyledButton>

            <br />
            {importType === "customImport" && (
              <CustomText props={props} handleClick={handleClick} />
            )}
            {importType === "redcapImport" && (
              <>
                <h1>
                  {/* <AddHomeWorkIcon />  */}
                  Import REDCap Data Dictionary
                </h1>

                <Grid item xs={6} sx={{ margin: "auto" }}>
                  <Typography>
                    Import a REDCap Data Dictionary and then submit to find the
                    top matched terms using the provided collections to the
                    left. Once the job is submitted you can view the status and
                    results on the{" "}
                    <span
                      style={{
                        textDecoration: "underline",
                        cursor: "pointer",
                        color: "blue",
                      }}
                      onClick={() => handleClick("Jobs Overview")}
                    >
                      Jobs Overview
                    </span>{" "}
                    page.
                  </Typography>
                </Grid>
                {/* <h2>REDCap Forms</h2> */}
                <Grid item xs={12} md={6} sx={{ margin: "auto" }}>
                  {addSSError && (
                    <Alert severity="error">
                      Error Loading REDCap Dictionaries. Check REDCap API
                      settings under My Account.
                    </Alert>
                  )}
                </Grid>
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
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
