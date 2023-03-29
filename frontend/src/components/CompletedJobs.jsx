import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Input,
  Divider,
  Tooltip,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CheckIcon from "@mui/icons-material/Check";
import Avatar from "@mui/material/Avatar";
import { useLists } from "./ListsContext";

export default function CompletedJobs(props) {
  // console.log('completedjobs props', props)
  // const { completedList } = props.props.props ?? props.props;
  const { completedList } = useLists();
  const { token } = props.props.props ?? props.props;
  // console.log("completeld list", completedList);

  // console.log('token?', token)
  // const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState(
    completedList?.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    })) || []
  );
  const [columns, setColumns] = useState([]);

  const navigate = useNavigate();

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
  function handleView(job) {
    if (props.setOpen) props.setOpen(false);
    console.log("event view", job);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobReturnData?jobID=${job.jobId}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        // console.log(result);
        // setOpen(false);
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
    <div style={{ maxHeight: "400px" }}>
      <h1
        style={{
          padding: "10px",
          textAlign: "left",
          backgroundColor: "rgb(251 251 251)",
        }}
      >
        Completed Jobs
      </h1>
      <Grid
        container
        spacing={1}
        justifyContent="center"
        style={{ backgroundColor: "rgb(251 251 251)" }}
      >
        {columns.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
            <List dense>
              {column.map((job) => (
                <Paper
                  elevation={3}
                  key={job.jobId}
                  style={{
                    backgroundColor: "#008C95",
                    color: "white",
                    maxWidth: "450px",
                    margin: "auto",
                  }}
                >
                  <ListItem
                    key={job.jobId}
                    sx={{
                      // borderWidth: "1px",
                      // borderStyle: "solid",
                      margin: "10px",
                    }}
                  >
                    <ListItemText
                      key={job.jobId}
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
                              <Tooltip title="View Report">
                                <IconButton
                                  onClick={(event) => handleView(job)}
                                  value="redcapAPIKey"
                                  sx={{
                                    color: "white",
                                  }}
                                >
                                  <SummarizeIcon />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          </Grid>

                          <span>
                            {/* <div>
                              <b>Job ID:</b> {job.jobId}
                            </div> */}
                            <div>
                              <b>REDCap Form:</b> {job.redcapFormName}
                            </div>
                            <div>
                              <b>REDCap Questions:</b> {job.dataLength}
                            </div>
                            <div>
                              <b>Collection / Doc Size:</b>{" "}
                              {job.collectionName &&
                              job.totalCollectionDocs !== null
                                ? `${
                                    job.collectionName
                                  } / ${job.totalCollectionDocs.toLocaleString()}`
                                : "N/A"}
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
                                sx={{ color: "white" }}
                                onClick={() => handleUpdateName(job.jobId)}
                              >
                                <Tooltip title="Submit">
                                  <CheckIcon />
                                </Tooltip>
                              </IconButton>
                            )}
                          </span>

                          <div style={{ textAlign: "right" }}>
                            {/* <div>
                              <b>Added:</b>{" "}
                              {new Date(job.timeAdded).toLocaleString()}
                            </div> */}
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

                            <Divider style={{ marginBottom: "10px" }} />

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
            </List>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
