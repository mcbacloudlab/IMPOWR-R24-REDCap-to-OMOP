import React, { useState, useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import MaterialReactTable from "material-react-table";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
// import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
// import Alert from "@mui/material/Alert";
// import AlertTitle from "@mui/material/AlertTitle";
// import FormGroup from "@mui/material/FormGroup";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Checkbox from "@mui/material/Checkbox";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
// import {
//   MRT_Cell,
//   MRT_ColumnDef,
// } from 'material-react-table';
var XLSX = require("xlsx");

const theme = createTheme();

export default function MatchManager() {
  const [colDefs, setColDefs] = useState([]);
  const [data, setData] = useState([]);
  const [csvFilename, setCSVFilename] = useState("");
  const [value, setValue] = useState(0);
  // const [dense, setDense] = React.useState(false);
  // const [secondary, setSecondary] = React.useState("stuff");
  const [fileList, setFileList] = React.useState([]);
  const [fileLastMod, setFileLastMod] = React.useState([]);
  const [getListError, setGetListError] = React.useState();
  const [addSSError, setaddSSError] = React.useState();
  const [open, setOpen] = React.useState(false);
  const [sorting, setSorting] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    getFileList();
  }, []);

  function getFileList() {
    var requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    fetch("http://localhost:5000/get_data_dictionary_list", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        let resultFiles = [];
        let resultFilesLastMod = [];
        if (result.length) {
          result.map((value) => {
            resultFiles.push(value.fileName);
            resultFilesLastMod.push(value.lastModified);
          });
        }
        console.log("got result files");
        // resultFiles.;
        console.log(resultFiles);
        setFileList(resultFiles);
        setFileLastMod(resultFilesLastMod);
        setGetListError("");
      })
      .catch((error) => {
        console.log("error", error);
        setGetListError("Error occurred.");
      });
  }

  function getFile(e, value) {
    // console.log("e", e);
    // console.log("value", value);
    var formdata = new FormData();
    formdata.append("file", value);

    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("http://localhost:5000/get_data_dictionary", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        // console.log(result)
        importExcel(JSON.parse(result));
      })
      .catch((error) => console.log("error", error));
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const EXTENSIONS = ["xlsx", "xls", "csv"];
  const getExtension = (file) => {
    const parts = file.name.split(".");
    const extension = parts[parts.length - 1];
    return EXTENSIONS.includes(extension); // return boolean
  };

  const convertToJson = (headers, data) => {
    const rows = [];
    data.forEach((row) => {
      let rowData = {};
      row.forEach((element, index) => {
        rowData[headers[index]] = element;
      });
      rows.push(rowData);
    });
    return rows;
  };

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
      </div>
    );
  }

  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  const uploadDD = (e) => {
    var formdata = new FormData();
    let fileInput = e.target;
    formdata.append("dataFile", fileInput.files[0]);

    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("http://localhost:5000/add_data_dictionary", requestOptions)
      .then((response) => {
        if (response.ok) response.text();
        else throw new Error("Upload Error");
      })
      .then((result) => {
        // console.log(result);
        getFileList();
        setaddSSError("");
        e.target.value = null;
      })
      .catch((error) => {
        setaddSSError("Upload Error");
        setOpen(true);
        console.log("error", error);
        e.target.value = null;
      });
  };

  function importExcel(e) {
    console.log("e", e);
    const file = e.data;
    setCSVFilename(file.name);
    // const reader = new FileReader();
    // reader.onload = (event) => {
    //parse data
    // const bstr = event.target.result;
    // const workBook = XLSX.read(bstr, { type: "binary" });
    // const workBook = XLSX.utils.json_to_sheet(file.data);
    // console.log(file.data)

    //get first sheet
    // const workSheetName = workBook.SheetNames[0];
    // const workSheet = workBook.Sheets[workSheetName];
    const workSheet = XLSX.utils.json_to_sheet(file.data);
    //convert to array
    const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
    const headers = fileData[0];
    const heads = headers.map((head) => ({
      accessorKey: head.replaceAll(".", ""),
      header: head.replaceAll(".", ""),
    }));
    setColDefs(heads);

    //removing header
    fileData.splice(0, 1);
    setData(convertToJson(headers, fileData));
    setIsLoading(false)
    // };

    // if (file) {
    //   if (getExtension(file)) {
    //     reader.readAsText(file.data);
    //   } else {
    //     alert("Invalid file input, Select Excel, CSV file");
    //   }
    // } else {
    //   setData([]);
    //   setColDefs([]);
    // }
  }

  // const columns = useMemo<MRT_ColumnDef<Person>[]>(
  //   () => [
  //     //column definitions...
  //   ],
  //   [],
  // );

  // const [tableData, setTableData] = useState(() => data);

  const handleSaveCell = (cell, value) => {
    //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here
    data[cell.row.index][cell.column.id] = value;
    //send/receive api updates here
    setData([...data]); //re-render with new data
    setIsLoading(false)
  };

  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  function deleteFile(e, value) {
    var formdata = new FormData();
    formdata.append("file", value);
    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("http://localhost:5000/remove_data_dictionary", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        getFileList();
      })
      .catch((error) => console.log("error", error));
  }

  function resetScreen() {
    console.log("reset screen");
    setData([]);
    setIsLoading(false)
    setCSVFilename("");
  }
  //optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef(null);
  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    rowVirtualizerInstanceRef.current?.scrollToIndex(0);
  }, [sorting]);

  //   const formRef = React.useRef();
  const uploadInputRef = React.useRef(null);
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="90%">
        <CssBaseline />
        <Paper
          sx={{
            minHeight: 800,
            paddingLeft: 1,
            paddingRight: 1,
            m: 2
          }}
        >
          {/* <h2>Data Dictionary Mapping Manager</h2> */}
          <Grid container spacing={1}>
            <Grid item xs={2}>
              <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
                Data Dictionaries
              </Typography>
              <Button
                variant="contained"
                component="label"
                onClick={() =>
                  uploadInputRef.current && uploadInputRef.current.click()
                }
              >
                Add Data Dictionary
                <input
                  id="fileUpload"
                  // onChange={(e)=>{importExcel(e)}}
                  onChange={uploadDD}
                  type="file"
                  hidden
                />
              </Button>

              {addSSError ? (
                <Snackbar
                  anchorOrigin={{ vertical: "top", horizontal: "center" }}
                  open={open}
                  autoHideDuration={6000}
                  onClose={handleClose}
                >
                  <Alert
                    onClose={handleClose}
                    severity="error"
                    sx={{ width: "100%" }}
                  >
                    Error Occurred!
                  </Alert>
                </Snackbar>
              ) : (
                ""
              )}

              <List dense={true}>
                {getListError
                  ? getListError
                  : fileList
                  ? fileList.map((value, index) => {
                      return (
                        <ListItem
                          key={value}
                          secondaryAction={
                            <IconButton
                              onClick={(event) => deleteFile(event, value)}
                              edge="end"
                              aria-label="delete"
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              onClick={(event) => getFile(event, value)}
                              sx={{
                                ":hover": {
                                  bgcolor: "primary.main", // theme.palette.primary.main
                                  color: "white",
                                  cursor: "pointer",
                                },
                              }}
                            >
                              <FolderIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={value}
                            secondary={fileLastMod[index]}
                          />
                        </ListItem>
                      );
                    })
                  : ""}
              </List>
            </Grid>

            <Grid item xs={10}>
              <Grid container>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      marginTop: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {data.length ? (
                      <Grid item xs={12}>
                        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                          <h2>{csvFilename}</h2>
                          <Button
                            variant="contained"
                            color="success"
                            component="label"
                            onClick={(event) => resetScreen(event, value)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            component="label"
                            onClick={(event) => resetScreen(event, value)}
                          >
                            Close
                          </Button>
                          <Tabs
                            centered
                            value={value}
                            onChange={handleChange}
                            aria-label="basic tabs example"
                          >
                            <Tab label="Needs Review" {...a11yProps(0)} />
                            <Tab label="Approved" {...a11yProps(1)} />
                          </Tabs>
                        </Box>
                        <TabPanel
                          value={value}
                          index={0}
                          style={{ minWidth: "800px" }}
                        >
                          <Grid container id="dvCSV">
                            <Grid item xs={12}>
                              <div>
                                <MaterialReactTable
                                  columns={colDefs}
                                  data={data}
                                  enableColumnOrdering //enable some features
                                  enableRowSelection
                                  editingMode="cell"
                                  initialState={{
                                    density: "compact",

                                    // pagination: { pageSize: 50, pageIndex: 0 },
                                  }}
                                  enableEditing
                                  enableStickyHeader
                                  enableStickyFooter
                                  enableRowNumbers
                                  muiTableBodyCellEditTextFieldProps={({
                                    cell,
                                  }) => ({
                                    //onBlur is more efficient, but could use onChange instead
                                    onBlur: (event) => {
                                      handleSaveCell(cell, event.target.value);
                                    },
                                  })}
                                  enablePagination={false} //disable a default feature
                                  enableColumnVirtualization
                                  enableGlobalFilterModes
                                  enablePinning
                                  enableRowVirtualization
                                  muiTableContainerProps={{
                                    sx: { maxHeight: "600px" },
                                  }}
                                  onSortingChange={setSorting}
                                  state={{ isLoading, sorting }}
                                  rowVirtualizerInstanceRef={
                                    rowVirtualizerInstanceRef
                                  } //optional
                                  rowVirtualizerProps={{ overscan: 5 }} //optionally customize the row virtualizer
                                  columnVirtualizerProps={{ overscan: 2 }} //optionally customize the column virtualizer
                                  // onRowSelectionChange={setRowSelection} //hoist internal state to your own state (optional)
                                  // state={{ rowSelection }} //manage your own state, pass it back to the table (optional)
                                  // tableInstanceRef={tableInstanceRef} //get a reference to the underlying table instance (optional)
                                />
                              </div>
                              {/* ) : (
                      ""
                    )} */}
                            </Grid>
                            <Grid item></Grid>
                          </Grid>

                          {/* </Grid> */}
                          {/* </Grid> */}
                        </TabPanel>
                        <TabPanel value={value} index={1}>
                          Item Two
                        </TabPanel>
                        <TabPanel value={value} index={2}>
                          Item Three
                        </TabPanel>
                      </Grid>
                    ) : (
                      <Typography>
                        Please select a data dictionary to the left or add a new
                        one
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
