import React from "react";
// import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CompletedJobTable from "../components/CompletedJobTable";
import { ExportToCsv } from "export-to-csv";
import { Button, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddTaskIcon from "@mui/icons-material/AddTask";
import CheckIcon from "@mui/icons-material/Check";
// import CheckIcon from "@mui/icons-material/Check";

// var XLSX = require("xlsx");
export default function CompletedJobsViewPage(props) {
  // console.log("complete view page", props);
  const [data, setData] = useState("");
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [jobId, setJobId] = useState();
  const [csvFilename, setCSVFilename] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingErr, setIsSavingErr] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [verifiedRecords, setVerifiedRecords] = useState(0);
  const [allVerified, setAllVerified] = useState(false);

  const location = useLocation();
  let _jobId, _data, _jobName, _submittedBy;
  // console.log("location", location.state);
  if (location.state.jobId) {
    _jobId = location.state.jobId;
    _data = location.state.result;
    _jobName = location.state.jobName;
    _submittedBy = location.state.submittedBy;
  }
  let _dataObj;
  const columns = useMemo(() => colDefs, [colDefs]);

  useEffect(() => {
    console.log("build table?");

    // Retrieve the dataString from local storage using the key "myData"
    const dataString = localStorage.getItem("myData");

    // If dataString is not null, parse it back into an object
    const localStorageData = dataString ? JSON.parse(dataString) : null;
    console.log("localStorageData", localStorageData);
    if (localStorageData) {
      console.log("using local storage data");
      if (_jobId) setJobId(_jobId);
      buildTable(localStorageData, true);
    } else if (_data) {
      console.log("using default job data");
      if (_jobId) setJobId(_jobId);
      buildTable(JSON.parse(_data), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_data, _jobId]);

  function verifyRow(row) {
    // console.log("rowId", row.snomedID);

    const updatedData = _dataObj.map((item) => {
      if (item.redcapFieldLabel === row.redcapFieldLabel) {
        console.log("item", item);
        //increment counter only if row has not been verified previously
        if (item.verified === false) {
          // Update both verifiedRecords and totalRecords using functional updates
          setVerifiedRecords((prevVerifiedRecords) => {
            const updatedVerifiedRecords = prevVerifiedRecords + 1;

            // Use functional update to access the latest value of totalRecords
            setTotalRecords((prevTotalRecords) => {
              if (updatedVerifiedRecords === prevTotalRecords) {
                setAllVerified(true);
              }
              return prevTotalRecords; // Return the latest value of totalRecords (no changes needed)
            });

            return updatedVerifiedRecords;
          });
        }
        const updatedSubRows = item.subRows.map((subRow) => ({
          ...subRow,
          selected: subRow.snomedID === row.snomedID ? true : false,
          verified: true,
        }));
        return {
          ...item,
          selected: item.snomedID === row.snomedID ? true : false,
          subRows: updatedSubRows,
          verified: true,
        };
      }
      return item;
    });

    // console.log("updatedData", updatedData);
    _dataObj = updatedData;
    console.log("_dataObj", _dataObj);
    setData(updatedData);
    // setData(data)
  }

  function buildTable(data, localStorageFlag) {
    console.log("buildTable, dat", data);
    let result = [];
    let currentRedcapFieldLabel = null;
    let currentRedcapFieldName = null;
    let currentItem = null;
    //create verified and selected keys if first time and not using localStorage data
    if (!localStorageFlag) {
      data.forEach((item, index) => {
        // console.log("item", item);
        // console.log("item.redcapFieldLabel", item.redcapFieldLabel);
        // console.log("item.extraData.field_name", item.extraData.field_name);
        if (
          item.redcapFieldLabel !== currentRedcapFieldLabel ||
          item.extraData.field_name !== currentRedcapFieldName
        ) {
          console.log("create new record");
          if (currentItem) {
            result.push(currentItem);
          }
          item.selected = false;
          item.verified = false;
          currentItem = { ...item, subRows: [] };
          currentRedcapFieldLabel = item.redcapFieldLabel;
          currentRedcapFieldName = item.extraData.field_name;
        } else {
          currentItem.subRows.push({
            ...item,
            selected: false,
            verified: false,
          });
        }

        if (index === data.length - 1) {
          result.push(currentItem);
        }
      });
    } else {
      result = data;
      //count verified records
      console.log("result", result);
      // Calculate the number of objects with "verified" set to true
      const verifiedCount = result.reduce((count, obj) => {
        console.log(obj.verified === true)

        
        // Check if the "verified" key is true, and increment the count if it is
        return obj.verified === true ? count + 1 : count;
      }, 0); // Initialize the accumulator (count) with 0
      // Update the state with the new verified count
      if(verifiedCount === result.length){
        setAllVerified(true)
      }
      setVerifiedRecords(verifiedCount);
    }

    console.log("result", result);
    setTotalRecords(result.length);

    const PreferredCell = ({ cell, row }) => {
      return cell.getValue() === false ? (
        <Button
          variant={"contained"}
          onClick={() => {
            verifyRow(cell.row.original);
          }}
        >
          Prefer this one
        </Button>
      ) : (
        <Typography>
          <b>Preferred</b>
        </Typography>
      );
    };

    const VerifiedCell = ({ cell, row }) => {
      return cell.getValue() === false ? <CloseIcon /> : <CheckIcon />;
    };

    const cols = [
      {
        header: "Redcap Field Label",
        accessorKey: "redcapFieldLabel",
      },
      {
        header: "REDCap Field Name",
        accessorKey: "extraData.field_name",
      },
      {
        header: "Snomed Text",
        accessorKey: "snomedText",
      },
      {
        header: "Snomed ID",
        accessorKey: "snomedID",
        // Use the Cell option to modify the snomedID data
        Cell: ({ cell }) => {
          const snomedID = cell.getValue();
          // Create the URL with the snomedID value
          const url = `https://athena.ohdsi.org/search-terms/terms/${snomedID}`;
          // Return an 'a' tag with the URL as the href and the snomedID as the text
          return (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {snomedID}
            </a>
          );
        },
      },
      {
        header: "Similarity",
        accessorKey: "similarity",
        Cell: ({ cell }) =>
          cell.getValue().toLocaleString("en-US", {
            style: "percent",
            minimumFractionDigits: 2,
          }),
      },
      {
        header: "Selected",
        accessorKey: "selected",
        //you can access a row instance in column definition option callbacks like this

        Cell: PreferredCell,
        sx: {
          "& .MuiButton-root": {
            backgroundColor: "blue",
            color: "white",
          },
          "& .MuiTypography-root": {
            color: "green",
          },
          "& .subrow": {
            backgroundColor: "yellow",
          },
        },
      },
      {
        header: "Verified",
        accessorKey: "verified",
        //you can access a row instance in column definition option callbacks like this

        Cell: VerifiedCell,
        sx: {
          "& .MuiButton-root": {
            backgroundColor: "blue",
            color: "white",
          },
          "& .MuiTypography-root": {
            color: "green",
          },
          "& .subrow": {
            backgroundColor: "yellow",
          },
        },
      },
    ];

    // console.log("headers", cols);
    setColDefs(cols);
    // console.log("set data", result);
    _dataObj = result;
    setData(result);
    setCSVFilename(`Completed_Job_${_jobId}.csv`);
    setIsFormLoaded(true);
  }

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

    csvExporter.generateCsv(_data);
  };

  function resetScreen() {
    setData("");
    setIsFormLoaded(false);
    setJobId();
  }

  function saveFile() {
    setIsSaving(true);
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + props.token);
    var raw = JSON.stringify({
      data: { fileName: csvFilename, fileData: data },
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/save_data_dictionary`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setSaveSuccess(true);
        setTimeout(function () {
          setSaveSuccess(false);
        }, 5000);

        setIsSaving(false);
        setIsSavingErr(false);
      })
      .catch((error) => {
        setIsSaving(false);
        setIsSavingErr(true);
        console.info("error", error);
      });
  }

  function submitToProcess() {
    console.log("submit!");
    console.log("data", data);
    // Convert the data object to a JSON string before storing it in local storage
    const dataString = JSON.stringify(data);

    // Store the dataString in local storage with the key "myData"
    localStorage.setItem("myData", dataString);
  }

  return (
    <>
      <Container component="main" maxWidth="90%">
        {/* <CssBaseline /> */}
        <div style={{ textAlign: "left" }}>
          <span
            style={{ display: "flex", alignItems: "center", padding: "10px" }}
          >
            <span style={{ marginRight: "10px" }}>
              <b>Job Name:</b> {_jobName}
            </span>
            <span style={{ marginRight: "10px" }}>
              <b>Completed Job ID:</b> {jobId}
            </span>
            <span style={{ marginRight: "10px" }}>
              <b>Submitted By:</b> {_submittedBy}
            </span>
          </span>
        </div>

        {isFormLoaded && (
          <>
            <CompletedJobTable
              props={props}
              columns={columns}
              data={data}
              handleExportData={handleExportData}
              resetScreen={resetScreen}
              saveSuccess={saveSuccess}
              isSaving={isSaving}
              saveFile={saveFile}
            />
            <Typography>
              Verified {verifiedRecords}/{totalRecords}
            </Typography>
            {allVerified && (
              <Button
                sx={{ float: "right" }}
                variant="contained"
                color="primary"
                component="label"
                startIcon={<AddTaskIcon />}
                onClick={(e) => submitToProcess(e)}
              >
                Submit
              </Button>
            )}
          </>
        )}
      </Container>
    </>
  );
}
