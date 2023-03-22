import React, { useState } from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
// import HomeIcon from "@mui/icons-material/Home";
// import SearchIcon from "@mui/icons-material/Search";
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/system";
import { Grid, List, ListItem, ListItemText } from "@mui/material";
// import PublishIcon from "@mui/icons-material/Publish";
import CheckIcon from "@mui/icons-material/Check";
// import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Badge } from "@mui/material";


const Footer = styled("footer")({
  position: "fixed",
  bottom: 0,
  width: "100%",
  backgroundColor: "#f5f5f5",
  height: 60,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

export default function ProjectBottomBar(props) {
  console.log("props", props);
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);

  const handleIconClick = (newValue) => {
    setValue(newValue);
    setOpen(true);
  };

  function PendingDrawer(props) {
    // const classes = useStyles();
    const { pendingList } = props.props;
    // console.log("p1", pendingList);

    const sortedJobs = pendingList.sort((a, b) => {
      return a.jobId - b.jobId;
    });

    const chunkSize = Math.ceil(sortedJobs.length / 3);
    const columns = [];

    for (let i = 0; i < 3; i++) {
      columns.push(sortedJobs.slice(i * chunkSize, (i + 1) * chunkSize));
    }

    return (
      <div>
        <h2 style={{ padding: "10px" }}>Pending Jobs</h2>

        <Grid container spacing={2} justifyContent="center">
          {columns.map((column, index) => (
            <Grid key={index} item xs={12} md={4}>
              <List dense>
                {column.map((job) => (
                  <ListItem
                    key={job.jobId}
                    sx={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      margin: "10px",
                    }}
                  >
                    <ListItemText
                      primary={
                        <div className="primary-text-container">
                          <div className="job-id-text">
                          
                            <b>Job Id:</b> {job.jobId}
                            {job.startedAt ? (
                              <span style={{position: 'absolute'}}className="pending-jobs-container">
                                <AutorenewIcon className="pending-jobs-icon" />
                              </span>
                            ) : null}
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
                              ? job.progress + '%'
                              : "Not Started Yet"}
                          </div>
                        </div>
                      }
                      style={{ whiteSpace: "pre-wrap" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          ))}
        </Grid>
      </div>
    );
  }

  // const useStyles = makeStyles({
  //   root: {
  //     maxHeight: "70vh",
  //     overflow: "auto"
  //   }
  // });

  function CompletedDrawer(props) {
    // const classes = useStyles();
    const { completedList } = props.props;

    const chunkSize = Math.ceil(completedList.length / 3);
    const columns = [];

    for (let i = 0; i < 3; i++) {
      columns.push(completedList.slice(i * chunkSize, (i + 1) * chunkSize));
    }

    return (
      <div>
        <h2 style={{ padding: "10px" }}>Completed Jobs</h2>
        <Grid container spacing={2} justifyContent="center">
          {columns.map((column, index) => (
            <Grid key={index} item xs={12} md={4}>
              <List dense>
                {column.map((job) => (
                  <ListItem
                    key={job.jobId}
                    sx={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      margin: "10px",
                    }}
                  >
                    <ListItemText
                      primary={
                        <div>
                          <div>
                            <b>Job Id:</b> {job.jobId}
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
                  </ListItem>
                ))}
              </List>
            </Grid>
          ))}
        </Grid>
      </div>
    );
  }

  return (
    <>
      <Footer>
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            handleIconClick(newValue);
          }}
          showLabels
        >
          {props.pendingList && props.pendingList.length > 0 && (
            <BottomNavigationAction
              label="Pending Jobs"
              icon={
                <Badge
                  badgeContent={props.pendingList.length}
                  color="secondary"
                >
                  <AutorenewIcon className="pending-jobs-icon" />
                </Badge>
              }
            />
          )}

          <BottomNavigationAction
            label="Completed"
            icon={<CheckIcon />}
            onClick={() => handleIconClick(1)}
          />
        </BottomNavigation>
      </Footer>
      <Drawer
        sx={{ maxHeight: "400px" }}
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
      >
        {value === 0 && <PendingDrawer props={props} />}
        {value === 1 && (
          <CompletedDrawer sx={{ maxHeight: "400px" }} props={props} />
        )}
      </Drawer>
    </>
  );
}
