import React from "react";
// import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { useState, useEffect, useMemo, useContext } from "react";
import { useLocation } from "react-router-dom";
import CompletedJobTable from "../components/CompletedJobTable";
// import { ExportToCsv } from "export-to-csv";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
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
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import MyAccountNavBar from "../components/MyAccountNavBar";
import Cookies from "js-cookie";
import CssBaseline from "@mui/material/CssBaseline";
import { ViewContext } from "../components/ViewContext";
import CircularProgress from "@mui/material/CircularProgress";

// var XLSX = require("xlsx");

export default function CompletedJobsViewPage(props) {
  const [data, setData] = useState("");
  const [tempAllData, setTempAllData] = useState("");
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [jobId, setJobId] = useState();
  const [csvFilename, setCSVFilename] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // const [isSavingErr, setIsSavingErr] = useState(false);
  // const [saveSuccess, setSaveSuccess] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [verifiedRecords, setVerifiedRecords] = useState(0);
  const [allVerified, setAllVerified] = useState(false);
  const [value, setValue] = useState(0);
  // const [isLoading, setIsLoading] = useState(false);
  // const [selectedFile, setSelectedFile] = useState(1);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  // const [finalData, setFinalData] = useState("");
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [searchUMLSValue, setSearchUMLSValue] = useState("");
  const [umlsResultsData, setUMLSResultsData] = useState([]);
  const [modalRowData, setModalRowData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [searchingUMLS, setSearchingUMLS] = useState(false);
  const { view, setView } = useContext(ViewContext);

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

  // const tableContainerStyle = {
  //   maxHeight: "calc(80% - 100px)", // Adjust this value based on the total height of other elements
  //   overflowY: "auto",
  //   marginTop: "15px",
  // };

  const handleLookupModalOpen = () => setLookupModalOpen(true);
  const handleLookupModalClose = () => setLookupModalOpen(false);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

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
    //get job verification data from db
    getJobVerificationInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_data, _jobId]);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  useEffect(() => {
    try {
      let userCookie = JSON.parse(Cookies.get("user"));
      setUsername(userCookie.email);
      setName(userCookie.firstName + " " + userCookie.lastName);
      let userInfo = JSON.parse(props.user);
      setRole(userInfo.role);
    } catch (error) {
      console.error("error", error);
    }
  }, [props.user]);

  function searchUMLS(text, event) {
    if(event) event.preventDefault();
    setSearchingUMLS(true);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("searchText", text);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/umls/getUMLSSearchResults`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setSearchingUMLS(false);
        setUMLSResultsData(result);
      })
      .catch((error) => {
        setSearchingUMLS(false);
        console.error("error", error);
      });
  }

  function getJobVerificationInfo() {
    let jobVerificationData;
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);
    myHeaders.append("Content-Type", "application/json");

    var data = {
      jobId: _jobId,
      formName: _redcapFormName,
    };

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobVerifyinfo`,
      requestOptions
    )
      .then((response) => {
        if (response.ok) return response.text();
        else throw new Error("Error");
      })
      .then((result) => {
        jobVerificationData = JSON.parse(result);
        //if we have saved job data stored in the db use that else just use a new blank
        if (jobVerificationData) {
          if (_jobId) setJobId(_jobId);
          buildTable(JSON.parse(jobVerificationData.jobData), true);
          setTempAllData(JSON.parse(jobVerificationData.jobData));
        } else if (_data) {
          if (_jobId) setJobId(_jobId);
          buildTable(JSON.parse(_data), false);
        }
      })
      .catch((error) => {
        console.error("error", error);
        if (_jobId) setJobId(_jobId);
        //on an error reading from the db just load a new blank job
        buildTable(JSON.parse(_data), false);
      });
  }

  function storeJobVerificationInfo(dataString) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);
    myHeaders.append("Content-Type", "application/json");

    var data = {
      formName: _redcapFormName,
      jobId: _jobId,
      jobData: dataString,
    };
    console.log("data length store", dataString.length);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: "follow",
      credentials: "include", // Include cookies with the request
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
        console.error("error", error);
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
      credentials: "include", // Include cookies with the request
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
        console.error("error", error);
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

  function verifyRow(row, removePref, fromModal) {
    const updatedData = _dataObj.map((item) => {
      //removing the pref
      if (removePref) {
        if (
          item.redcapFieldLabel === row.redcapFieldLabel &&
          item.extraData.field_name === row.extraData.field_name
        ) {
          //increment counter only if row has not been verified previously
          if (item.verified === true && !fromModal) {
            // Update both verifiedRecords and totalRecords using functional updates
            setVerifiedRecords((prevVerifiedRecords) => {
              const updatedVerifiedRecords = prevVerifiedRecords - 1;

              // Use functional update to access the latest value of totalRecords
              setTotalRecords((prevTotalRecords) => {
                if (updatedVerifiedRecords === prevTotalRecords) {
                  setAllVerified(true);
                } else {
                  setAllVerified(false);
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
      } else {
        //adding the pref
        if (
          item.redcapFieldLabel === row.redcapFieldLabel &&
          item.extraData.field_name === row.extraData.field_name
        ) {
          //increment counter only if row has not been verified previously
          if (item.verified === false && !fromModal) {
            // Update both verifiedRecords and totalRecords using functional updates
            setVerifiedRecords((prevVerifiedRecords) => {
              const updatedVerifiedRecords = prevVerifiedRecords + 1;

              // Use functional update to access the latest value of totalRecords
              setTotalRecords((prevTotalRecords) => {
                if (updatedVerifiedRecords === prevTotalRecords) {
                  setAllVerified(true);
                } else {
                  setAllVerified(false);
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
    setData(updatedData);
    setTempAllData(updatedData);
    //save the data to local storage
    setIsSaving(true);
    const dataString = JSON.stringify(_dataObj);
    storeJobVerificationInfo(dataString);
  }

  useEffect(() => {
    if (tempAllData) {
      showTab(null, true, selectedTabIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempAllData]);

  function buildTable(_data, dbFlag, lookupFlag) {
    let result = [];
    let currentRedcapFieldLabel = null;
    let currentRedcapFieldName = null;
    let currentItem = null;
    //create verified and selected keys if first time
    if (!dbFlag) {
      _data.forEach((item, index) => {
        if (
          item.redcapFieldLabel !== currentRedcapFieldLabel ||
          item.extraData.field_name !== currentRedcapFieldName
        ) {
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
        } else {
          setAllVerified(false);
        }
        setVerifiedRecords(verifiedCount);
      });
    } else {
      result = _data;
      //count verified records
      let verifiedCount = 0;

      // Loop through each item in the outer array
      result.forEach((item) => {
        // Check if the "verified" key is true for the top-level item
        if (item.verified === true && item.selected === true) {
          verifiedCount += 1;
        }

        // Check if the "subRows" key exists and is an array
        if (Array.isArray(item.subRows)) {
          // Loop through each sub-item within "subRows"
          item.subRows.forEach((subItem) => {
            // Check if the "verified" key is true for the sub-item
            if (subItem.verified === true && subItem.selected === true) {
              verifiedCount += 1;
            }
          });
        }
      });
      // Update the state with the new verified count
      if (verifiedCount === result.length) {
        setAllVerified(true);
      } else {
        setAllVerified(false);
      }
      setVerifiedRecords(verifiedCount);
    }
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
              color="error"
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
          color="error"
          sx={{
            padding: "0.25rem",
            borderRadius: "4px",
          }}
        />
      ) : (
        <CheckIcon
          color="success"
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
        header: "REDCap Field Name",
        accessorKey: "extraData.field_name",
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
        },
      },

      {
        header: "Concept Text",
        accessorKey: "snomedText",
      },
      {
        header: "Similarity",
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
        header: "Concept ID",
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
        header: "Domain ID",
        accessorKey: "extraData.domain_id",
        maxSize: 120,
      },

      {
        header: "Concept Class ID",
        accessorKey: "extraData.concept_class_id",
        maxSize: 120,
      },

      {
        header: "Standard",
        accessorKey: "extraData.standard_concept",
        maxSize: 120,
      },
      {
        header: "Vocab",
        accessorKey: "extraData.vocabulary_id",
        maxSize: 120,
      },

      // {
      //   header: "User Verified",
      //   accessorKey: "userMatch",
      //   maxSize: 120,
      // },
      {
        header: "Preferred",
        accessorKey: "selected",
        //you can access a row instance in column definition option callbacks like this

        Cell: PreferredCell,
        maxSize: 150,
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
      ...(selectedTabIdx !== 2
        ? [
            {
              header: "",
              accessorKey: "lookup",
              Cell: LookUpCell,
              maxSize: 60,
            },
          ]
        : []),
    ];
    setColDefs(cols);
    _dataObj = result;
    setData(result);
    setCSVFilename(`Completed_Job_${_jobId}`);
    setIsFormLoaded(true);
  }

  const updateDD = async () => {
    handleExportData("updateDD");
  };

  const handleExportData = async (action) => {
    console.log("handleExport Action", action);
    let _data = data;
    const transformedData = await transformData(_data);

    //get original redcap data dictionary data and update it
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("form", _redcapFormName);

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
      .then(async (result) => {
        //update field_annotation with the preferred value id
        let jsonResult = JSON.parse(result);
        // Loop through the first array of objects
        // Wrap the for loops in a Promise
        const loopPromise = new Promise((resolve, reject) => {
          for (let i = 0; i < transformedData.length; i++) {
            console.log("transformeddata", transformedData);
            // Loop through the second array of objects
            for (let j = i; j < jsonResult.length; j++) {
              // console.log(
              //   transformedData[i]["Field Name"] + ' : ' +  jsonResult[j]["field_name"]
              // );
              //TODO - this if statement needs to be modified to account for the field_names for drop-downs and radio buttons. The fields name currently take the only one that exists and appends an incrementing integer starting at 0
              //for example - if the field_name members_num is a dropdown and has 5 options. The first option will get a field_name of members_num_0. We need account for this in storing the field_annotations. Perhaps a solution is be using the key but also by
              //checking if it's a radio or dropdown and then checking if those are equal
              if (
                transformedData[i]["Form Name"] ===
                  jsonResult[j]["form_name"] &&
                transformedData[i]["Field Name"] === jsonResult[j]["field_name"]
              ) {
                console.log("we matched");
                // If matched, update "field_annotation" in the second array with "Field Annotation" from the first array
                jsonResult[j]["field_annotation"] = {
                  vocab: transformedData[i]["Vocab"],
                  fieldAnnotations: transformedData[i]["Field Annotations"],
                };

                jsonResult[j]["standard_concept"] =
                  transformedData[i]["Standard Concept"];
                jsonResult[j]["concept_class_id"] =
                  transformedData[i]["Concept Class ID"];
                jsonResult[j]["domain_id"] = transformedData[i]["Domain ID"];
                break;
              } else {
                console.log("we did not match");
                // console.log('no match on', transformedData[i]["Field Name"])
                jsonResult[j]["standard_concept"] = "";
                jsonResult[j]["concept_class_id"] = "";
                jsonResult[j]["domain_id"] = "";
              }
            }
          }
          resolve(); // Resolve the promise after the loops finish
        });

        await loopPromise;
        // Convert the results array to CSV format using papaparse
        console.log("jsonResult!", jsonResult);
        // Convert nested objects to JSON strings before converting to CSV
        const stringifiedData = jsonResult.map((item) => ({
          ...item,
          field_annotation: JSON.stringify(item.field_annotation),
        }));
        if (action === "downloadExcel") {
          console.log("downloadExcel!");
          const csvData = Papa.unparse(stringifiedData);
          // const csvData = Papa.unparse(jsonResult);
          // Create a Blob from the CSV data
          const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

          // Use FileSaver to save the generated CSV file
          saveAs(blob, `${csvFilename}.csv`);
          // csvExporter.generateCsv(jsonResult);
        } else if (action === "updateDD") {
          console.log("update DD in REDCap");
        }
      })
      .catch((error) => {
        console.error("error", error);
        setAlertSeverity("error");
        setAlertMessage(
          "Error during export. Make sure connection to REDCap is working."
        );
        setSnackbarOpen(true);
        setTimeout(() => {
          setSnackbarOpen(false);
        }, 5000);
      });

    //remove zeroes from csv
    // _data.forEach(function (obj) {
    //   keys.forEach(function (key) {
    //     if (!obj[key]) obj[key] = "";
    //   });
    // });
  };

  function transformData(data) {
    return data.map((item) => {
      const { redcapFieldLabel, snomedID, snomedText, extraData } = item;
      // console.log("extraData", extraData);
      return {
        // ...rest,
        "Form Name": _redcapFormName,
        "Field Name": extraData.field_name,
        "Field Label": redcapFieldLabel,
        "Field Annotations": snomedID,
        "SNOMED Name": snomedText,
        "Domain ID": extraData.domain_id,
        "Concept Class ID": extraData.concept_class_id,
        "Standard Concept": extraData.standard_concept,
        Vocab: extraData.vocabulary_id,
        // ...extraData,
      };
    });
  }

  function resetScreen() {
    setData("");
    setIsFormLoaded(false);
    setJobId();
  }

  function saveFile() {
    setIsSaving(true);
    const dataString = JSON.stringify(tempAllData);
    storeJobVerificationInfo(dataString);
  }

  function submitToProcess() {
    // Convert the data object to a JSON string before storing it in local storage
    const dataString = JSON.stringify(data);
    // Store the dataString in local storage with the key "myData"
    storeJobCompleteInfo(dataString);

    const filteredData = data.reduce((acc, obj) => {
      if (obj.selected && obj.verified) {
        acc.push({
          redcapFieldLabel: obj.redcapFieldLabel,
          redcapFieldName: obj.extraData.field_name,
          snomedID: obj.snomedID,
          snomedText: obj.snomedText,
          lookup: obj.lookup,
        });
      } else {
        const subRows = obj.subRows
          .filter((subObj) => subObj.selected && subObj.verified)
          .map((subObj) => ({
            redcapFieldLabel: subObj.redcapFieldLabel,
            redcapFieldName: subObj.extraData.field_name,
            snomedID: subObj.snomedID,
            snomedText: subObj.snomedText,
            lookup: subObj.lookup,
          }));
        if (subRows.length > 0) {
          acc.push(...subRows);
        }
      }
      return acc;
    }, []);

    // setFinalData(JSON.stringify(filteredData, null, 2));

    //submit to lookup redcap embeddings process
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var formdata = new FormData();
    formdata.append("data", JSON.stringify(filteredData));
    formdata.append("selectedForm", "lookupEmbeddings");
    formdata.append("dataLength", filteredData.length);
    formdata.append("lookup", true);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/submitJobVerify`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setSnackbarOpen(true);
        setAlertSeverity("success");
        setAlertMessage(
          "Success! You have submitted these mappings. These will be used to improve future job processing."
        );
        setTimeout(() => {
          setSnackbarOpen(false);
        }, 5000);
      })
      .catch((error) => {
        console.error("error", error);
        setAlertSeverity("error");
        setAlertMessage(
          "Error occurred during submission. Please try again later."
        );
        setSnackbarOpen(true);
        setTimeout(() => {
          setSnackbarOpen(false);
        }, 5000);
      });
  }

  async function showTab(e, switching, panelIndex) {
    // setIsLoading(true);
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

  const handleSetTempAllData = (data) => {
    setTempAllData(data);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleTextFieldChange = (event) => {
    setSearchUMLSValue(event.target.value);
  };

  return (
    <>
      <CssBaseline />
      <Container sx={{ margin: "auto", minWidth: "75%", maxWidth: "1400px" }}>
        <MyAccountNavBar
          props={props}
          username={username}
          name={name}
          role={role}
          view={view}
          setView={setView}
        />
        {!view && (
          <Container
            className="whatthe"
            component="main"
            maxWidth="100vw"
            sx={{ margin: "0px", padding: "0px" }}
          >
            <div style={{ textAlign: "left" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px",
                }}
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
                    <Typography
                      id="modal-modal-title"
                      variant="h6"
                      component="h2"
                    >
                      Search UMLS
                    </Typography>
                    <form onSubmit={ (event) => searchUMLS(searchUMLSValue, event)}>
                      <TextField
                        id="outlined-basic"
                        label="UMLS Text Search"
                        variant="outlined"
                        value={searchUMLSValue}
                        onChange={handleTextFieldChange}
                        sx={{ marginTop: "10px" }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => searchUMLS(searchUMLSValue)}
                              >
                                <ArrowRightAltIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </form>
                    {/* <Button
             variant="contained"
             sx={{ marginLeft: "15px", marginTop: "20px" }}
             onClick={() => searchUMLS(searchUMLSValue)}
           >
             Search
           </Button> */}
                    <Divider />
                    <br />
                    {searchingUMLS ? (
                      <CircularProgress />
                    ) : (
                      umlsResultsData.length > 0 && (
                        <UMLSSearchBasicTable
                          umlsResults={umlsResultsData}
                          modalRowData={modalRowData}
                          setModalRowData={setModalRowData}
                          data={data}
                          tempAllData={tempAllData}
                          setTempAllData={setTempAllData}
                          handleSetTempAllData={handleSetTempAllData}
                          verifyRow={verifyRow}
                          showTab={showTab}
                          selectedTabIdx={selectedTabIdx}
                          setData={setData}
                          buildTable={buildTable}
                          storeJobVerificationInfo={storeJobVerificationInfo}
                          setLookupModalOpen={setLookupModalOpen}
                        />
                      )
                    )}
                  </Box>
                </Modal>

                {allVerified ? <VerifiedIcon /> : <UnpublishedIcon />}
                <Typography>
                  Verified {verifiedRecords}/{totalRecords}
                </Typography>

                {selectedTabIdx === 2 && (
                  <Tooltip
                    title={
                      "This will submit your below verified mappings to the internal collection to be used for future jobs. The aim for this is to improve future suggestions using verified mappings"
                    }
                  >
                    <Button
                      sx={{}}
                      variant="contained"
                      color="primary"
                      component="label"
                      startIcon={<AddTaskIcon />}
                      onClick={(e) => submitToProcess(e)}
                    >
                      Approve the Below Mappings
                    </Button>
                  </Tooltip>
                )}
                <Divider sx={{ margin: "30px" }} />
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
                  updateDD={updateDD}
                  resetScreen={resetScreen}
                  // saveSuccess={saveSuccess}
                  isSaving={isSaving}
                  saveFile={saveFile}
                  selectedTabIdx={selectedTabIdx}
                />

                <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={5000}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <Alert
                    onClose={handleClose}
                    severity={alertSeverity}
                    variant="filled"
                  >
                    {alertMessage}
                  </Alert>
                </Snackbar>
                {/* <Typography>{finalData}</Typography> */}
              </>
            )}
          </Container>
        )}
      </Container>
    </>
  );
}
