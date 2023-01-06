import React, { useState, useEffect, useRef, useMemo } from "react";
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
import SaveIcon from '@mui/icons-material/Save';
// import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
// import Alert from "@mui/material/Alert";
// import AlertTitle from "@mui/material/AlertTitle";
// import FormGroup from "@mui/material/FormGroup";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Checkbox from "@mui/material/Checkbox";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { darken } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { ExportToCsv } from "export-to-csv"; //or use your library of choice here
// import {
//   MRT_Cell,
//   MRT_ColumnDef,
// } from 'material-react-table';
var XLSX = require("xlsx");

const theme = createTheme();

// const darkTheme = createTheme({
//   palette: {
//     mode: 'dark',
//   },
// });

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
  const [selectedIndex, setSelectedIndex] = React.useState(1);

  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    showLabels: true,
    useBom: false,
    useKeysAsHeaders: false,
    headers: colDefs.map((c) => {
      return c.header;
    }),
  };

  const csvExporter = new ExportToCsv(csvOptions);
  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    getFileList();
  }, []);

  const handleExportRows = (rows) => {
    csvExporter.generateCsv(rows.map((row) => row.original));
  };

  const handleExportData = () => {
    console.log("colDefs", colDefs);
    let _data = data;
    let keys = _data.reduce(function (acc, obj) {
      Object.keys(obj).forEach(function (key) {
        if (!acc.includes(key)) acc.push(key);
      });
      return acc;
    }, []);

    _data.forEach(function (obj) {
      keys.forEach(function (key) {
        if (!obj[key]) obj[key] = "";
      });
    });

    console.log("_data", _data);
    csvExporter.generateCsv(_data);
  };

  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    rowVirtualizerInstanceRef.current?.scrollToIndex(0);
  }, [sorting]);

  const columns = useMemo(() => colDefs, [colDefs]);
  // const tableData = useMemo(() => data, [data]);

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
        // console.log("got result files");
        // resultFiles.;
        // console.log(resultFiles);
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
    setSelectedIndex(value);
    console.log("e", e);
    console.log("value", value);
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
      .catch((error) => console.error("error", error));
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
        console.info("error", error);
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
    setIsLoading(false);
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

  // const [tableData, setTableData] = useState(() => data);

  const handleSaveCell = (cell, value) => {
    //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here
    data[cell.row.index][cell.column.id] = value;
    //send/receive api updates here
    setData([...data]); //re-render with new data
    setIsLoading(false);
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
        // console.log(result);
        getFileList();
      })
      .catch((error) => console.log("error", error));
  }

  function resetScreen() {
    console.log("reset screen");
    setData([]);
    setIsLoading(false);
    setCSVFilename("");
    setSelectedIndex('')
  }
  //optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef(null);
  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    rowVirtualizerInstanceRef.current?.scrollToIndex(0);
  }, [sorting]);

  const handleSaveRow = async ({ exitEditingMode, row, values }) => {
    //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here.
    data[row.index] = values;
    //send/receive api updates here
    setData([...data]);
    exitEditingMode(); //required to exit editing mode
  };

  function ListItemTextC(fileListMod, index) {
    console.log("fileList", fileListMod);
    console.log("index", index);

    return (
      <ListItemText
        primary={fileListMod}
        primaryTypographyProps={{ style: { whiteSpace: "normal", wordWrap: 'break-word'} }}
        secondary={"Last Save:" + fileLastMod[index]}
      />
    );
  }

  //   const formRef = React.useRef();
  const uploadInputRef = React.useRef(null);
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="90%">
        <CssBaseline />
        <Paper
          sx={{
            minHeight: "90vh",
            paddingLeft: 1,
            paddingRight: 1,
            m: 2,
          }}
        >
          {/* <h2>Data Dictionary Mapping Manager</h2> */}
          <Grid container spacing={1}>
            <Grid item md={12} lg={2} >
              <Box>
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

                <List
                  dense={true}
                  sx={{
                    color: "success.main",
                  }}
                >
                  {getListError
                    ? getListError
                    : fileList
                    ? fileList.map((value, index) => {
                        return (
                          <ListItem
                            key={value}
                            
                            // secondaryAction={
                            // <IconButton
                            //   onClick={(event) => deleteFile(event, value)}
                            //   edge="end"
                            //   aria-label="delete"
                            // >
                            //   <DeleteIcon />
                            // </IconButton>
                            // }
                          >
                            {/* <ListItemAvatar>
                              <Avatar
                                onClick={(event) => getFile(event, value)}
                                selected={true}
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
                            </ListItemAvatar> */}
                            {/* {ListItemTextC(value, index)} */}
                            <ListItemButton
                              selected={selectedIndex === value}
                              onClick={(event) => getFile(event, value)}
                            >
                              <ListItemIcon>
                                <FolderIcon />
                              </ListItemIcon>
                              {ListItemTextC(value, index)}
                              {/* <ListItemText primary="Inbox" /> */}
                            </ListItemButton>
                            <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={(event) => deleteFile(event, value)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })
                    : ""}
                </List>
              </Box>
            </Grid>

            <Grid item sm={12} md={10}>
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
                          <Box sx={{ justifyContent: "flex-end" }}></Box>
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
                              {/* <div sx={{ minWidth: "800px" }}> */}
                              <div>
                                <MaterialReactTable
                                  columns={columns}
                                  data={data} //10,000 rows
                                  enableBottomToolbar={false}
                                  enableGlobalFilterModes
                                  enablePagination={false}
                                  // enableRowNumbers
                                  enableRowVirtualization
                                  muiTableContainerProps={{
                                    sx: { maxHeight: "600px" },
                                  }}
                                  onSortingChange={setSorting}
                                  // state={{ isLoading, sorting }}
                                  rowVirtualizerInstanceRef={
                                    rowVirtualizerInstanceRef
                                  } //optional
                                  rowVirtualizerProps={{ overscan: 8 }} //optionally customize the virtualizer
                                  initialState={{
                                    density: "compact",
                                    // pagination: { pageSize: 50, pageIndex: 0 },
                                  }}
                                  enableEditing
                                  // onEditingRowSave={handleSaveRow}
                                  editingMode="cell"
                                  muiTableBodyCellEditTextFieldProps={({
                                    cell,
                                  }) => ({
                                    //onBlur is more efficient, but could use onChange instead
                                    onBlur: (event) => {
                                      handleSaveCell(cell, event.target.value);
                                    },
                                  })}
                                  enableColumnResizing={true}
                                  enableSorting={true}
                                  enableStickyHeader
                                  muiTablePaperProps={{
                                    elevation: 2, //change the mui box shadow
                                    //customize paper styles
                                    sx: {
                                      borderRadius: "0",
                                      border: "1px solid #e0e0e0",
                                    },
                                  }}
                                  muiTableBodyProps={{
                                    sx: (theme) => ({
                                      "& tr:nth-of-type(odd)": {
                                        backgroundColor: darken(
                                          theme.palette.background.default,
                                          0.1
                                        ),
                                      },
                                    }),
                                  }}
                                  muiTableHeadProps={{
                                    sx: (theme) => ({
                                      "& tr": {
                                        backgroundColor: "#4a4a4a",
                                        color: "#ffffff",
                                      },
                                    }),
                                  }}
                                  muiTableHeadCellProps={{
                                    sx: (theme) => ({
                                      div: {
                                        backgroundColor: "#4a4a4a",
                                        color: "#ffffff",
                                      },
                                    }),
                                  }}
                                  defaultColumn={{
                                    minSize: 20, //allow columns to get smaller than default
                                    maxSize: 9000, //allow columns to get larger than default
                                    size: 380, //make columns wider by default
                                  }}
                                  // enableStickyFooter

                                  positionToolbarAlertBanner="bottom"
                                  renderTopToolbarCustomActions={({
                                    table,
                                  }) => (
                                    <Box
                                      width="100%"
                                      sx={{
                                        display: "flex",
                                        gap: "1rem",
                                        p: "0.5rem",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      

                                      <Button
                                        variant="contained"
                                        color="primary"
                                        component="label"
                                        startIcon={<SaveIcon />}
                                        onClick={(event) =>
                                          resetScreen(event, value)
                                        }
                                      >
                                        Save
                                      </Button>

                                      <Button
                                        color="success"
                                        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
                                        onClick={handleExportData}
                                        startIcon={<FileDownloadIcon />}
                                        variant="contained"
                                      >
                                        Export All Data
                                      </Button>

                                      <Box style={{ marginLeft: "auto" }}>
                                        <Button
                                          variant="outlined"
                                          color="error"
                                          component="label"
                                          onClick={(event) =>
                                            resetScreen(event, value)
                                          }
                                        >
                                          Close
                                        </Button>
                                      </Box>
                                    </Box>
                                  )}
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
