import * as React from "react";
import { useState, useEffect } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Box,
  Grid,
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
    pendingList.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    }))
  );

  useEffect(() => {
    console.log("jobs changed update columns...use effect");
    const chunkSize = Math.ceil(jobs.length / 3);
    const _columns = [];

    for (let i = 0; i < 3; i++) {
      _columns.push(jobs.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    setColumns(_columns);
    setJobs(
      pendingList.map((job) => ({
        ...job,
        editMode: false,
        newJobName: job.jobName,
      }))
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

  return (
    <div>
      <h2 style={{ padding: "10px", textAlign: "left" }}>Pending Jobs</h2>

      <Grid container spacing={2} justifyContent="center">
        {columns.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
            <List dense>
              {column.map((job) => (
                <Paper
                  elevation={3}
                  style={{ backgroundColor: "#008C95", color: "white" }}
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
                          {job.startedAt ? (
                            <div
                              style={{ textAlign: "right" }}
                              className="pending-jobs-container"
                            >
                              <AutorenewIcon
                                className="pending-jobs-icon"
                                style={{
                                  // backgroundColor: "white",
                                  color: "white",
                                  marginLeft: "5px",
                                }}
                              />
                            </div>
                          ) : null}
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
                              <Tooltip title="Cancel Job">
                                <IconButton sx={{ color: "white" }}>
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
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
