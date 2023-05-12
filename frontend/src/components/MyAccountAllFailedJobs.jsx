import * as React from "react";
import { useState, useEffect } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Input,
  Tooltip,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ReplayIcon from "@mui/icons-material/Replay";
import Avatar from "@mui/material/Avatar";

export default function MyAccountAllFailedJobs(props) {
  const { token } = props.props.props ?? props.props;
  const [failedList, setFailedList] = useState([]);
  const [jobs, setJobs] = useState(
    failedList?.map((job) => ({
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
    formdata.append("type", "failed");

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
        setFailedList(JSON.parse(result));
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
        setFailedList(result);
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
  }, [jobs, failedList]);

  useEffect(() => {
    // console.log("set");
    setJobs(
      failedList?.map((pendingJob) => {
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
  }, [failedList]);

  const handleToggleEditMode = (jobId) => {
    console.log("edit mode for", jobId);
    console.log("jobs", jobs);
    console.log("columns", columns);
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

  function handleRetry(jobId) {
    console.log("event view", jobId);
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
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/retryJob`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  }

  // console.log('columns', columns)

  return (
    <div style={{}}>
      <h1
        style={{
          paddingLeft: "20px",
          textAlign: "center",
          backgroundColor: "rgb(251 251 251)",
        }}
      >
        All Failed Jobs
      </h1>
      {!failedList.length && <h3>There are currently no failed jobs.</h3>}
      <Grid container spacing={2} justifyContent="center">
        {columns?.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
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

            <List dense>
              {column?.map((job) => (
                <Paper
                  elevation={3}
                  key={job.jobId}
                  style={{
                    backgroundColor: "#008C95",
                    color: "white",
                    maxWidth: "550px",
                    margin: "20px",
                    padding: "10px",
                  }}
                >
                  <ListItem key={job.jobId}>
                    <ListItemText
                      primary={
                        <Grid key={index} item xs={12}>
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
                              <Tooltip title="Delete Job">
                                <IconButton
                                  onClick={() => {
                                    handleClickOpen(job.jobId);
                                  }}
                                  sx={{ color: "white", paddingTop: "10px" }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Retry Job">
                                <IconButton
                                  onClick={(event) => handleRetry(job.jobId)}
                                  sx={{
                                    color: "white",
                                  }}
                                >
                                  <ReplayIcon />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          </Grid>

                          <div>
                            <b>REDCap Form:</b> {job.redcapFormName}
                          </div>
                          <div>
                            <b>REDCap Questions:</b> {job.dataLength}
                          </div>
                          <div>
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

                          <div className="job-status-text">
                            <b>Status:</b> {job.jobStatus}
                          </div>

                          <div className="job-started-at-text">
                            <b>Progress:</b>{" "}
                            {job.progress
                              ? job.progress + "%"
                              : "Not Started Yet"}
                            {job.startedAt ? (
                              <span
                                style={{ position: "absolute" }}
                                className="pending-jobs-container"
                              ></span>
                            ) : null}
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <Divider style={{ marginBottom: "10px" }} />
                            <div>
                              <b>Added:</b>{" "}
                              {new Date(job.timeAdded).toLocaleString()}
                            </div>
                            <div>
                              <b>Started at:</b>{" "}
                              {job.startedAt
                                ? new Date(job.startedAt).toLocaleString()
                                : "Not Started Yet"}
                            </div>
                            <div>
                              <b>Completed At:</b>{" "}
                              {job.finishedAt
                                ? new Date(job.finishedAt).toLocaleString()
                                : "Not Completed Yet"}
                            </div>

                            <div>
                              <b>Submitted By:</b> {job.submittedBy}
                            </div>
                          </div>
                        </Grid>
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
