import React from "react";
import Container from "@mui/material/Container";
import { useState, useEffect, useMemo, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import CompletedJobTable from "../components/CompletedJobTable";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Typography,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
} from "@mui/material";
import PropTypes from "prop-types";
import CloseIcon from "@mui/icons-material/Close";
import AddTaskIcon from "@mui/icons-material/AddTask";
import CheckIcon from "@mui/icons-material/Check";
// import UnpublishedIcon from "@mui/icons-material/Unpublished";
// import VerifiedIcon from "@mui/icons-material/Verified";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import Skeleton from "@mui/material/Skeleton";
import SearchIcon from "@mui/icons-material/Search";
import Modal from "@mui/material/Modal";
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
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import { getJobVerificationInfo } from "../utils/helperFunctions";
import { useLists } from "../components/ListsContext";

export default function CompletedJobsViewPage(props) {
  const [data, setData] = useState("");
  const [tempAllData, setTempAllData] = useState("");
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [jobId, setJobId] = useState();
  const [csvFilename, setCSVFilename] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [verifiedRecords, setVerifiedRecords] = useState(0);
  // const [allVerified, setAllVerified] = useState(false);
  const [value, setValue] = useState(0);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [directMapModalOpen, setDirectMapModalOpen] = useState(false);
  const [searchUMLSValue, setSearchUMLSValue] = useState("");
  const [umlsResultsData, setUMLSResultsData] = useState([]);
  const [modalRowData, setModalRowData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [searchingUMLS, setSearchingUMLS] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const { view, setView } = useContext(ViewContext);
  const [submittedBy, setSubmittedBy] = useState("");
  const [jobName, setJobName] = useState("");

  const { setIsValidChecked } = useLists();

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

  const handleLookupModalOpen = () => setLookupModalOpen(true);
  const handleLookupModalClose = () => setLookupModalOpen(false);

  const handleDirectMapModalOpen = () => setDirectMapModalOpen(true);
  const handleDirectMapModalClose = () => setDirectMapModalOpen(false);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const location = useLocation();
  const _jobId = useRef(null);
  const _data = useRef(null);
  const _redcapFormName = useRef(null);
  // let _jobId, _data, _redcapFormName;

  let _dataObj;
  const columns = useMemo(() => colDefs, [colDefs]);

  useEffect(() => {
    // console.log("allverified", allVerified);
    let jobInfo;
    // console.log("location?", location.state);
    if (location && location.state && location.state.jobId) {
      _jobId.current = location.state.jobId;
      _data.current = location.state.result;
      setJobName(location.state.jobName);
      setSubmittedBy(location.state.submittedBy);
      _redcapFormName.current = location.state.redcapFormName;

      determineTableData();
      return;
    }

    if (localStorage.getItem("jobInfo"))
      jobInfo = JSON.parse(localStorage.getItem("jobInfo"));

    if (!jobInfo) return;
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobReturnData?jobID=${jobInfo.jobId}`,
      requestOptions
    )
      .then((response) => response.text())
      .then(async (result) => {
        setView("Completed Jobs");
        setJobId(jobInfo.jobId);

        _jobId.current = jobInfo.jobId;
        _data.current = result;
        setJobName(jobInfo.jobName);
        setSubmittedBy(jobInfo.submittedBy);
        _redcapFormName.current = jobInfo.redcapFormName;
        determineTableData();
      })

      .catch((error) => console.log("error", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (tempAllData) {
      showTab(null, true, selectedTabIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempAllData]);

  function searchUMLS(text, event) {
    if (event) event.preventDefault();
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

  async function determineTableData() {
    let jobVerificationData = await getJobVerificationInfo(
      _jobId.current,
      _redcapFormName.current,
      props.token
    );
    // console.log("job verfiy data", jobVerificationData);

    if (jobVerificationData) {
      if (_jobId.current) setJobId(_jobId.current);
      buildTable(JSON.parse(jobVerificationData.jobData), true);
      setTempAllData(JSON.parse(jobVerificationData.jobData));
    } else if (_data.current) {
      // console.log('_datacurrent', _data.current)
      if (_jobId.current) setJobId(_jobId.current);
      buildTable(JSON.parse(_data.current), false);
    }
    // })
    // .catch((error) => {
    // console.error("error", error);
    //       if (_jobId.current) setJobId(_jobId.current);
    //       //on an error reading from the db just load a new blank job
    //       if (_data.current) buildTable(JSON.parse(_data.current), false);
    // }
  }

  function storeJobVerificationInfo(dataString) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);
    myHeaders.append("Content-Type", "application/json");

    var data = {
      formName: _redcapFormName.current,
      jobId: _jobId.current,
      jobData: dataString,
    };

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
    formdata.append("jobId", _jobId.current);
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
      let fieldLabel, fieldName, rowFieldLabel, rowFieldName;
      if (jobName === "customText") {
        fieldLabel = item.extraData.name;
        fieldName = item.extraData.name;
        rowFieldLabel = row.extraData.name;
        rowFieldName = row.extraData.name;
      } else {
        fieldLabel = item.redcapFieldLabel;
        fieldName = item.extraData.field_name;
        rowFieldLabel = row.redcapFieldLabel;
        rowFieldName = row.extraData.field_name;
      }

      //removing the pref
      if (removePref) {
        if (fieldLabel === rowFieldLabel && fieldName === rowFieldName) {
          //increment counter only if row has not been verified previously
          if (item.verified === true && !fromModal) {
            // Update both verifiedRecords and totalRecords using functional updates
            setVerifiedRecords((prevVerifiedRecords) => {
              const updatedVerifiedRecords = prevVerifiedRecords - 1;

              // Use functional update to access the latest value of totalRecords
              setTotalRecords((prevTotalRecords) => {
                if (updatedVerifiedRecords === prevTotalRecords) {
                  // setAllVerified(true);
                } else {
                  // setAllVerified(false);
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
        if (fieldLabel === rowFieldLabel && fieldName === rowFieldName) {
          //increment counter only if row has not been verified previously
          if (item.verified === false && !fromModal) {
            // Update both verifiedRecords and totalRecords using functional updates
            setVerifiedRecords((prevVerifiedRecords) => {
              const updatedVerifiedRecords = prevVerifiedRecords + 1;

              // Use functional update to access the latest value of totalRecords
              setTotalRecords((prevTotalRecords) => {
                if (updatedVerifiedRecords === prevTotalRecords) {
                  // setAllVerified(true);
                } else {
                  // setAllVerified(false);
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

  function buildTable(_data, dbFlag, lookupFlag) {
    let result = [];
    let currentRedcapFieldLabel = null;
    let currentRedcapFieldName = null;
    let currentItem = null;
    //create verified and selected keys if first time
    if (!dbFlag) {
      _data.forEach((item, index) => {
        let fieldLabel, fieldName;
        // console.log("the item", item);
        if (!item.redcapFieldLabel) fieldLabel = item.extraData.name;
        else fieldLabel = item.redcapFieldLabel;

        if (!item.extraData.field_name) fieldName = item.extraData.name;
        else fieldName = item.extraData.field_name;

        if (
          fieldLabel !== currentRedcapFieldLabel ||
          fieldName !== currentRedcapFieldName
        ) {
          if (currentItem) {
            result.push(currentItem);
          }
          item.selected = false;
          item.verified = false;
          currentItem = { ...item, subRows: [] };

          currentRedcapFieldLabel = fieldLabel;
          currentRedcapFieldName = fieldName;
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
          // setAllVerified(true);
        } else {
          // setAllVerified(false);
        }
        setVerifiedRecords(verifiedCount);
      });
      // console.log("a result", result);
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
        // setAllVerified(true);
      } else {
        // setAllVerified(false);
      }
      setVerifiedRecords(verifiedCount);

      // console.log("a result 2", result);
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

    function CustomDirectMap(row) {
      setModalRowData(row.original);
      setSearchUMLSValue(row.original.redcapFieldLabel);
      searchUMLS(row.original.redcapFieldLabel);
      handleDirectMapModalOpen();
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

    const CustomDirectMapCell = ({ cell, row }) => {
      if (row.original.subRows) {
        return (
          <Tooltip title="Custom Direct Map">
            <div
              onClick={() => CustomDirectMap(row)}
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
              <DashboardCustomizeIcon />
            </div>
          </Tooltip>
        );
      }
    };
    let cols;
    // console.log("redcap", _redcapFormName);
    if (_redcapFormName.current === "customText") {
      cols = [
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
          header: "Name",
          accessorKey: "extraData.name",
        },
        // {
        //   header: "REDCap Field Label",
        //   accessorKey: "redcapFieldLabel",
        //   Cell: ({ cell, row }) => {
        //     const redcapField = cell.getValue();
        //     if (row.original.lookup) {
        //       return (
        //         <>
        //           <PersonAddAltIcon />
        //           {redcapField}
        //         </>
        //       );
        //     } else {
        //       return redcapField;
        //     }
        //   },
        // },

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
        ...(selectedTabIdx !== 2
          ? [
              {
                header: "",
                accessorKey: "directMap",
                Cell: CustomDirectMapCell,
                maxSize: 60,
              },
            ]
          : []),
      ];
    } else {
      cols = [
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
        ...(selectedTabIdx !== 2
          ? [
              {
                header: "",
                accessorKey: "directMap",
                Cell: CustomDirectMapCell,
                maxSize: 60,
              },
            ]
          : []),
      ];
    }

    setColDefs(cols);
    _dataObj = result;
    setData(result);
    setCSVFilename(`Completed_Job_${_jobId.current}`);
    setIsFormLoaded(true);
  }

  const updateDD = async () => {
    handleExportData("updateDD");
  };

  const handleExportData = async (action) => {
    let _data = data;
    console.log("export data", _data);
    const transformedData = await transformData(_data);
    console.log("transformed data", transformedData);
    //get extra redcap data for export unless we are just outputting table on screen
    if (action !== "simpleTable") {
      var myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + props.token);

      var formdata = new FormData();
      formdata.append("form", _redcapFormName.current);
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
              for (let j = 0; j < jsonResult.length; j++) {
                const formNameMatches =
                  transformedData[i]["Form Name"] ===
                  jsonResult[j]["form_name"];
                const fieldNameMatches =
                  transformedData[i]["Field Name"] ===
                  jsonResult[j]["field_name"];
                const extraFieldNameMatches =
                  transformedData[i].extraData.og_field_name ===
                  jsonResult[j]["field_name"];

                if (
                  formNameMatches &&
                  (fieldNameMatches || extraFieldNameMatches)
                ) {
                  // console.log("matched on ", transformedData[i]["Field Name"]);

                  // Handle extra data if present
                  // const extraData = transformedData[i].extraData;
                  // let parsed = false;
                  // if (extraData.og_field_name && extraData.og_field_name_key) {
                  //   //indicate this was a parsed result from dropdown or radio selection
                  //   parsed = true;
                  // }

                  //set parsed field name as the key so not to overwrite existing data
                  let fn = transformedData[i]["Field Name"];
                  // console.log("json result", jsonResult[j]);
                  // console.log("fn value", jsonResult[j].field_annotation);
                  // console.log("type of", typeof jsonResult[j].field_annotation);

                  // Check if field_annotation is a string aka data already stored in DD
                  if (typeof jsonResult[j].field_annotation === "string") {
                    // If it's a string, replace it with a new object
                    // I have a feeling this could be logically problematic. We want to likely not include any stored field_annotations in the DD at this point. This seems to not include, but very awkwardly.
                    jsonResult[j].field_annotation = {
                      [fn]: transformedData[i],
                    };
                    // console.log("json result after insert string", jsonResult[j]);
                  } else {
                    // If it's an object, merge with the existing object
                    jsonResult[j].field_annotation = {
                      ...jsonResult[j].field_annotation,
                      [fn]: transformedData[i],
                    };
                  }
                  break;
                } else {
                  // console.log("no match on", transformedData[i]["Field Name"]);
                  // Reset unmatched fields
                  // Object.assign(jsonResult[j], {
                  //   standard_concept: "",
                  //   concept_class_id: "",
                  //   domain_id: "",
                  // });
                }
              }
            }

            resolve(); // Resolve the promise after the loops finish
          });

          await loopPromise;
          // Convert the results array to CSV format using papaparse
          // console.log("jsonResult!", jsonResult);
          // Convert nested objects to JSON strings before converting to CSV
          const stringifiedData = jsonResult.map((item) => ({
            ...item,
            field_annotation: JSON.stringify(item.field_annotation),
          }));
          if (action === "downloadExcel" || action === "downloadUpload") {
            // console.log("downloadExcel!");
            const csvData = Papa.unparse(stringifiedData);
            // const csvData = Papa.unparse(jsonResult);
            // Create a Blob from the CSV data
            const blob = new Blob([csvData], {
              type: "text/csv;charset=utf-8;",
            });

            // Use FileSaver to save the generated CSV file
            saveAs(blob, `${csvFilename}.csv`);
            // csvExporter.generateCsv(jsonResult);
          } else if (action === "updateDD") {
            // console.log("update DD in REDCap");
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
    } else {
      // Assuming 'data' is your original data array
      function flattenData(data) {
        let flattened = [];
        data.forEach((item) => {
          // Add the current item
          flattened.push(item);
          // Check if there are subRows and handle them
          if (item.subRows && Array.isArray(item.subRows)) {
            item.subRows.forEach((subRow) => {
              // Here, you may want to combine 'subRow' with some of 'item's data
              // Or just push 'subRow' as is, depending on your requirements
              flattened.push(subRow);
            });
          }
        });
        return flattened;
      }

      const flattenedData = flattenData(transformedData);
      console.log("flat data", flattenedData);
      // Now 'flattenedData' can be passed to PapaParse
      const csvData = Papa.unparse(flattenedData);

      // Proceed with the Blob and FileSaver logic as before
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `table_${csvFilename}.csv`);
    }
    //remove zeroes from csv
    // _data.forEach(function (obj) {
    //   keys.forEach(function (key) {
    //     if (!obj[key]) obj[key] = "";
    //   });
    // });
  };

  function transformData(data, isSubRow = false) {
    return data.flatMap((item) => {
      const {
        redcapFieldLabel,
        snomedID,
        snomedText,
        extraData,
        subRows,
        similarity,
      } = item;
      console.log("redcapformname'", _redcapFormName)
      
      // Structure to return for both top-level and subRow items
      const transformedItem = {
        "Form Name":  _redcapFormName.current, // Adjusted to indicate this might be a variable outside the function
        "Field Name": extraData.field_name,
        "Field Label": redcapFieldLabel || extraData.name,
        "Field Annotations": snomedID,
        Similarity: similarity,
        "SNOMED Name": snomedText,
        "Domain ID": extraData.domain_id,
        "Concept Class ID": extraData.concept_class_id,
        "Standard Concept": extraData.standard_concept,
        Vocab: extraData.vocabulary_id,
        extraData: extraData
      };

      // Directly appending transformed subRows to the main array
      let itemsToReturn = [transformedItem];
      if (Array.isArray(subRows)) {
        const transformedSubRows = transformData(subRows, true); // Pass true to indicate these are subRow items
        itemsToReturn = itemsToReturn.concat(transformedSubRows);
      }

      return itemsToReturn;
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
    setIsValidChecked(false);
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

  const omopTables = [
    "person",
    "observation_period",
    "visit_occurrence",
    "visit_detail",
    "condition_occurrence",
    "drug_exposure",
    "procedure_occurrence",
    "device_exposure",
    "measurement",
    "observation",
    "note",
    "note_nlp",
    "specimen",
    "fact_relationship",
    "survey_conduct",
  ];

  const [selectedOMOPTable, setSelectedOMOPTable] = useState(omopTables[0]);
  // const [lookUpDupe, setLookUpDupe] = useState(omopTables[0]);

  const handleDirectMapSubmit = (formData, removePref) => {
    // Handle submit
    // console.log(selectedOMOPTable);
    // console.log("row", modalRowData);
    // console.log("formdta", formData);
    // function verifyRow(row, removePref) {
    // let newModalRowData = modalRowData;
    let newModalSubRowData = modalRowData.subRows;
    // const modifiedSubRows = newModalSubRowData;
    const modifiedSubRows = newModalSubRowData.filter(
      (object) => !object.lookup
    ); //remove existing lookups from
    // setLookUpDupe(false);

    // for (const obj of modifiedSubRows) {
    //   console.log('obj', obj)
    //   if (obj.snomedID === row.ui || newModalRowData.snomedID === row.ui) {
    //     setLookUpDupe(true);
    //     return;
    //   }
    // }
    // setLookUpDupe(false);
    let newSubRow = {
      redcapFieldLabel: modalRowData.redcapFieldLabel,
      extraData: {
        field_name: modalRowData.extraData.field_name,
        domain_id: formData,
        concept_class: "",
        vocabulary_id: "Custom/Direct",
      },
      snomedText: "",
      snomedID: "",
      selected: true,
      verified: true,
      lookup: true,
    };
    modifiedSubRows.push(newSubRow);

    const updatedModalRowData = {
      ...modalRowData,
      subRows: modifiedSubRows,
    };
    setModalRowData(updatedModalRowData);
    let tableData = tempAllData;
    const newArray = tableData.map((item) => {
      if (
        item.redcapFieldLabel === updatedModalRowData.redcapFieldLabel &&
        item.extraData.field_name === updatedModalRowData.extraData.field_name
      ) {
        return updatedModalRowData;
      }
      return item;
    });
    buildTable(newArray, true, true);
    storeJobVerificationInfo(JSON.stringify(newArray));
    // console.log("newarray to store", newArray);
    setDirectMapModalOpen(false);
    handleSetTempAllData(newArray);
    verifyRow(newSubRow, false, true);
    //count and update selected and verified records
    newArray.map((item) => {
      return null;
    });
    // }
  };

  return (
    <>
      <CssBaseline />
      <Container sx={{ margin: "auto", minWidth: "95%" }}>
        <MyAccountNavBar
          props={props}
          username={username}
          name={name}
          role={role}
          view={view}
          setView={setView}
        />
        {view && (
          <Grid
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
                  <b>Job Name:</b> {jobName}
                </span>
                <span style={{ marginRight: "10px" }}>
                  <b>Completed Job ID:</b> {jobId ? jobId : "No Job ID"}
                </span>
                <span style={{ marginRight: "10px" }}>
                  <b>Submitted By:</b> {submittedBy}
                </span>
                {selectedTabIdx === 2 && (
                  <Tooltip
                    title={
                      "This will submit your below verified mappings to the internal collection to be used for future jobs. The aim for this is to improve future suggestions using user verified mappings"
                    }
                  >
                    <Button
                      sx={{}}
                      variant="contained"
                      color="info"
                      component="label"
                      startIcon={<AddTaskIcon />}
                      onClick={(e) => submitToProcess(e)}
                    >
                      Submit Verified Mappings
                    </Button>
                  </Tooltip>
                )}
              </span>
            </div>

            {!isFormLoaded && (
              <Skeleton
                variant="rounded"
                sx={{ margin: "auto" }}
                width={"100%"}
                height={"85vh"}
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
                    <form
                      onSubmit={(event) => searchUMLS(searchUMLSValue, event)}
                    >
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

                {/* Direct map modal */}
                <Modal
                  open={directMapModalOpen}
                  onClose={handleDirectMapModalClose}
                  aria-labelledby="modal-modal-title"
                  aria-describedby="modal-modal-description"
                >
                  <Box sx={umlsModalStyle}>
                    <Typography
                      id="modal-modal-title"
                      variant="h6"
                      component="h2"
                    >
                      Direct Map to OMOP
                    </Typography>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>REDCap Field Label</TableCell>
                            <TableCell>OMOP Table</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>{searchUMLSValue}</TableCell>
                            <TableCell>
                              <Select
                                value={selectedOMOPTable}
                                onChange={(e) =>
                                  setSelectedOMOPTable(e.target.value)
                                }
                              >
                                {omopTables.map((table, index) => (
                                  <MenuItem key={index} value={table}>
                                    {table}
                                  </MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  handleDirectMapSubmit(selectedOMOPTable);
                                }}
                              >
                                Submit
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider />
                    <br />
                  </Box>
                </Modal>
                {/* End direct map modal */}

                {/* {allVerified ? <VerifiedIcon /> : <UnpublishedIcon />} */}
                {/* <Typography>
                  Verified {verifiedRecords}/{totalRecords}
                </Typography> */}

                <Divider sx={{ margin: "20px" }} />
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
                  setData={setData}
                  handleExportData={handleExportData}
                  updateDD={updateDD}
                  resetScreen={resetScreen}
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
              </>
            )}
          </Grid>
        )}
      </Container>
    </>
  );
}
