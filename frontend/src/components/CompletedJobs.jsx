import * as React from "react";
// import AppBar from "@mui/material/AppBar";
// import Box from "@mui/material/Box";
// import Toolbar from "@mui/material/Toolbar";
// import IconButton from "@mui/material/IconButton";
// import Typography from "@mui/material/Typography";
// import Badge from "@mui/material/Badge";
// import MenuItem from "@mui/material/MenuItem";
// import Menu from "@mui/material/Menu";
// import AccountCircle from "@mui/icons-material/AccountCircle";
// import MoreIcon from "@mui/icons-material/MoreVert";
// import TemporaryDrawer from "./TemporaryDrawer";
// import SettingsIcon from "@mui/icons-material/Settings";
// import LogoutIcon from "@mui/icons-material/Logout";
// import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
// import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
} from "@mui/material";
// import Drawer from "@mui/material/Drawer";
// import Tooltip from "@mui/material/Tooltip";
// import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import Paper from "@mui/material/Paper";
// import ErrorIcon from "@mui/icons-material/Error";
export default function CompletedJobs(props) {
  // console.log('completedjobs props', props)
  const { completedList } = props.props.props ?? props.props;
  const { token } = props.props.props ?? props.props;

  // console.log('token?', token)
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState(
    completedList.map((job) => ({
      ...job,
      editMode: false,
      newJobName: job.jobName,
    }))
  );
  const [columns, setColumns] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // console.log('jobs changed update columns...use effect')
    const chunkSize = Math.ceil(jobs.length / 3);
    const _columns = [];

    for (let i = 0; i < 3; i++) {
      _columns.push(jobs.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    setColumns(_columns);
  }, [jobs]);

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

    // Call your backend API to update the job name
    // ...
    // console.log("update job name with", job.jobId);
    // console.log("job name", job.newJobName);

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
    // console.log("event view", job);
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
        setOpen(false);
        navigate("/completed-jobs", {
          state: { result: result, jobId: job.jobId, submittedBy: job.submittedBy, jobName: job.jobName },
        });
      })
      .catch((error) => console.log("error", error));
  }

  return (
    <div style={{marginTop: '50px'}}>
      <h2 style={{ padding: "10px", textAlign: "center" }}>Completed Jobs</h2>
      <Grid container spacing={1} justifyContent="center">
        {columns.map((column, index) => (
          <Grid key={index} item xs={12} md={4}>
            <List dense>
              {column.map((job) => (
                <Paper elevation={3} key={job.jobId}>
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
                        <div>
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <span style={{ flex: 1 }}>
                              <b>Job Name:</b>
                              {job.editMode ? (
                                <TextField
                                  sx={{ width: "150px" }}
                                  label="Job Name"
                                  value={job.newJobName?job.newJobName: ''}
                                  onChange={(e) =>
                                    handleJobNameChange(
                                      job.jobId,
                                      e.target.value
                                    )
                                  }
                                />
                              ) : (
                                <>{job.jobName}</>
                              )}

                              <Button
                                onClick={() => handleToggleEditMode(job.jobId)}
                              >
                                {job.editMode ? "Cancel" : "Edit"}
                              </Button>
                              {job.editMode && (
                                <Button
                                  onClick={() => handleUpdateName(job.jobId)}
                                >
                                  Submit
                                </Button>
                              )}
                            </span>
                          </div>
                          <div>
                            <b>Submitted By:</b> {job.submittedBy}
                          </div>
                          <div>
                            <b>Job ID:</b> {job.jobId}
                          </div>
                          <div>
                            <b>Status:</b> {job.jobStatus}
                          </div>
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
                        </div>
                      }
                      style={{ whiteSpace: "pre-wrap" }}
                    />
                    <Button
                      variant="contained"
                      onClick={(event) => handleView(job)}
                      value="redcapAPIKey"
                      sx={{
                        ml: 4,
                        padding: "10px 30px 10px 30px",
                        maxHeight: "60px",
                      }}
                    >
                      View
                    </Button>
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
