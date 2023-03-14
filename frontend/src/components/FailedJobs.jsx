import * as React from "react";
import { useState, useEffect } from "react";
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Input,
  Button,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import ReplayIcon from "@mui/icons-material/Replay";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";

export default function FailedJobs(props) {
  const { failedList } = props.props.props ?? props.props;
  const { token } = props.props.props ?? props.props;
  console.log("failedList", failedList);
  const chunkSize = Math.ceil(failedList.length / 3);
  const [columns, setColumns] = useState([]);

  // for (let i = 0; i < 3; i++) {
  //   columns.push(failedList.slice(i * chunkSize, (i + 1) * chunkSize));
  // }

  const [jobs, setJobs] = useState(
    failedList.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    }))
  );

  useEffect(() => {
    // console.log('jobs changed update columns...use effect')
    const chunkSize = Math.ceil(jobs.length / 3);
    const _columns = [];

    for (let i = 0; i < 3; i++) {
      _columns.push(jobs.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    setColumns(_columns);
  }, [jobs]);

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
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/retryJob`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  }

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

  return (
    <div style={{}}>
      <h2 style={{ padding: "10px", textAlign: "left" }}>Failed Jobs</h2>

      <Grid container spacing={2} justifyContent="center">
        {columns.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
            <List dense>
              {column.map((job) => (
                <Paper
                  elevation={3}
                  key={job.jobId}
                  style={{ backgroundColor: "#008C95", color: "white" }}
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
                          </div>
                          <span
                          // style={{ flex: 1 }}
                          >
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
                            <Divider style={{ padding: "10px" }} />
                            <div className="job-added-text">
                              <b>Added:</b>{" "}
                              {new Date(job.timeAdded).toLocaleString()}
                            </div>
                            <div className="job-started-at-text">
                              <b>Started at:</b>{" "}
                              {job.startedAt
                                ? new Date(job.startedAt).toLocaleString()
                                : "Not Started Yet"}
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
