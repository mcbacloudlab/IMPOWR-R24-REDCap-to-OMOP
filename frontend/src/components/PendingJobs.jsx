import * as React from "react";
import { useState, useEffect } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Button,
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

export default function PendingJobs(props) {
  console.log("pendinglist", props);
  const { pendingList } = props.props.props ?? props.props;
  const { token } = props.props.props ?? props.props;
  const [columns, setColumns] = useState([]);
  const [jobs, setJobs] = useState(
    pendingList?.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    }))
  );
  const [open, setOpen] = useState(false);
  const [jobIdSelected, setJobIdSelected] = useState();
  const handleClickOpen = (jobId) => {
    console.log("jobid", jobId);
    setJobIdSelected(jobId);
    setOpen(true);
  };

  const handleClose = (jobId) => {
    console.log("jobid", jobIdSelected);
    setOpen(false);
  };

  const handleConfirm = (jobId) => {
    // Do something when the user confirms
    console.log("jb", jobIdSelected);
    setOpen(false);
    console.log("confirm delete", jobIdSelected);
    cancelJob(jobIdSelected);
  };

  useEffect(() => {
    console.log("jobs changed update columns...use effect");
    const chunkSize = Math.ceil(jobs?.length / 3);
    const _columns = [];

    for (let i = 0; i < 3; i++) {
      _columns.push(jobs?.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    setColumns(_columns);

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // console.log("edit mode for", jobId);
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

  const cancelJob = (jobId) => {
    console.log("cancel job", jobId);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var formdata = new FormData();
    formdata.append("jobId", jobId);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/cancelJob`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  };

  return (
    <div>
      <h1 style={{ padding: "10px", textAlign: "left" }}>Pending Jobs</h1>
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
                  style={{ backgroundColor: "#008C95", color: "white", maxWidth: '450px', margin: 'auto' }}
                  key={job.jobId}
                >
                  <ListItem
                    key={job.jobId}
                    sx={{
                      margin: "10px",
                    }}
                  >
                    <ListItemText
                      primary={
                        <div className="primary-text-container">
                          <div style={{ textAlign: "right" }}>
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
                          </div>
                          <span>
                            <div>
                              <b>Job ID:</b> {job.jobId}
                            </div>
                            <b>Job Name:</b>
                            {job.editMode ? (
                              <Input
                                variant="standard"
                                sx={{
                                  marginLeft: "10px",
                                  width: "200px",
                                  input: {
                                    color: "black",
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
                              <> {job.jobName}</>
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
                                <b>Started at:</b>{" "}
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
