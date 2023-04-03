import React from "react";
// import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CompletedJobTable from "../components/CompletedJobTable";
import { ExportToCsv } from "export-to-csv";
import { Box, Button, IconButton, Typography, Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import CloseIcon from "@mui/icons-material/Close";
import AddTaskIcon from "@mui/icons-material/AddTask";
import CheckIcon from "@mui/icons-material/Check";
// import DoneAllIcon from "@mui/icons-material/DoneAll";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import VerifiedIcon from "@mui/icons-material/Verified";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import Skeleton from "@mui/material/Skeleton";
import SearchIcon from "@mui/icons-material/Search";
import Modal from "@mui/material/Modal";
// import CloseIcon from '@mui/icons-material/Close';
// import CheckIcon from "@mui/icons-material/Check";
import TextField from "@mui/material/TextField";
import UMLSSearchBasicTable from "../components/UMLSSearchBasicTable";
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

// var XLSX = require("xlsx");

export default function CompletedJobsViewPage(props) {
  // console.log("complete view page", props);
  const [data, setData] = useState("");
  const [tempAllData, setTempAllData] = useState("");
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [jobId, setJobId] = useState();
  const [csvFilename, setCSVFilename] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // const [isSavingErr, setIsSavingErr] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [verifiedRecords, setVerifiedRecords] = useState(0);
  const [allVerified, setAllVerified] = useState(false);
  const [value, setValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // const [selectedFile, setSelectedFile] = useState(1);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [finalData, setFinalData] = useState("");
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [searchUMLSValue, setSearchUMLSValue] = useState("");
  const [umlsResultsData, setUMLSResultsData] = useState([]);
  const [modalRowData, setModalRowData] = useState([]);

  const umlsModalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    maxHeight: "80%",
    overflowY: "auto",
  };

  const tableContainerStyle = {
    maxHeight: "calc(80% - 100px)", // Adjust this value based on the total height of other elements
    overflowY: "auto",
    marginTop: "15px",
  };

  const handleLookupModalOpen = () => setLookupModalOpen(true);
  const handleLookupModalClose = () => setLookupModalOpen(false);

  const location = useLocation();
  let _jobId, _data, _jobName, _submittedBy, _redcapFormName;
  if (location.state.jobId) {
    _jobId = location.state.jobId;
    _data = location.state.result;
    _jobName = location.state.jobName;
    _submittedBy = location.state.submittedBy;
    _redcapFormName = location.state.redcapFormName;
  }
  let _dataObj;
  const columns = useMemo(() => colDefs, [colDefs]);

  useEffect(() => {
    console.log("getJobVerificationInfo");
    //get job verification data from db
    getJobVerificationInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_data, _jobId]);

  function searchUMLS(text) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("searchText", text);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/umls/getUMLSSearchResults`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setUMLSResultsData(result);
      })
      .catch((error) => console.log("error", error));
  }

  function getJobVerificationInfo() {
    let jobVerificationData;
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("jobId", _jobId);
    formdata.append("formName", _redcapFormName);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobVerifyinfo`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        jobVerificationData = JSON.parse(result);
        //if we have saved job data stored in the db use that else just use a new blank
        if (jobVerificationData) {
          console.log("found saved job");
          if (_jobId) setJobId(_jobId);
          buildTable(JSON.parse(jobVerificationData.jobData), true);
          setTempAllData(JSON.parse(jobVerificationData.jobData));
        } else if (_data) {
          console.log("new job");
          if (_jobId) setJobId(_jobId);
          buildTable(JSON.parse(_data), false);
        }
      })
      .catch((error) => {
        console.log("error", error);
        if (_jobId) setJobId(_jobId);
        //on an error reading from the db just load a new blank job
        console.log("build table with blank", JSON.parse(_data));
        buildTable(JSON.parse(_data), false);
      });
  }

  function storeJobVerificationInfo(dataString) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("formName", _redcapFormName);
    formdata.append("jobId", _jobId);
    formdata.append("jobData", dataString);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/storeJobVerifyInfo`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setIsSaving(false);
      })
      .catch((error) => {
        console.log("error", error);
        setIsSaving(false);
      });
  }

  function storeJobCompleteInfo(dataString) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("formName", _redcapFormName);
    formdata.append("jobId", _jobId);
    formdata.append("jobData", dataString);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/storeJobCompleteInfo`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setIsSaving(false);
      })
      .catch((error) => {
        console.log("error", error);
        setIsSaving(false);
      });
  }

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

  function verifyRow(row, removePref) {
    console.log("verifyRow row", row);
    const updatedData = _dataObj.map((item) => {
      console.log("verifyRow item:", item);
      //removing the pref
      if (removePref) {
        if (
          item.redcapFieldLabel === row.redcapFieldLabel &&
          item.extraData.field_name === row.extraData.field_name
        ) {
          //increment counter only if row has not been verified previously
          if (item.verified === true) {
            // Update both verifiedRecords and totalRecords using functional updates
            setVerifiedRecords((prevVerifiedRecords) => {
              const updatedVerifiedRecords = prevVerifiedRecords - 1;

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
            selected: subRow.snomedID === row.snomedID ? false : false,
            verified: false,
          }));
          return {
            ...item,
            selected: item.snomedID === row.snomedID ? false : false,
            subRows: updatedSubRows,
            verified: false,
          };
        }
      } else { //adding the pref
        if (
          item.redcapFieldLabel === row.redcapFieldLabel &&
          item.extraData.field_name === row.extraData.field_name
        ) {
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
      }

      return item;
    });

    _dataObj = updatedData;
    console.log("set data with", updatedData);
    setData(updatedData);
    setTempAllData(updatedData);
    //save the data to local storage
    setIsSaving(true);
    const dataString = JSON.stringify(updatedData);
    storeJobVerificationInfo(dataString);
    
    
  }

  useEffect(() => {
    if (tempAllData) {
      showTab(null, true, selectedTabIdx);
    }
  }, [tempAllData]);

  function buildTable(_data, dbFlag, lookupFlag) {
    let result = [];
    let currentRedcapFieldLabel = null;
    let currentRedcapFieldName = null;
    let currentItem = null;
    console.log("data passed to buildTable", _data);
    console.log("look up flag", lookupFlag);
    //create verified and selected keys if first time
    if (!dbFlag) {
      _data.forEach((item, index) => {
        if (
          item.redcapFieldLabel !== currentRedcapFieldLabel ||
          item.extraData.field_name !== currentRedcapFieldName
        ) {
          console.log("lookup flag", lookupFlag);
          console.log("currentitem", currentItem);
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

        if (index === _data.length - 1) {
          result.push(currentItem);
        }

        // Calculate the number of objects with "verified" set to true
        const verifiedCount = result.reduce((count, obj) => {
          // Check if the "verified" key is true, and increment the count if it is
          return obj.verified === true ? count + 1 : count;
        }, 0); // Initialize the accumulator (count) with 0
        // Update the state with the new verified count
        if (verifiedCount === result.length) {
          setAllVerified(true);
        }
        setVerifiedRecords(verifiedCount);
      });
    } else {
      result = _data;
      //count verified records
      // Calculate the number of objects with "verified" set to true
      const verifiedCount = result.reduce((count, obj) => {
        // Check if the "verified" key is true, and increment the count if it is
        return obj.verified === true ? count + 1 : count;
      }, 0); // Initialize the accumulator (count) with 0
      // Update the state with the new verified count
      if (verifiedCount === result.length) {
        setAllVerified(true);
      }
      setVerifiedRecords(verifiedCount);
    }

    console.log("build table, setTempAllData with", result);
    setTempAllData(result);
    setTotalRecords(result.length);

    const PreferredCell = ({ cell, row }) => {
      return cell.getValue() === false ? (
        <Tooltip title="Set as preferred" placement="top">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              verifyRow(cell.row.original);
            }}
            sx={{
              textTransform: "capitalize",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
            }}
          >
            Prefer
          </Button>
        </Tooltip>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            padding: "0.5rem",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              marginRight: "0.5rem",
            }}
          >
            Preferred
          </Typography>
          <Tooltip title="Remove preference" placement="top">
            <IconButton
              onClick={(event) => verifyRow(cell.row.original, true)}
              size="small"
              edge="end"
              color="primary"
              sx={{
                marginLeft: "10px",
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      );
    };

    const VerifiedCell = ({ cell, row }) => {
      return cell.getValue() === false ? (
        <CloseIcon
          color="primary"
          sx={{
            padding: "0.25rem",
            borderRadius: "4px",
          }}
        />
      ) : (
        <CheckIcon
          color="primary"
          sx={{
            padding: "0.25rem",
            borderRadius: "4px",
          }}
        />
      );
    };

    function LookUpCode(row) {
      setModalRowData(row.original);
      setSearchUMLSValue(row.original.redcapFieldLabel);
      searchUMLS(row.original.redcapFieldLabel);
      handleLookupModalOpen();
    }
    const LookUpCell = ({ cell, row }) => {
      if (row.original.subRows) {
        return (
          <Tooltip title="Lookup">
            <div
              onClick={() => LookUpCode(row)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: "50%",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.08)",
              }}
            >
              <SearchIcon />
            </div>
          </Tooltip>
        );
      }
    };

    const cols = [
      {
        header: "",
        accessorKey: "verified",
        maxSize: 50,
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
      {
        header: "REDCap Field Label",
        accessorKey: "redcapFieldLabel",
        Cell: ({ cell, row }) => {
          const redcapField = cell.getValue();
          if (row.original.lookup) {
            return (
              <>
                <PersonAddAltIcon />
                {redcapField}
              </>
            );
          } else {
            return redcapField;
          }
        }
      },
      {
        header: "REDCap Field Name",
        accessorKey: "extraData.field_name",
      },
      {
        header: "SNOMED Text",
        accessorKey: "snomedText",
      },
      {
        header: "SNOMED ID",
        accessorKey: "snomedID",
        maxSize: 120,
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
        header: "Cosine Similarity",
        accessorKey: "similarity",
        maxSize: 130,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return "N/A";
          const formattedValue = value.toLocaleString("en-US", {
            style: "percent",
            minimumFractionDigits: 2,
          });

          return formattedValue;
        },
      },
      {
        header: "Preferred",
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
        header: "User Verified",
        accessorKey: "userMatch",
        maxSize: 120,
      },
      {
        header: "Lookup",
        accessorKey: "lookup",
        Cell: LookUpCell,
      },
    ];

    setColDefs(cols);
    _dataObj = result;
    console.log("set data with", result);
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
    console.log("clear data");
    setData("");
    setIsFormLoaded(false);
    setJobId();
  }

  function saveFile() {
    setIsSaving(true);
    const dataString = JSON.stringify(data);
    storeJobVerificationInfo(dataString);
  }

  function submitToProcess() {
    // Convert the data object to a JSON string before storing it in local storage
    const dataString = JSON.stringify(data);
    console.log("data", data);
    // Store the dataString in local storage with the key "myData"
    storeJobCompleteInfo(dataString);

    const filteredData = data.reduce((acc, obj) => {
      if (obj.selected && obj.verified) {
        acc.push({
          redcapFieldLabel: obj.redcapFieldLabel,
          snomedID: obj.snomedID,
          lookup: obj.lookup
        });
      } else {
        const subRows = obj.subRows
          .filter((subObj) => subObj.selected && subObj.verified)
          .map((subObj) => ({
            redcapFieldLabel: subObj.redcapFieldLabel,
            snomedID: subObj.snomedID,
            lookup: subObj.lookup
          }));
        if (subRows.length > 0) {
          acc.push(...subRows);
        }
      }
      return acc;
    }, []);

    setFinalData(JSON.stringify(filteredData, null, 2));
  }

  async function showTab(e, switching, panelIndex) {
    setIsLoading(true);
    console.log("set data with tab views");
    // setSelectedFile(value);
    if (!panelIndex) panelIndex = 0;
    setSelectedTabIdx(panelIndex);
    if (!switching) handleChange(e, 0); //reset tab to default tab

    //set table data based on panelIndex
    switch (panelIndex) {
      case 0: {
        setData(tempAllData);
        break;
      }
      case 1: {
        // Use the filter() method to get elements where the 'verified' key is false
        const unverifiedElements = tempAllData.filter((item) => {
          // Return true for elements where 'verified' is false
          return item.verified === false;
        });

        // setUnverifiedElements(unverifiedElements.length)
        setData(unverifiedElements);
        break;
      }
      case 2: {
        // Use the filter() method to get elements where the 'verified' key is false
        const verifiedElements = tempAllData.filter((item) => {
          // Return true for elements where 'verified' is false
          return item.verified === true;
        });
        const selectedAndVerifiedResults = await findSelectedAndVerified(
          verifiedElements
        );
        // setVerifiedElements(_verifiedElements.length)
        setData(selectedAndVerifiedResults);
        break;
      }

      default: {
        break;
      }
    }
  }

  function findSelectedAndVerified(arr) {
    const result = [];

    for (const obj of arr) {
      // Check if the outer object has both selected and verified equal to true
      if (obj.selected === true && obj.verified === true) {
        // Remove the subRows property and add the object to the result array
        const newObj = { ...obj };
        delete newObj.subRows;
        result.push(newObj);
      }

      // If the object has a subRows property and it is an array
      if (Array.isArray(obj.subRows)) {
        // Loop through the subRows array
        for (const subRow of obj.subRows) {
          // Check if selected and verified are true for the subRow
          if (subRow.selected === true && subRow.verified === true) {
            result.push(subRow);
          }
        }
      }
    }

    return result;
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleTextFieldChange = (event) => {
    setSearchUMLSValue(event.target.value);
  };

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

        {!isFormLoaded && (
          <Skeleton
            variant="rounded"
            sx={{ margin: "auto" }}
            width={"100%"}
            height={"90vh"}
          />
        )}

        {isFormLoaded && (
          <>
            {/* Lookup better code modal */}
            <Modal
              open={lookupModalOpen}
              onClose={handleLookupModalClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={umlsModalStyle}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                  Search UMLS
                </Typography>
                <TextField
                  id="outlined-basic"
                  label="Text Search"
                  variant="outlined"
                  value={searchUMLSValue}
                  onChange={handleTextFieldChange}
                  sx={{ marginTop: "10px" }}
                />
                <Button
                  variant="contained"
                  sx={{ marginLeft: "15px", marginTop: "20px" }}
                  onClick={() => searchUMLS(searchUMLSValue)}
                >
                  Search
                </Button>
                {umlsResultsData.length && (
                  <UMLSSearchBasicTable
                    umlsResults={umlsResultsData}
                    modalRowData={modalRowData}
                    setModalRowData={setModalRowData}
                    data={data}
                    setData={setData}
                    buildTable={buildTable}
                    storeJobVerificationInfo={storeJobVerificationInfo}
                    setLookupModalOpen={setLookupModalOpen}
                  />
                )}
              </Box>
            </Modal>
            {allVerified ? <VerifiedIcon /> : <UnpublishedIcon />}
            <Typography>
              Verified {verifiedRecords}/{totalRecords}
            </Typography>
            <Tabs
              centered
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab
                onClick={(event) => showTab(event, true, 0)}
                label={
                  <Box sx={{ position: "relative", margin: "20px" }}>
                    All
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: "-20px", // Adjust the right position of the badge
                      }}
                    >
                      <Badge
                        badgeContent={totalRecords}
                        max={9999}
                        color="secondary"
                      />
                    </Box>
                  </Box>
                }
                {...a11yProps(0)}
              />
              <Tab
                onClick={(event) => showTab(event, true, 1)}
                label={
                  <Box sx={{ position: "relative", margin: "20px" }}>
                    Needs Review
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: "-20px", // Adjust the right position of the badge
                      }}
                    >
                      <Badge
                        badgeContent={totalRecords - verifiedRecords}
                        max={9999}
                        color="secondary"
                      />
                    </Box>
                  </Box>
                }
                {...a11yProps(1)}
              />
              <Tab
                onClick={(event) => showTab(event, true, 2)}
                label={
                  <Box sx={{ position: "relative", margin: "20px" }}>
                    Verified
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: "-20px", // Adjust the right position of the badge
                      }}
                    >
                      <Badge
                        badgeContent={verifiedRecords}
                        max={9999}
                        color="secondary"
                      />
                    </Box>
                  </Box>
                }
                {...a11yProps(2)}
              />
            </Tabs>
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

            {((allVerified && selectedTabIdx === 0) ||
              selectedTabIdx === 2) && (
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
            <Typography>{finalData}</Typography>
          </>
        )}
      </Container>
    </>
  );
}
