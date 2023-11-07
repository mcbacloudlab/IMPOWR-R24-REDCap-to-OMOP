/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import AddTaskIcon from "@mui/icons-material/AddTask";
import FormSelectTable from "./FormSelectTable";
import Alert from "@mui/material/Alert";
import TransferList from "./TransferList";
import CollectionList from "./CollectionList";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import Skeleton from "@mui/material/Skeleton";
import ImportExportIcon from "@mui/icons-material/ImportExport";

var XLSX = require("xlsx");
export default function FormSelect(props) {
  let token =
    props.props.props?.props?.token ??
    props.props?.props?.token ??
    props.props?.token ??
    props?.token ??
    props.token;
  const [selectedForm, setSelectedForm] = useState("");
  const [data, setData] = useState();
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showSubmittedNotifcation, setShowSubmittedNotifcation] =
    useState(false);
  const [csvFilename, setCSVFilename] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectRowsError, setSelectRowsError] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [isValidChecked, setIsValidChecked] = useState(true);


  var tableInstanceRef = useRef(null);
  useEffect(() => {
    if (tableInstanceRef.current) {
      setSelectedRows(tableInstanceRef.current.getState().rowSelection);
    }
  }, [tableInstanceRef.current]);

  const handleRowSelection = (selected) => {
    const rowSelection = tableInstanceRef.current.getState().rowSelection;
    setSelectedRows(rowSelection);
  };

  const columns = useMemo(() => colDefs, [colDefs]);

  function getDataDictionary(event) {
    setIsFormLoaded(false);
    setIsFormLoading(true);
    if (!selectedForm) setSelectedForm(props.forms[0]);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var FormData = require("form-data");
    var formdata = new FormData();
    formdata.append("form", selectedForm);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/redcap/exportMetadata`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        console.log("result", result);
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
    resetScreen();
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
    setSelectedRows(convertToJson(headers, fileData));

    // setData(convertToJson(headers, fileData));
    let convertedData = convertToJson(headers, fileData);
    for (var i = 0; i < convertedData.length; i++) {
      var obj = convertedData[i];

      // Check if the field_type is 'dropdown'
      if (obj.field_type === "dropdown" || obj.field_type === "radio") {
        var selectChoices = obj.select_choices_or_calculations;
        console.log("Dropdown/radio value: " + selectChoices);

        var choices = selectChoices.split("|"); // Split the string into individual choices

        var parsedChoices = choices.map(function (choice) {
          var keyValue = choice.split(",");
          var key = keyValue[0].trim();
          var value = keyValue[1].trim();
          return { key: key, value: value };
        });

        console.log("Parsed choices: ", parsedChoices);

        // Append new objects with parsed data to convertedData array
        for (var j = 0; j < parsedChoices.length; j++) {
          var choice = parsedChoices[j];
          var appendedFieldName = obj.field_name + "_" + choice.key;

          var newObject = {
            field_name: appendedFieldName,
            form_name: obj.form_name,
            section_header: obj.section_header,
            field_type: obj.field_type,
            field_label: choice.value,
            select_choices_or_calculations: obj.select_choices_or_calculations,
            field_note: obj.field_note,
            text_validation_type_or_show_slider_number:
              obj.text_validation_type_or_show_slider_number,
            text_validation_min: obj.text_validation_min,
            text_validation_max: obj.text_validation_max,
            identifier: obj.identifier,
            branching_logic: obj.branching_logic,
            required_field: obj.required_field,
            custom_alignment: obj.custom_alignment,
            question_number: obj.question_number,
            matrix_group_name: obj.matrix_group_name,
            matrix_ranking: obj.matrix_ranking,
            field_annotation: obj.field_annotation,
            og_field_name_key: choice.key,
            og_field_name: obj.field_name,
          };

          convertedData.splice(i + 1, 0, newObject); // Insert new object after the current object
          i++; // Increment i to skip the newly inserted object in the next iteration
        }
      }
    }
    console.log("converted", convertedData);
    setData(convertedData);
    setIsFormLoaded(true);
    setIsFormLoading(false);
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
    let selectedRows = tableInstanceRef.current?.getSelectedRowModel().rows;

    // Reformat the array of objects
    const reformattedArray = selectedRows.map((obj) => obj.original);
    let dataToSendToQueue;
    if (!reformattedArray || reformattedArray.length <= 0) {
      dataToSendToQueue = data;
    } else {
      dataToSendToQueue = reformattedArray;
    }
    setSelectRowsError(false);

    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    // console.log("send data", data);
    var formdata = new FormData();
    // console.log('object length', dataToSendToQueue.length)
    formdata.append("data", JSON.stringify(dataToSendToQueue));
    formdata.append("selectedForm", selectedForm);
    formdata.append("dataLength", dataToSendToQueue.length);
    formdata.append("isValidChecked", isValidChecked)

    // Filter out properties with the value of false
    const filteredCollections = Object.fromEntries(
      Object.entries(checkedItems).filter(([key, value]) => value !== false)
    );
    // console.log("collections to use", JSON.stringify(filteredCollections));
    formdata.append("collections", JSON.stringify(filteredCollections));
    const checkIfAllFalse = (checkedItems) => {
      // Extract an array of values from the checkedItems object
      const values = Object.values(checkedItems);

      // Use the every() method to check if every value is false
      const allFalse = values.every((value) => value === false);

      // If the array is empty or all values are false, set selectRowsErrors to true
      if (values.length === 0 || allFalse) {
        setSelectRowsError(true);
        return false;
      } else {
        setSelectRowsError(false);
        return true;
      }
    };

    // Call the checkIfAllFalse function and pass the checkedItems object
    let checkedItem = checkIfAllFalse(checkedItems);
    if (!checkedItem) return;

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/submit`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        // console.log(result);
        window.scrollTo(0, 0); //scroll to top of page
        setShowSubmittedNotifcation(true);
        setTimeout(() => {
          setShowSubmittedNotifcation(false);
        }, 5000);
      })
      .catch((error) => console.log("error", error));
  }

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
    // Convert the results array to CSV format using papaparse
    const csvData = Papa.unparse(_data);

    // Create a Blob from the CSV data
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

    // Use FileSaver to save the generated CSV file
    saveAs(blob, `${csvFilename}.csv`);
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
        <Grid container>
          <Grid item lg={12} xl={4}>
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
              <Grid sx={{ mt: 1, mb: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<ImportExportIcon />}
                  onClick={(e) => getDataDictionary(e)}
                >
                  Import Data Dictionary
                </Button>
              </Grid>
            </FormControl>
            {isFormLoading && (
              <Skeleton
                variant="rounded"
                sx={{ margin: "auto" }}
                width={"80%"}
                height={"30vh"}
              />
            )}
            <Grid sx={{ margin: 1 }}>
              {isFormLoaded && (
                <>
                  <CollectionList
                    token={token}
                    setCheckedItems={setCheckedItems}
                    checkedItems={checkedItems}
                  />
                  <Tooltip title="Check this if you only want to include valid Athena terms using the valid start and end dates">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isValidChecked}
                          onChange={(e) => setIsValidChecked(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Only Include Valid Terms"
                    />
                  </Tooltip>

                  <TransferList
                    props={props}
                    setData={setData}
                    data={data}
                    setColDefs={setColDefs}
                    colDefs={colDefs}
                  />
                </>
              )}
            </Grid>
            <Grid sx={{ margin: "auto", mt: 2 }}>
              {selectRowsError && (
                <Alert
                  severity="error"
                  sx={{
                    fontSize: "1.2rem",
                    maxWidth: "400px",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Error
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Please select as least one collection to use.
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>

          <Grid
            item
            xs={12}
            lg={8}
            sx={{ maxWidth: "100%", overflowX: "auto" }}
          >
            {isFormLoading && (
              <Skeleton variant="rounded" width={"100%"} height={"40vh"} />
            )}
            {isFormLoaded && (
              <>
                <FormSelectTable
                  props={props}
                  columns={columns}
                  data={data}
                  handleExportData={handleExportData}
                  resetScreen={resetScreen}
                  handleRowSelection={handleRowSelection}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  tableInstanceRef={tableInstanceRef}
                />

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Tooltip
                    title={
                      "This will submit your selected rows (all if none selected) to a process that will return the most similar SNOMED ids and texts based on the field_label"
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
                        fontSize: "1.2rem",
                        position: "absolute",
                        top: "0px",
                        right: "250px",
                        zIndex: 10000,
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Submitted to Queue
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Your job has been successfully submitted to the queue.
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
