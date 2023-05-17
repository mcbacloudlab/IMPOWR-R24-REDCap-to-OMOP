import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { useLists } from "./ListsContext";
import { ViewContext } from "./ViewContext";
import MaterialReactTable from "material-react-table";
import Badge from "@mui/material/Badge";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
// import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
// import AutorenewIcon from "@mui/icons-material/Autorenew";
// import ErrorIcon from "@mui/icons-material/Error";

export default function JobsOverview(props) {
  const navigate = useNavigate();

  const { allCompletedList } = useLists();
  const { allPendingList } = useLists();
  const { allFailedList } = useLists();

  const { token } = props.props.props ?? props.props;
  const { setView } = useContext(ViewContext);

  const [open, setOpen] = useState(false);
  const [jobIdSelected, setJobIdSelected] = useState();
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [colDefs, setColDefs] = useState();
  const [tableData, setTableData] = useState(allCompletedList);

  // const handleChange = (event, newValue) => {
  //   setSelectedTabIdx(newValue);
  // };

  useEffect(() => {
    setColDefs(getCols(selectedTabIdx));
    setLoading(true);
    if (selectedTabIdx === 0) setTableData(allCompletedList);
    else if (selectedTabIdx === 1) setTableData(allPendingList);
    else if (selectedTabIdx === 2) setTableData(allFailedList);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCompletedList, allPendingList, allFailedList, selectedTabIdx]);

  async function showTab(e, switching, panelIndex) {
    setLoading(true);
    if (!panelIndex) panelIndex = 0;
    setColDefs(getCols(panelIndex));
    setSelectedTabIdx(panelIndex);

    // if (!switching) handleChange(e, 0); //reset tab to default tab
    //set table data based on panelIndex
    switch (panelIndex) {
      case 0: {
        setTableData(allCompletedList);
        setLoading(false);
        break;
      }
      case 1: {
        setTableData(allPendingList);
        setLoading(false);
        break;
      }
      case 2: {
        setTableData(allFailedList);
        setLoading(false);
        break;
      }

      default: {
        setLoading(false);
        break;
      }
    }
  }

  const handleClickOpen = (jobId) => {
    setJobIdSelected(jobId);
    setOpen(true);
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  const handleClose = (jobId) => {
    setOpen(false);
  };

  const handleConfirm = (jobIdSelected) => {
    setOpen(false);
    cancelJob(jobIdSelected.jobId);
  };

  const cancelJob = (jobId) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var formdata = new FormData();
    formdata.append("jobId", jobId);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/cancelJob`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {})
      .catch((error) => console.log("error", error));
  };

  const CollectionsCell = ({ cell, row }) => {
    console.log("collection", typeof row.original.collectionName);
    console.log(row.original.collectionName);
  
    let resultArray = [];
  
    if (row.original.collectionName) {
      const trimmedString = row.original.collectionName.slice(1, -1);
      const arrayStrings = trimmedString.split("][");
      resultArray = arrayStrings.flatMap((str) => {
        // eslint-disable-next-line no-useless-escape
        const cleanedString = str.replace(/[\[\]']+/g, "").trim();
        return cleanedString.split(",").map((element) => element.trim());
      });
      resultArray.forEach((item) => {
        console.log('item', item);
      });
    }
  
    return (
      <>
        {row.original.collectionName && row.original.totalCollectionDocs !== null
          ? resultArray.map((label, index) => (
              <React.Fragment key={index}>
                <Chip
                  label={label}
                  color="secondary"
                  sx={{ margin: "10px" }}
                />
                <br />
              </React.Fragment>
            ))
          : "N/A"}
      </>
    );
  };
  
  
  

  const CompletedAtCell = ({ cell, row }) => {
    return row.original.finishedAt
      ? new Date(row.original.finishedAt).toLocaleString()
      : "Not Completed Yet";
  };

  const TotalDocumentsCell = ({ cell, row }) => {
    return (
      <Chip
        key={cell.getValue() + row.id}
        label={`${cell.getValue() ? cell.getValue().toLocaleString() : "N/A"}`}
        color="secondary"
        sx={{ margin: "10px" }}
      />
    );
  };

  const ProgressCell = ({ cell, row }) => {
    return (
      <Box display="flex" alignItems="center">
        <Box width="100%" mr={1}>
          <LinearProgress
            variant="determinate"
            value={cell.getValue() ? cell.getValue() : 0}
          />
        </Box>
        <Typography variant="body2">{`${
          cell.getValue() ? cell.getValue() : 0
        }%`}</Typography>
      </Box>
    );
  };

  const getCols = (panelIndex) => {
    const cols = [
      {
        header: "Job ID",
        accessorKey: "jobId",
        maxSize: 100,
      },
      ...(panelIndex === 1 || panelIndex === 2
        ? [
            {
              header: "Progress",
              accessorKey: "progress",
              Cell: ProgressCell,
              minSize: 150,
              maxSize: 150,
            },
          ]
        : []),
      {
        header: "REDCap Form",
        accessorKey: "redcapFormName",
        minSize: 100,
      },
      {
        header: "Collections",
        accessorKey: "collections",
        Cell: CollectionsCell,
        minSize: 300,
      },
      {
        header: "Total Documents",
        accessorKey: "totalCollectionDocs",
        Cell: TotalDocumentsCell,
        minSize: 150,
        maxSize: 150,
      },
      {
        header: "Questions",
        accessorKey: "dataLength",
      },
      {
        header: "Submitted By",
        accessorKey: "submittedBy",
      },
      {
        header: "Completed At",
        accessorKey: "finishedAt",
        Cell: CompletedAtCell,
      },
    ];

    return cols;
  };

  function handleView(job) {
    if (props.setOpen) props.setOpen(false);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobReturnData?jobID=${job.jobId}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setView("");
        navigate("/completed-jobs", {
          state: {
            result: result,
            jobId: job.jobId,
            submittedBy: job.submittedBy,
            jobName: job.jobName,
            redcapFormName: job.redcapFormName,
          },
        });
      })
      .catch((error) => console.log("error", error));
  }

  return (
    <div>
      <h1
        style={{
          paddingLeft: "20px",
          textAlign: "center",
        }}
      >
        All Jobs Overview
      </h1>

      {!loading && (
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={12}>
            {!loading && (
              <>
                <Tabs
                  centered
                  value={selectedTabIdx}
                  aria-label="basic tabs example"
                >
                  <Tab
                    key="completed"
                    onClick={(event) => showTab(event, true, 0)}
                    label={
                      <Box sx={{ position: "relative", margin: "20px" }}>
                        Completed
                        {/* <PlaylistAddCheckSharpIcon /> */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: "-20px", // Adjust the right position of the badge
                          }}
                        >
                          <Badge
                            badgeContent={
                              allCompletedList ? allCompletedList.length : "0"
                            }
                            max={9999}
                            color="secondary"
                          />
                        </Box>
                      </Box>
                    }
                    {...a11yProps(0)}
                  />
                  <Tab
                    key="pending"
                    onClick={(event) => showTab(event, true, 1)}
                    label={
                      <>
                        <Box sx={{ position: "relative", margin: "20px" }}>
                          Pending
                          {/* <AutorenewIcon /> */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: "-20px", // Adjust the right position of the badge
                            }}
                          >
                            <Badge
                              badgeContent={
                                allPendingList ? allPendingList.length : "0"
                              }
                              max={9999}
                              color="secondary"
                            />
                          </Box>
                        </Box>
                      </>
                    }
                    {...a11yProps(1)}
                  />
                  <Tab
                    key="failed"
                    onClick={(event) => showTab(event, true, 2)}
                    label={
                      <Box sx={{ position: "relative", margin: "20px" }}>
                        Failed
                        {/* <ErrorIcon /> */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: "-20px", // Adjust the right position of the badge
                          }}
                        >
                          <Badge
                            badgeContent={
                              allFailedList ? allFailedList.length : "0"
                            }
                            max={9999}
                            color="secondary"
                          />
                        </Box>
                      </Box>
                    }
                    {...a11yProps(2)}
                  />
                </Tabs>
                <Dialog open={open} onClose={handleClose}>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      <Typography
                        color="error"
                        component="span"
                        variant="inherit"
                      >
                        Remove
                      </Typography>{" "}
                      <b>{jobIdSelected ? jobIdSelected.jobId : ""}</b>?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClose} color="primary">
                      No
                    </Button>
                    <Button
                      onClick={() => handleConfirm(jobIdSelected)}
                      color="primary"
                      autoFocus
                    >
                      Yes
                    </Button>
                  </DialogActions>
                </Dialog>
                <MaterialReactTable
                  key={selectedTabIdx}
                  //passing the callback function variant. (You should get type hints for all the callback parameters available)
                  columns={colDefs}
                  data={tableData}
                  enableDensityToggle={false} //density does not work with memoized cells
                  memoMode="cells" // memoize table cells to improve render performance, but break some features
                  enableBottomToolbar={true}
                  enableGlobalFilterModes={true}
                  enablePagination={true}
                  enableRowActions={true}
                  {...(selectedTabIdx === 0 && {
                    renderRowActions: ({ row, table }) => [
                      <Box
                        key={row.id + selectedTabIdx + "completed"}
                        sx={
                          {
                            // display: "flex",
                            // flexWrap: "nowrap",
                            // gap: "0px",
                          }
                        }
                      >
                        <Tooltip title="View" placement="left">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              handleView(row.original);
                            }}
                          >
                            <SummarizeIcon />
                          </IconButton>
                        </Tooltip>
                        <br />
                        <Tooltip title="Remove" placement="left">
                          <IconButton
                            color="error"
                            onClick={() => {
                              handleClickOpen(row.original);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>,
                    ],
                  })}
                  {...(selectedTabIdx === 1 && {
                    renderRowActions: ({ row, table }) => [
                      <Box
                        key={row.id + selectedTabIdx + "pending"}
                        sx={{
                          display: "flex",
                          flexWrap: "nowrap",
                          gap: "8px",
                        }}
                      >
                        <Tooltip title="Remove" placement="left">
                          <IconButton
                            color="error"
                            onClick={() => {
                              handleClickOpen(row.original);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>,
                    ],
                  })}
                  {...(selectedTabIdx === 2 && {
                    renderRowActions: ({ row, table }) => [
                      <Box
                        key={row.id + selectedTabIdx + "failed"}
                        sx={{
                          display: "flex",
                          flexWrap: "nowrap",
                          gap: "8px",
                        }}
                      >
                        <Tooltip title="Remove" placement="left">
                          <IconButton
                            color="error"
                            onClick={() => {
                              handleClickOpen(row.original);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>,
                    ],
                  })}
                  // {...(selectedTabIdx === 2 ? {} : { enableExpanding: true })}
                  RowProps={{ sx: { marginBottom: "10px" } }}
                  // enableRowNumbers
                  // enableRowVirtualization
                  muiTableContainerProps={{
                    sx: {
                      maxWidth: "100vw",
                      maxHeight: "50vh",
                    },
                  }}
                  // onSortingChange={setSorting}
                  initialState={{
                    density: "compact",
                    // pagination: { pageSize: 50, pageIndex: 0 },
                  }}
                  enableColumnResizing={true}
                  enableSorting={true}
                  enableStickyHeader
                  muiTableProps={{
                    sx: {
                      borderCollapse: "separate",
                      borderSpacing: "0 10px", // set the desired space between rows
                    },
                  }}
                  muiTablePaperProps={{
                    elevation: 2, //change the mui box shadow
                    //customize paper styles
                    sx: {
                      borderRadius: "0",
                      border: "1px solid #e0e0e0",
                    },
                  }}
                  muiTableBodyProps={{
                    sx: {
                      "& .subrow": {
                        backgroundColor: "pink",
                      },
                    },
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
                  positionToolbarAlertBanner="bottom"
                  renderTopToolbarCustomActions={({ table }) => (
                    <Box
                      width="100%"
                      sx={{
                        display: "flex",
                        gap: "1rem",
                        p: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box style={{ marginLeft: "auto" }}></Box>
                    </Box>
                  )}
                />
              </>
            )}
          </Grid>
        </Grid>
      )}
    </div>
  );
}
