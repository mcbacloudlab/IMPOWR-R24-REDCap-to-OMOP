import React, { useState, useEffect, useRef, useMemo } from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
// import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import MaterialReactTable from "material-react-table";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import SaveIcon from "@mui/icons-material/Save";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
// import IconButton from "@mui/material/IconButton";
// import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import FolderIcon from "@mui/icons-material/Folder";
// import DeleteIcon from "@mui/icons-material/Delete";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { darken } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { ExportToCsv } from "export-to-csv";
import LinearProgress from "@mui/material/LinearProgress";

var XLSX = require("xlsx");


export default function Archived(props) {
  const [colDefs, setColDefs] = useState([]);
  const [data, setData] = useState([]);
  const [csvFilename, setCSVFilename] = useState("");
  const [value, setValue] = useState(0);
  const [fileList, setFileList] = React.useState([]);
  const [fileLastMod, setFileLastMod] = React.useState([]);
  const [getListError, setGetListError] = React.useState();
  const [addSSError, setaddSSError] = React.useState();
  const [open, setOpen] = React.useState(false);
  const [sorting, setSorting] = useState([]);
  const [isLoading, setIsLoading] = useState();
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
  useEffect(() => {
    getFileList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportData = () => {
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

    csvExporter.generateCsv(_data);
  };

  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    rowVirtualizerInstanceRef.current?.scrollToIndex(0);
  }, [sorting]);

  const columns = useMemo(() => colDefs, [colDefs]);
  // const tableData = useMemo(() => data, [data]);

  function getFileList() {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/get_data_dictionary_list?archived=true`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        let resultFiles = [];
        let resultFilesLastMod = [];
        if (result.length) {
          result.map((value) => {
            resultFiles.push(value.fileName);
            resultFilesLastMod.push(value.lastModified);
            return result;
          });
        }
        setFileList(resultFiles);
        setFileLastMod(resultFilesLastMod);
        setGetListError("");
      })
      .catch((error) => {
        console.error("error", error);
        setGetListError("Error occurred.");
      });
  }

  function getFile(e, value) {
    setIsLoading(true);
    setSelectedIndex(value);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("file", value);

    var requestOptions = {
      method: "POST",
      body: formdata,
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/get_data_dictionary?archived=true`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setIsLoading(false);
        setData("");
        importExcel(JSON.parse(result));
      })
      .catch((error) => {
        setIsLoading(false);
        setaddSSError("Upload Error");
        setOpen(true);
        console.error("error", error);
      });
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
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

  function importExcel(e) {
    const file = e.data;
    setCSVFilename(file.name);

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
  }

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

  function resetScreen() {
    setData("");
    setIsLoading(false);
    setCSVFilename("");
    setSelectedIndex("");
  }
  //optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef(null);
  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    rowVirtualizerInstanceRef.current?.scrollToIndex(0);
  }, [sorting]);

  function ListItemTextC(fileListMod, index) {
    return (
      <ListItemText
        primary={fileListMod.substring(24, fileListMod.length)}
        primaryTypographyProps={{
          style: { whiteSpace: "normal", wordWrap: "break-word" },
        }}
        secondary={"Last Save:" + fileLastMod[index]}
      />
    );
  }

  // const uploadInputRef = React.useRef(null);
  return (
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
            <Grid item md={12} lg={2}>
              <Box>
                <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
                  Archived Data Dictionaries
                </Typography>

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
                    maxHeight: "70vh",
                    overflow: "auto",
                  }}
                >
                  {getListError
                    ? getListError
                    : fileList
                    ? fileList.map((value, index) => {
                        return (
                          <ListItem key={value}>
                            <ListItemButton
                              selected={selectedIndex === value}
                              onClick={(event) => getFile(event, value)}
                            >
                              <ListItemIcon>
                                <FolderIcon />
                              </ListItemIcon>
                              {ListItemTextC(value, index)}
                            </ListItemButton>
                            {/* <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={(event) => deleteFile(event, value)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction> */}
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
                    {isLoading ? (
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress />
                      </Box>
                    ) : data.length ? (
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
                                        Restore
                                      </Button>

                                      <Button
                                        color="success"
                                        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
                                        onClick={handleExportData}
                                        startIcon={<FileDownloadIcon />}
                                        variant="contained"
                                      >
                                        Export
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
                            </Grid>
                            <Grid item></Grid>
                          </Grid>
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
                        Please select a data dictionary to the left
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            {/* } */}
          </Grid>
        </Paper>
      </Container>
  );
}