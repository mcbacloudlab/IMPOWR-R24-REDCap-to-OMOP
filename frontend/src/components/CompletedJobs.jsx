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
  Tooltip,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { useLists } from "./ListsContext";
import { ViewContext } from "./ViewContext";
import MaterialReactTable from "material-react-table";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Badge from "@mui/material/Badge";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ErrorIcon from "@mui/icons-material/Error";

export default function CompletedJobs(props) {
  // const { completedList } = props.props.props ?? props.props;
  const { completedList } = useLists();
  const { token } = props.props.props ?? props.props;
  const { setView } = useContext(ViewContext);

  // console.log('token?', token)
  // const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState(
    completedList?.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    })) || []
  );

  // const [columns, setColumns] = useState([]);

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [jobIdSelected, setJobIdSelected] = useState();
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  // const [sorting, setSorting] = useState();
  const [colDefs, setColDefs] = useState();

  const handleChange = (event, newValue) => {
    setSelectedTabIdx(newValue);
  };
  async function showTab(e, switching, panelIndex) {
    // setIsLoading(true);
    // setSelectedFile(value);
    if (!panelIndex) panelIndex = 0;
    setSelectedTabIdx(panelIndex);
    if (!switching) handleChange(e, 0); //reset tab to default tab
    //set table data based on panelIndex
    switch (panelIndex) {
      case 0: {
        // setTableData(allUsers);
        break;
      }
      case 1: {
        // setUnverifiedElements(unverifiedElements.length)
        // setTableData(pendingUsers);
        break;
      }
      case 2: {
        break;
      }

      default: {
        break;
      }
    }
  }

  const handleExportData = () => {};

  const handleClickOpen = (jobId) => {
    // console.log("jobid", jobId);
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
    // console.log("jobid", jobIdSelected);
    setOpen(false);
  };

  const handleConfirm = (jobId) => {
    // Do something when the user confirms
    // console.log("jb", jobIdSelected);
    setOpen(false);
    // console.log("confirm delete", jobIdSelected);
    cancelJob(jobIdSelected);
  };

  const cancelJob = (jobId) => {
    // console.log("cancel job", jobId);
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
      .then((result) => {
        // console.log(result)
      })
      .catch((error) => console.log("error", error));
  };

  useEffect(() => {
    console.log("completedList", completedList);
    if (jobs) {
      // const chunkSize = Math.ceil(jobs.length / 3);
      const _columns = [[], [], []];

      for (let i = 0; i < jobs.length; i++) {
        const columnIndex = i % 3;
        _columns[columnIndex].push(jobs[i]);
      }
      // setColumns(_columns);
    }

    console.log("jobs", jobs);

    const CollectionsCell = ({ cell, row }) => {
      let job = cell.getValue();
      if (job) job = JSON.parse(job);
      console.log("row", row.original);
      console.log("the job", job);
      return (
        <>
          {row.original.collections && row.original.totalCollectionDocs !== null
            ? Object.entries(JSON.parse(row.original.collections)).map(
                ([key, value]) => (
                  <>
                    <Chip
                      key={key}
                      label={`${key}`}
                      color="secondary"
                      sx={{ margin: "10px" }}
                    />
                    <br />
                  </>
                )
              )
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
          key={cell.getValue()}
          label={`${cell.getValue().toLocaleString()}`}
          color="secondary"
          sx={{ margin: "10px" }}
        />
      );
    };

    const ViewCell = ({ cell, row }) => {
      return (
        <Tooltip title="View Report">
          <IconButton onClick={(event) => handleView(row.original)}>
            <SummarizeIcon />
          </IconButton>
        </Tooltip>
      );
    };

    const RemoveCell = ({ cell, row }) => {
      return (
        <Tooltip title="Delete Job">
          <IconButton
            onClick={() => {
              handleClickOpen(row.original);
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      );
    };

    const cols = [
      // {
      //   header: "View",
      //   accessorKey: "jobId",
      //   Cell: ViewCell,
      //   maxSize: 100
      // },
      // {
      //   header: "Remove",
      //   accessorKey: "jobId",
      //   Cell: RemoveCell,
      // },
      {
        header: "Job ID",
        accessorKey: "jobId",
        maxSize: 100
      },
      {
        header: "REDCap Form",
        accessorKey: "redcapFormName",
        minSize:100
      },
      {
        header: "Collections",
        accessorKey: "collections",
        Cell: CollectionsCell,
        minSize: 300
      },
      {
        header: "Total Documents",
        accessorKey: "totalCollectionDocs",
        Cell: TotalDocumentsCell,
        minSize: 150,
        maxSize: 150
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
    console.log("columns", cols);
    setColDefs(cols);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, completedList]);

  useEffect(() => {
    // console.log('completedList', completedList)
    setJobs(
      completedList?.map((pendingJob) => {
        const jobInJobs = jobs.find((job) => job.jobId === pendingJob.jobId);
        const editMode = jobInJobs ? jobInJobs.editMode : false;
        const newJobName = jobInJobs ? jobInJobs.newJobName : "";
        return {
          ...pendingJob,
          editMode: editMode,
          newJobName: newJobName,
        };
      })
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedList]);

  function handleView(job) {
    if (props.setOpen) props.setOpen(false);
    // console.log("event view", job);
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
        // console.log(result);
        // setOpen(false);
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

  function handleTabChange() {}

  return (
    <div style={{}}>
      <h1
        style={{
          paddingLeft: "20px",
          textAlign: "center",
          // backgroundColor: "rgb(251 251 251)",
        }}
      >
        Jobs Overview
      </h1>
      {!completedList.length && (
        <Typography variant="h5">
          There are currently no completed jobs.
        </Typography>
      )}
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={12}>
          {jobs.length && colDefs && (
            <>
              <Tabs
                centered
                value={selectedTabIdx}
                onChange={handleTabChange}
                aria-label="basic tabs example"
              >
                <Tab
                  onClick={(event) => showTab(event, true, 0)}
                  label={
                    <Box sx={{ position: "relative", margin: "20px" }}>
                      Completed
                      <PlaylistAddCheckSharpIcon />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: "-20px", // Adjust the right position of the badge
                        }}
                      >
                        <Badge badgeContent={1} max={9999} color="secondary" />
                      </Box>
                    </Box>
                  }
                  {...a11yProps(0)}
                />
                <Tab
                  onClick={(event) => showTab(event, true, 1)}
                  label={
                    <>
                     
                      <Box sx={{ position: "relative", margin: "20px" }}>
                      
                        Pending
                        <AutorenewIcon />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: "-20px", // Adjust the right position of the badge
                          }}
                        >
                          <Badge
                            badgeContent={2}
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
                  onClick={(event) => showTab(event, true, 2)}
                  label={
                    <Box sx={{ position: "relative", margin: "20px" }}>
                      Failed
                      <ErrorIcon />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: "-20px", // Adjust the right position of the badge
                        }}
                      >
                        <Badge badgeContent={3} max={9999} color="secondary" />
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
                    Are you sure you want to delete this item?
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
                //passing the callback function variant. (You should get type hints for all the callback parameters available)
                columns={colDefs}
                data={jobs}
                enableDensityToggle={false} //density does not work with memoized cells
                memoMode="cells" // memoize table cells to improve render performance, but break some features
                enableBottomToolbar={true}
                enableGlobalFilterModes={true}
                enablePagination={true}
                enableRowActions
                {...(selectedTabIdx === 0 && {
                  renderRowActions: ({ row, table }) => [
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: "8px",
                      }}
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          color="secondary"
                          onClick={() => {
                            table.setEditingRow(row);
                          }}
                        >
                          <SummarizeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
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
                // autoWidth={true}
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
                    {selectedTabIdx === 2 && (
                      <Button
                        color="success"
                        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
                        onClick={handleExportData}
                        startIcon={<FileDownloadIcon />}
                        variant="contained"
                      >
                        Export Data Dictionary
                      </Button>
                    )}

                    <Box style={{ marginLeft: "auto" }}></Box>
                  </Box>
                )}
              />
            </>
          )}
        </Grid>

        {/* {columns.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
            {column?.map((job) => (
              <Card
                key={job.jobId}
                elevation={3}
                style={{ margin: "20px", padding: "10px" }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: "#aad9dc", color: "black" }}>
                      <Typography>
                        <b>{job.jobId}</b>
                      </Typography>
                    </Avatar>
                  }
                  action={
                    <>
                      <Tooltip title="Delete Job">
                        <IconButton
                          onClick={() => {
                            handleClickOpen(job.jobId);
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Report">
                        <IconButton onClick={(event) => handleView(job)}>
                          <SummarizeIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  }
                  title={job.jobName}
                  subheader={`REDCap Form: ${job.redcapFormName}, REDCap Questions: ${job.dataLength}`}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <b>Collections:</b>
                    {job.collections && job.totalCollectionDocs !== null
                      ? Object.entries(JSON.parse(job.collections)).map(
                          ([key, value]) => (
                            <Chip
                              key={key}
                              label={`${key}`}
                              color="secondary"
                              sx={{ margin: "10px" }}
                            />
                          )
                        )
                      : "N/A"}
                    {job.totalCollectionDocs !== null && (
                      <Chip
                        label={`Total Docs: ${job.totalCollectionDocs.toLocaleString()}`}
                        color="secondary"
                      />
                    )}
                    <br />
                    <b>Job Name:</b>
                    {job.editMode ? (
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        variant="standard"
                        sx={{
                          input: { color: "black", backgroundColor: "white" },
                        }}
                        value={job.newJobName ? job.newJobName : ""}
                        onChange={(e) =>
                          handleJobNameChange(job.jobId, e.target.value)
                        }
                      />
                    ) : (
                      <> {job.jobName}</>
                    )}
                    <IconButton
                      variant="outlined"
                      onClick={() => handleToggleEditMode(job.jobId)}
                      sx={{ ml: 2 }}
                    >
                      {job.editMode ? (
                        <Tooltip title="Cancel">
                          <CloseIcon />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Edit">
                          <EditIcon />
                        </Tooltip>
                      )}
                    </IconButton>
                    {job.editMode && (
                      <IconButton
                        variant="contained"
                        onClick={() => handleUpdateName(job.jobId)}
                      >
                        <Tooltip title="Submit">
                          <CheckIcon />
                        </Tooltip>
                      </IconButton>
                    )}
                    <Divider style={{ marginBottom: "10px" }} />
                    <b>Started at:</b>{" "}
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleString()
                      : "Not Started Yet"}
                    <br />
                    <b>Completed At:</b>{" "}
                    {job.finishedAt
                      ? new Date(job.finishedAt).toLocaleString()
                      : "Not Completed Yet"}
                    <br />
                    <b>Submitted By:</b> {job.submittedBy}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>
        ))} */}
      </Grid>
    </div>
  );
}
