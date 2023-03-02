/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import AddTaskIcon from "@mui/icons-material/AddTask";
import FormSelectTable from "./FormSelectTable";
import Alert from "@mui/material/Alert";
import TransferList from "./TransferList";
import { ExportToCsv } from "export-to-csv";

var XLSX = require("xlsx");
export default function FormSelect(props) {
  console.log("formsel", props);
  const [selectedForm, setSelectedForm] = useState("");
  const [data, setData] = useState();
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [showSubmittedNotifcation, setShowSubmittedNotifcation] =
    useState(false);
  const [csvFilename, setCSVFilename] = useState("");

  const columns = useMemo(() => colDefs, [colDefs]);

  function getDataDictionary(event) {
    if (!selectedForm) setSelectedForm(props.forms[0]);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.token);

    var FormData = require("form-data");
    var formdata = new FormData();
    formdata.append("form", selectedForm);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/redcap/exportMetadata`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        importExcel(JSON.parse(result));
      })
      .catch((error) => console.log("error", error));
  }

  useEffect(() => {
    setSelectedForm(props.forms[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.forms]);
  const handleChange = (event) => {
    setSelectedForm(event.target.value);
  };



  function importExcel(e) {
    const file = e;
    // setCSVFilename(file.name);

    const workSheet = XLSX.utils.json_to_sheet(file);
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
    // setApprovedData(convertToJson(headers, fileData, true));
    // setIsLoading(false);
    setIsFormLoaded(true);
  }

  const convertToJson = (headers, data, approved) => {
    const rows = [];
    let approvedIdx = headers.indexOf("Approved");
    data.forEach((row) => {
      let rowData = {};
      row.forEach((element, index) => {
        if (approved) {
          if (row[approvedIdx] === "Y") {
            rowData[headers[index]] = element;
          }
        } else {
          rowData[headers[index]] = element;
        }
      });
      if (Object.keys(rowData).length !== 0) {
        rows.push(rowData);
      }
    });
    return rows;
  };

  function submitToProcess(e) {
    setShowSubmittedNotifcation(true);
    setTimeout(() => {
      setShowSubmittedNotifcation(false);
    }, 5000);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.token);

    var formdata = new FormData();
    formdata.append("csvData", data);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/queue/submit`, requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  }

 

  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    filename: csvFilename.replace(/\.[^/.]+$/, ""),
    showLabels: true,
    useBom: false,
    useKeysAsHeaders: false,
    headers: colDefs.map((c) => {
      return c.header;
    }),
  };
  const csvExporter = new ExportToCsv(csvOptions);
  const handleExportData = () => {
    let _data = data;
    // if (selectedTabIdx) {
    //   _data = approvedData; //change export data if on approved tab
    // }
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

  function resetScreen() {
    setData("");
    // setApprovedData("");
    // setIsLoading(false);
    setCSVFilename("");
    setIsFormLoaded(false);
    // setSelectedFile("");
  }

  if (props.forms.length > 0) {
    return (
      <>
        <Grid container spacing={1}>
          <Grid item md={12} lg={4}>
            <FormControl>
              <InputLabel id="select-form-label">REDCap Forms</InputLabel>
              <Select
                labelId="select-form-label"
                label="REDCap Forms"
                id="select-form"
                value={selectedForm || (props.forms && props.forms[0])} // add a null check before accessing the array
                onChange={handleChange}
              >
                {props.forms.map((form) => (
                  <MenuItem key={form} value={form}>
                    {form}
                  </MenuItem>
                ))}
              </Select>
              <Grid padding={1}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<AddIcon />}
                  onClick={(e) => getDataDictionary(e)}
                >
                  Import Data Dictionary
                </Button>
              </Grid>
            </FormControl>
            {isFormLoaded && (
              <TransferList
                props={props}
                setData={setData}
                data={data}
                setColDefs={setColDefs}
                colDefs={colDefs}
              />
            )}
          </Grid>

          <Grid item xs={12} lg={8}>
            {isFormLoaded && (
              <>
                <FormSelectTable
                  props={props}
                  columns={columns}
                  data={data}
                  handleExportData={handleExportData}
                  resetScreen={resetScreen}
                />

                <Grid item xs={12} padding={1}>
                  <Button
                    sx={{ float: "right" }}
                    variant="contained"
                    color="success"
                    component="label"
                    startIcon={<AddTaskIcon />}
                    onClick={(e) => submitToProcess(e)}
                  >
                    Submit To Queue
                  </Button>
                </Grid>
                {showSubmittedNotifcation && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="100vh"
                  >
                    <Alert
                      severity="success"
                      sx={{
                        // "& .MuiAlert-icon": {
                        //   color: "white",
                        // },
                        // color: 'white',
                        // backgroundColor: "#008C95",
                        fontSize: "1.2rem",
                        position: "absolute",
                        top: "5px",
                        right: "150px",
                        zIndex: 10000
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Submitted to Queue
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Your job has been successfully submitted to the queue. View pending jobs here.
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </>
    );
  }
}
