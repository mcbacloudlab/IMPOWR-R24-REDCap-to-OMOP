/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import Grid from "@mui/material/Grid";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddTaskIcon from "@mui/icons-material/AddTask";
// import ImportExportIcon from "@mui/icons-material/ImportExport";
import MaterialTable from "material-react-table";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Delete, Edit } from "@mui/icons-material";
import CollectionList from "../components/CollectionList";
import TransferList from "../components/TransferList";
import SearchIcon from "@mui/icons-material/Search";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
// } from "@mui/material";
import CSVIcon from "../assets/csv.png";
import XLSXIcon from "../assets/xlsx.png";
import Papa from "papaparse";
import CircularProgress from "@mui/material/CircularProgress";

var XLSX = require("xlsx");

export default function CustomText({ props, handleClick }) {
  // console.log("customtext", props);
  let token =
    props.props?.props?.token ??
    props.props?.token ??
    props?.token ??
    props.token;

  const [inputValue, setInputValue] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [data, setData] = useState([]);
  const [openAthenaModal, setOpenAthenaModal] = useState(false);
  const [athenaSearchValue, setAthenaSearchValue] = useState("");
  const [athenaAPIResults, setAthenaAPIResults] = useState([]);
  const [loadingAthenaAPI, setLoadingAthenaAPI] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);
  const [showSubmittedNotifcation, setShowSubmittedNotifcation] =
    useState(false);
  const [selectRowsError, setSelectRowsError] = useState(false);

  const fileInputRef = useRef(null);
  var tableInstanceRef = useRef(null);
  useEffect(() => {
    if (tableInstanceRef.current) {
      setSelectedRows(tableInstanceRef.current.getState().rowSelection);
    }
  }, [tableInstanceRef.current]);

  const columns = React.useMemo(
    () => [
      {
        header: "Actions",
        Cell: ({ row }) => (
          <IconButton onClick={() => handleDelete(row)}>
            <DeleteIcon />
          </IconButton>
        ),
        minSize: 1, //min size enforced during resizing
        maxSize: 1, //max size enforced during resizing
        size: 1, //medium column
        enableEditing: false,
      },
      {
        header: "Name",
        accessorKey: "name",
      },
    ],
    []
  );

  const athenaColumns = React.useMemo(
    () => [
      {
        header: "Concept ID",
        accessorKey: "concept_id",
        enableClickToCopy: true,
      },
      {
        header: "Concept Name",
        accessorKey: "concept_name",
      },
      {
        header: "Domain ID",
        accessorKey: "domain_id",
      },
      {
        header: "Vocabulary ID",
        accessorKey: "vocabulary_id",
      },
      {
        header: "Concept Class ID",
        accessorKey: "concept_class_id",
      },
      {
        header: "Standard Concept",
        accessorKey: "standard_concept",
      },
      {
        header: "Valid Start Date",
        accessorKey: "valid_start_date",
      },
      {
        header: "Valid End Date",
        accessorKey: "valid_end_date",
      },
    ],
    []
  );

  const handleAthenaChange = (event) => {
    console.log("handle change", event.target.value);
    setAthenaSearchValue(event.target.value);
  };

  const handleDelete = (row) => {
    setData((prevData) => prevData.filter((item) => item !== row.original));
  };

  const handleAddClick = () => {
    if (inputValue) {
      setData((prevData) => [...prevData, { name: inputValue }]);
      setInputValue("");
    }
  };

  const handleClearTable = () => {
    setData([]);
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
    formdata.append("selectedForm", "customText");
    formdata.append("dataLength", dataToSendToQueue.length);

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

  const handleDeleteRow = useCallback(
    (row) => {
      // eslint-disable-next-line no-restricted-globals
      if (!confirm(`Are you sure you want to delete ${row.firstName}`)) {
        return;
      }
      //send api delete request here, then refetch or update local table data for re-render
      data.splice(row.index, 1);
      setData([...data]);
    },
    [data]
  );

  const openAthena = () => {
    setOpenAthenaModal(true);
    setAthenaAPIResults([]);
    setAthenaSearchValue("");
  };

  const handleClose = () => {
    setOpenAthenaModal(false);
  };

  const getAthenaData = () => {
    // Call your API using fetch here
    setAthenaAPIResults([]);
    setLoadingAthenaAPI(true);
    console.log("get athena data");
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var formdata = new FormData();
    formdata.append("conceptID", athenaSearchValue);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };
    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/athena/getDataByConceptID`,
      requestOptions
    )
      .then((response) => response.json())
      .then((data) => {
        setLoadingAthenaAPI(false);
        console.log("athena results", data.data);
        setAthenaAPIResults(data.data);
      })
      .catch((error) => {
        console.error("There was an error!", error);
        setLoadingAthenaAPI(false);
      });
  };

  const handleAthenaKeyPress = (event) => {
    if (event.key === "Enter") {
      getAthenaData();
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileContent = await readFile(file);
      const csvText = new TextDecoder().decode(fileContent);
      const results = Papa.parse(csvText, { header: true });
      const formattedData = results.data
        .filter((row) => row.name) // ensures there's data in 'name' column
        .map((row) => ({ name: row.name }));
      setData((prevData) => [...prevData, ...formattedData]);
      fileInputRef.current.value = "";

      console.log("fileinput ref", fileInputRef);
    }
  };

  const handleXLSXUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileContent = await readFile(file);
      const workbook = XLSX.read(fileContent, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const formattedData = jsonData
        .filter((row) => row.name) // ensures there's data in 'name' column
        .map((row) => ({ name: row.name }));
      setData((prevData) => [...prevData, ...formattedData]);
      fileInputRef.current.value = "";
      console.log("fileinput ref", fileInputRef);
    }
  };

  // const MODAL_WIDTH = "600px";
  // const MODAL_HEIGHT = "400px";

  return (
    <>
      <Typography>
        Add your own custom text below to the table to submit to find the most
        related standard terms. Once the job is submitted you can view the
        status and results on the{" "}
        <span
          style={{
            textDecoration: "underline",
            cursor: "pointer",
            color: "blue",
          }}
          onClick={() => handleClick("Jobs Overview")}
        >
          Jobs Overview
        </span>{" "}
        page.
      </Typography>
      <br />
      <Button
        onClick={openAthena}
        variant="contained"
        color="primary"
        sx={{ margin: "10px", marginRight: "60px" }}
      >
        Athena Search
      </Button>
      <Divider />
      <br />
      <span>
        <Typography variant="caption">Import List</Typography>
        <Tooltip
          title={`Import CSV List. Ensure the list is in a column with a header of 'name'`}
          placement="top"
        >
          <span>
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleCSVUpload}
              ref={fileInputRef}
            />
            <Button
              onClick={(e) => {
                e.currentTarget.previousSibling.click();
                e.currentTarget.previousSibling.value = ""; // Reset the file input value
              }}
            >
              <img
                src={CSVIcon}
                alt="Import CSV"
                style={{ width: "32px", height: "32px" }}
              />
            </Button>
          </span>
        </Tooltip>

        <Tooltip
          title={`Import XLSX List. Ensure the list is in a column with a header of 'name'`}
          placement="top"
        >
          <span>
            <input
              type="file"
              accept=".xlsx"
              hidden
              onChange={handleXLSXUpload}
              ref={fileInputRef}
            />
            <Button
              onClick={(e) => {
                e.currentTarget.previousSibling.click();
                e.currentTarget.previousSibling.value = ""; // Reset the file input value
              }}
            >
              <img
                src={XLSXIcon}
                alt="Import XLSX List"
                style={{ width: "32px", height: "32px" }}
              />
            </Button>
          </span>
        </Tooltip>
      </span>
      <TextField
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        label="Add Custom Text"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddClick();
            e.preventDefault(); // Prevents default form submission
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleAddClick}>
                <AddIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {data && (
        <>
          <Button
            onClick={handleClearTable}
            variant="contained"
            color="error"
            sx={{ margin: "10px", marginLeft: "60px" }}
          >
            Clear All
          </Button>
          <br />
          <br />
          {/* ATHENA SEARCH MODAL */}
          <Modal
            open={openAthenaModal}
            onClose={handleClose}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          >
            <div
              style={{
                position: "absolute",
                maxWidth: "90vw",
                maxHeight: "90vh",
                minWidth: "90vw",
                minHeight: "90vh",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "20px",
                backgroundColor: "white",
                outline: "none",
                overflow: "auto", // Adds scroll if content overflows
              }}
            >
              <h3>Athena Search</h3>
              <TextField
                label="Concept ID or Partial Text"
                // fullWidth
                placeholder="Search..."
                variant="outlined"
                onChange={handleAthenaChange}
                onKeyPress={handleAthenaKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon cursor="pointer" onClick={getAthenaData} />
                    </InputAdornment>
                  ),
                }}
              />
              <br />
              <Grid
                container
                justifyContent="center"
                alignItems="center"
                // style={{ height: "100vh" }}
              >
                {loadingAthenaAPI && (
                  <Grid item>
                    <CircularProgress />
                  </Grid>
                )}
              </Grid>

              {/* Show athena results in a table */}
              {athenaAPIResults && athenaAPIResults.length > 0 ? (
                <MaterialTable
                  data={athenaAPIResults}
                  columns={athenaColumns}
                  initialState={{
                    density: "compact",
                    pagination: { pageSize: 10, pageIndex: 0 },
                  }}
                  enablePagination={true}
                  enableClickToCopy
                  muiTablePaginationProps={{
                    // rowsPerPage: [5],
                    rowsPerPageOptions: [5, 10, 25, 50],
                    showFirstButton: true,
                    showLastButton: true,
                  }}
                />
              ) : null}
              {!athenaAPIResults && <h3>No results</h3>}

              {/* End show athena results table */}
            </div>
          </Modal>
          {/* END ATHENA SEARCH MODAL */}

          <Grid container spacing={0}>
            <Grid item xs={12} xl={3}>
              <CollectionList
                token={token}
                setCheckedItems={setCheckedItems}
                checkedItems={checkedItems}
              />
              <TransferList
                props={props}
                setData={setData}
                data={data}
                setColDefs={setColDefs}
                colDefs={colDefs}
              />
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
            <Grid item xs={12} xl={8}>
              <MaterialTable
                title="Names List"
                data={data}
                columns={columns}
                enableColumnResizing
                enableEditing
                editingMode="cell"
                enableColumnOrdering
                options={{
                  selection: true,
                }}
                // enableRowSelection
                tableInstanceRef={tableInstanceRef}
                muiTableBodyRowProps={({ row }) => ({
                  //add onClick to row to select upon clicking anywhere in the row
                  // onClick: row.getToggleSelectedHandler(),
                  // sx: { cursor: "pointer" },
                  onClick: () =>
                    setSelectedRows((prev) => ({
                      ...prev,
                      [row.id]: !prev[row.id],
                    })),
                  selected: selectedRows[row.id],
                  sx: {
                    cursor: "pointer",
                  },
                })}
                renderRowActions={({ row, table }) => (
                  <Box sx={{ display: "flex", gap: "1rem" }}>
                    <Tooltip arrow placement="left" title="Edit">
                      <IconButton onClick={() => table.setEditingRow(row)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip arrow placement="right" title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteRow(row)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              />
            </Grid>
          </Grid>
        </>
      )}

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Tooltip
          title={
            "This will submit your text to a job and return the most similar standard terms."
          }
        >
          <Button
            // sx={{ float: "right" }}
            variant="contained"
            color="success"
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
  );
}
