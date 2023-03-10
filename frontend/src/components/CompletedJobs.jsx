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
import { Grid, List, ListItem, ListItemText, Button } from "@mui/material";
// import Drawer from "@mui/material/Drawer";
// import Tooltip from "@mui/material/Tooltip";
// import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import Paper from "@mui/material/Paper";
// import ErrorIcon from "@mui/icons-material/Error";
export default function CompletedJobs(props) {
  const { completedList } = props.props.props;

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const chunkSize = Math.ceil(completedList.length / 3);
  const columns = [];

  for (let i = 0; i < 3; i++) {
    columns.push(completedList.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  function handleView(jobId) {
    console.log("event view", jobId);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.props.token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobReturnData?jobID=${jobId}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        // console.log(result);
        setOpen(false);
        navigate("/completed-jobs", {
          state: { result: result, jobId: jobId },
        });
      })
      .catch((error) => console.log("error", error));
  }

  return (
    <div>
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
                      onClick={(event) => handleView(job.jobId)}
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
