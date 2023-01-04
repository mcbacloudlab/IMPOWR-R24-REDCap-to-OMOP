import React, { useState } from "react";
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
// import FormGroup from "@mui/material/FormGroup";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Checkbox from "@mui/material/Checkbox";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import * as axios from 'axios';
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
  const [secondary, setSecondary] = React.useState("stuff");

  const handleChange = (event, newValue) => {
    setValue(newValue);
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
        {value === index && (
          <Box sx={{ p: 1 }}>
            {children}
          </Box>
        )}
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
    let fileInput = e.target
    formdata.append("dataFile", fileInput.files[0]);
    
    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };
    
    fetch("http://localhost:5000/add_data_dictionary", requestOptions)
      .then(response => response.text())
      .then(result => console.log(result))
      .catch(error => console.log('error', error));
  };

  const importExcel = (e) => {
    const file = e.target.files[0];
    setCSVFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      //parse data
      const bstr = event.target.result;
      const workBook = XLSX.read(bstr, { type: "binary" });

      //get first sheet
      const workSheetName = workBook.SheetNames[0];
      const workSheet = workBook.Sheets[workSheetName];
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
    };

    if (file) {
      if (getExtension(file)) {
        reader.readAsBinaryString(file);
      } else {
        alert("Invalid file input, Select Excel, CSV file");
      }
    } else {
      setData([]);
      setColDefs([]);
    }
  };

  function generate(element) {
    return [0, 1, 2].map((value) =>
      React.cloneElement(element, {
        key: value,
      })
    );
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
  };

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
          }}
        >
          <h1>Data Dictionary Mapping Manager</h1>
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

              <List dense={false}>
                {generate(
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <FolderIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Single-line item"
                      secondary={secondary ? "Secondary text" : null}
                    />
                  </ListItem>
                )}
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
                    <Grid item xs={12}>
                      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <h2>{csvFilename}</h2>
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
                        {/* <Grid container xs={12} spacing={1}> */}
                        {/* <Grid item xs={1}>
              </Grid> */}
                        {/* <Grid item xs={12} id="dvCSV"> */}
                        <Grid container id="dvCSV">
                          <Grid item xs={12}>
                            <div>
                              <MaterialReactTable
                                columns={colDefs}
                                data={data}
                                enableColumnOrdering //enable some features
                                enableRowSelection
                                editingMode="cell"
                                initialState={{ density: "compact" }}
                                enableEditing
                                muiTableBodyCellEditTextFieldProps={({
                                  cell,
                                }) => ({
                                  //onBlur is more efficient, but could use onChange instead
                                  onBlur: (event) => {
                                    handleSaveCell(cell, event.target.value);
                                  },
                                })}
                                enablePagination={true} //disable a default feature
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
