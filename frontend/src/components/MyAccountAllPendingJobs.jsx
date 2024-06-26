import * as React from "react";
import { useState, useEffect } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Button,
  Chip,
  Box,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  Input,
  IconButton,
  Tooltip,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import LinearProgress from "@mui/material/LinearProgress";
import Avatar from "@mui/material/Avatar";

export default function MyAccountAllPendingJobs(props) {
  const { token } = props.props.props ?? props.props;
  const [pendingList, setPendingList] = useState([]);
  const [jobs, setJobs] = useState(
    pendingList?.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    })) || []
  );

  const [columns, setColumns] = useState([]);

  useEffect(() => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var formdata = new FormData();
    formdata.append("type", "pending");

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/users/getAllUserJobs`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        // console.log(JSON.parse(result));
        setPendingList(JSON.parse(result));
      })
      .catch((error) => console.log("error", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [open, setOpen] = useState(false);
  const [jobIdSelected, setJobIdSelected] = useState();
  const handleClickOpen = (jobId) => {
    // console.log("jobid", jobId);
    setJobIdSelected(jobId);
    setOpen(true);
  };

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
        // console.log(result);
        setPendingList(result);
      })
      .catch((error) => console.log("error", error));
  };

  useEffect(() => {
    // console.log('jobs changed update columns...use effect')
    if (jobs) {
      const chunkSize = Math.ceil(jobs.length / 3);
      const _columns = [];

      for (let i = 0; i < 3; i++) {
        _columns.push(jobs.slice(i * chunkSize, (i + 1) * chunkSize));
      }
      setColumns(_columns);
    }
  }, [jobs, pendingList]);

  useEffect(() => {
    setJobs(
      pendingList?.map((pendingJob) => {
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
  }, [pendingList]);

  const handleToggleEditMode = (jobId) => {
    setJobs(
      jobs.map((job) =>
        job.jobId === jobId ? { ...job, editMode: !job.editMode } : job
      )
    );
  };

  const handleUpdateName = (jobId) => {
    // Find the job with the specified jobId
    const job = jobs.find((job) => job.jobId === jobId);

    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var formdata = new FormData();
    formdata.append("jobId", job.jobId);
    formdata.append("jobName", job.newJobName);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/updateJobName`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        // console.log(result);
        // Update the job name and toggle the edit mode flag
        setJobs(
          jobs.map((job) =>
            job.jobId === jobId
              ? { ...job, jobName: job.newJobName, editMode: false }
              : job
          )
        );
      })
      .catch((error) => console.log("error", error));
  };

  const handleJobNameChange = (jobId, newValue) => {
    setJobs(
      jobs.map((job) =>
        job.jobId === jobId ? { ...job, newJobName: newValue } : job
      )
    );
  };

  // console.log('columns', columns)
  return (
    <div>
      <h1
        style={{
          paddingLeft: "20px",
          textAlign: "center",
          backgroundColor: "rgb(251 251 251)",
        }}
      >
        All Pending Jobs
      </h1>
      {!pendingList.length && <h3>There are currently no pending jobs.</h3>}
      <Grid container spacing={2} justifyContent="center">
        {columns.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Confirm Cancellation</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to cancel this job?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => handleClose(jobIdSelected)}
                  color="primary"
                >
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
            <List dense>
              {column?.map((job) => (
                <Paper
                  elevation={3}
                  style={{
                    backgroundColor: "#008C95",
                    color: "white",
                    maxWidth: "550px",
                    margin: "20px",
                    padding: "10px",
                  }}
                  key={job.jobId}
                >
                  <ListItem
                    key={job.jobId}
                    sx={
                      {
                        // margin: "10px",
                      }
                    }
                  >
                    <ListItemText
                      primary={
                        <div className="primary-text-container">
                          <Grid container alignItems="center">
                            <Grid item xs={4}>
                              <Avatar
                                sx={{ bgcolor: "#aad9dc", color: "black" }}
                                aria-label="recipe"
                              >
                                {job.jobId}
                              </Avatar>
                            </Grid>
                            <Grid item xs={8} style={{ textAlign: "right" }}>
                              <Tooltip title="Cancel Job">
                                <IconButton
                                  onClick={() => {
                                    handleClickOpen(job.jobId);
                                  }}
                                  sx={{ color: "white" }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                              {job.startedAt ? (
                                <IconButton>
                                  <AutorenewIcon
                                    className="pending-jobs-icon"
                                    style={{
                                      // backgroundColor: "white",
                                      color: "white",
                                    }}
                                  />
                                </IconButton>
                              ) : null}
                            </Grid>
                          </Grid>
                          <div style={{ textAlign: "right" }}></div>
                          <span>
                            <div>{/* <b>Job ID:</b> {job.jobId} */}</div>
                            <div sx={{ marginTop: "10px" }}>
                              <b>REDCap Form:</b> {job.redcapFormName}
                            </div>
                            <div>
                              <b>REDCap Questions:</b> {job.dataLength}
                            </div>
                            <div>
                              <b>Collections:</b>
                              {job.collections &&
                              job.totalCollectionDocs !== null
                                ? Object.entries(
                                    JSON.parse(job.collections)
                                  ).map(([key, value]) => (
                                    <Chip
                                      key={key}
                                      label={`${key}`}
                                      color="secondary"
                                      sx={{ margin: "10px" }}
                                    />
                                  ))
                                : "N/A"}
                              {job.totalCollectionDocs !== null && (
                                <Chip
                                  label={`Total Docs: ${job.totalCollectionDocs.toLocaleString()}`}
                                  color="secondary"
                                />
                              )}
                            </div>
                            <b>Job Name:</b>
                            {job.editMode ? (
                              <Input
                                variant="standard"
                                sx={{
                                  marginLeft: "10px",
                                  width: "250px",
                                  input: {
                                    color: "black",
                                    paddingLeft: "20px",
                                    paddingRight: "30px",
                                    backgroundColor: "white",
                                  },
                                }}
                                label="Job Name"
                                value={job.newJobName ? job.newJobName : ""}
                                onChange={(e) =>
                                  handleJobNameChange(job.jobId, e.target.value)
                                }
                              />
                            ) : (
                              <> {job.newJobName ? job.newJobName : ""}</>
                            )}

                            <IconButton
                              variant="outlined"
                              onClick={() => handleToggleEditMode(job.jobId)}
                              sx={{ ml: 2, color: "white" }}
                            >
                              {job.editMode ? (
                                <CloseIcon />
                              ) : (
                                <Tooltip title="Edit">
                                  <EditIcon />
                                </Tooltip>
                              )}
                            </IconButton>
                            {job.editMode && (
                              <IconButton
                                variant="contained"
                                sx={{ color: "white" }}
                                onClick={() => handleUpdateName(job.jobId)}
                              >
                                <Tooltip title="Submit">
                                  <CheckIcon />
                                </Tooltip>
                              </IconButton>
                            )}
                          </span>
                          <div className="job-status-text">
                            <b>Status:</b> {job.jobStatus}
                          </div>

                          <div className="job-started-at-text">
                            <b>Progress:</b>{" "}
                            {job.progress ? (
                              <>
                                {job.progress}%
                                <Box
                                  key={job.jobId}
                                  sx={{ width: "50%", backgroundColor: "red" }}
                                >
                                  <LinearProgress
                                    key={job.jobId}
                                    variant="determinate"
                                    value={job.progress}
                                    sx={{
                                      backgroundColor: "white",
                                      "& .MuiLinearProgress-bar": {
                                        backgroundColor: "#73fdca",
                                      },
                                    }}
                                  />
                                </Box>
                              </>
                            ) : (
                              "Not Started Yet"
                            )}
                          </div>
                          <Divider style={{ padding: "10px" }} />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              {/* <Tooltip title="Cancel Job">
                                <IconButton sx={{ color: "white" }}>
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip> */}
                            </div>
                            <div>
                              <div
                                className="job-added-text"
                                style={{ textAlign: "right" }}
                              >
                                <b>Added:</b>{" "}
                                {new Date(job.timeAdded).toLocaleString()}
                              </div>
                              <div
                                className="job-started-at-text"
                                style={{ textAlign: "right" }}
                              >
                                <b>Started:</b>{" "}
                                {job.startedAt
                                  ? new Date(job.startedAt).toLocaleString()
                                  : "Not Started Yet"}
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                      style={{ whiteSpace: "pre-wrap" }}
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
