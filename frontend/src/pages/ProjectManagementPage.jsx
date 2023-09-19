import React from "react";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FormSelect from "../components/FormSelect";
// import DataDictionaryList from "../components/DataDictionaryList";
import CssBaseline from "@mui/material/CssBaseline";
// import ProjectBottomBar from "../components/ProjectBottomBar";
import CircularProgress from "@mui/material/CircularProgress";
import AddHomeWorkIcon from "@mui/icons-material/AddHomeWork";
import AddTaskIcon from "@mui/icons-material/AddTask";
// import ImportExportIcon from "@mui/icons-material/ImportExport";
import MaterialTable from "material-react-table";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Delete, Edit } from "@mui/icons-material";
import CollectionList from "../components/CollectionList";
import TransferList from "../components/TransferList";

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
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  // const [createModalOpen, setCreateModalOpen] = useState(false);

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
    console.log("handle import type click", event.target.value);
    setImportType(event.target.value);
  }

  const handleAddClick = () => {
    if (inputValue) {
      setData((prevData) => [...prevData, { name: inputValue }]);
      setInputValue("");
    }
  };

  const columns = React.useMemo(
    () => [
      {
        header: "Actions",
        Cell: ({ row }) => (
          <IconButton onClick={() => handleDelete(row)}>
            <DeleteIcon />
          </IconButton>
        ),
        minSize: 1, //min size enforced during resizing
        maxSize: 1, //max size enforced during resizing
        size: 1, //medium column
        enableEditing: false,
      },
      {
        header: "Name",
        accessorKey: "name",
      },
    ],
    []
  );

  const handleDelete = (row) => {
    setData((prevData) => prevData.filter((item) => item !== row.original));
  };

  const handleClearTable = () => {
    setData([]);
  };

  function submitToProcess() {}

  const handleDeleteRow = useCallback(
    (row) => {
      // eslint-disable-next-line no-restricted-globals
      if (!confirm(`Are you sure you want to delete ${row.firstName}`)) {
        return;
      }
      //send api delete request here, then refetch or update local table data for re-render
      data.splice(row.index, 1);
      setData([...data]);
    },
    [data]
  );

  return (
    <Container component="main" maxWidth="95%">
      <CssBaseline />
      <Paper
        sx={{
          minHeight: "90vh",
          maxWidth: "95vw",
          // paddingLeft: 1,
          // paddingRight: 1,
          // m: 2,
        }}
      >
        <Grid container spacing={1} justifyContent="center">
          <Grid item xs={12}>
            <Button
              value="redcapImport"
              variant="outlined"
              onClick={(e) => handleImportTypeClick(e)}
            >
              REDCap Data Dictionary
            </Button>
            <Button
              value="customImport"
              variant="outlined"
              onClick={(e) => handleImportTypeClick(e)}
              sx={{ margin: "20px" }}
            >
              Custom Text
            </Button>
            <br />
            {importType === "customImport" && (
              <>
                <Typography>
                  Add your own non-standardized text below to the table to
                  submit to find the most related standard terms. Once the job
                  is submitted you can view the status and results on the{" "}
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
                <br />
                <Divider />
                <br />
                <TextField
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  label="Custom Text"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddClick();
                      e.preventDefault(); // Prevents default form submission
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddClick}>
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {data && (
                  <>
                    <Button
                      onClick={handleClearTable}
                      variant="contained"
                      color="error"
                      sx={{ margin: "10px", marginLeft: '60px'}}
                    >
                      Clear Table
                    </Button>
                    <Grid container spacing={2}>
                      <Grid item xs={12} xl={4}>
                        <CollectionList
                          token={token}
                          setCheckedItems={setCheckedItems}
                          checkedItems={checkedItems}
                        />
                        <TransferList
                          props={props}
                          setData={setData}
                          data={data}
                          setColDefs={setColDefs}
                          colDefs={colDefs}
                        />
                      </Grid>

                      <Grid item xs={12} xl={8}>
                        <MaterialTable
                          title="Names List"
                          data={data}
                          columns={columns}
                          enableColumnResizing
                          enableEditing
                          editingMode="table"
                          enableColumnOrdering
                          renderRowActions={({ row, table }) => (
                            <Box sx={{ display: "flex", gap: "1rem" }}>
                              <Tooltip arrow placement="left" title="Edit">
                                <IconButton
                                  onClick={() => table.setEditingRow(row)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip arrow placement="right" title="Delete">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteRow(row)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Tooltip
                    title={
                      "This will submit your text to a job and return the most similar standard terms."
                    }
                  >
                    <Button
                      // sx={{ float: "right" }}
                      variant="contained"
                      color="primary"
                      component="label"
                      startIcon={<AddTaskIcon />}
                      onClick={(e) => submitToProcess(e)}
                    >
                      Submit Job To Queue
                    </Button>
                  </Tooltip>
                </Grid>
              </>
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
