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
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Grid, List, ListItem, ListItemText, Button } from "@mui/material";
// import Drawer from "@mui/material/Drawer";
// import Tooltip from "@mui/material/Tooltip";
// import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import Paper from "@mui/material/Paper";
// import ErrorIcon from "@mui/icons-material/Error";
export default function PendingJobs(props) {
  console.log("pending", props);
  console.log("pending", props.props.props.token);
  const { pendingList } = props.props.props;

  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);

  const chunkSize = Math.ceil(pendingList.length / 3);
  const columns = [];

  for (let i = 0; i < 3; i++) {
    columns.push(pendingList.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  return (
    <div>
    <h2 style={{ padding: "10px", textAlign: "center" }}>Pending Jobs</h2>

    <Grid container spacing={2} justifyContent="center">
      {columns.map((column, index) => (
        <Grid key={index} item xs={12} md={4}>
          <List dense>
            {column.map((job) => (
              <Paper elevation={3}>
                <ListItem
                  key={job.jobId}
                  sx={{
                    // borderWidth: "1px",
                    // borderStyle: "solid",
                    margin: "10px",
                  }}
                >
                  <ListItemText
                    primary={
                      <div className="primary-text-container">
                        <div className="job-id-text">
                          <b>Job Id:</b> {job.jobId}
                        </div>
                        <div className="job-status-text">
                          <b>Status:</b> {job.jobStatus}
                        </div>
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
                        <div className="job-started-at-text">
                          <b>Progress:</b>{" "}
                          {job.progress
                            ? job.progress + "%"
                            : "Not Started Yet"}
                          {job.startedAt ? (
                            <span
                              style={{ position: "absolute" }}
                              className="pending-jobs-container"
                            >
                              <AutorenewIcon
                                className="pending-jobs-icon"
                                style={{
                                  backgroundColor: "white",
                                  color: "green",
                                  marginLeft: "5px",
                                }}
                              />
                            </span>
                          ) : null}
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