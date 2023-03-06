import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MoreIcon from "@mui/icons-material/MoreVert";
import TemporaryDrawer from "./TemporaryDrawer";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Grid, List, ListItem, ListItemText, Button } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import Paper from "@mui/material/Paper";
import ErrorIcon from '@mui/icons-material/Error';

export default function PrimarySearchAppBar(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const navigate = useNavigate();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleSignOut = (event) => {
    Cookies.remove("token");
    Cookies.remove("user");
    props.setToken(null);
    props.updateUser(null);
    navigate("/signin");
  };

  const handleNavigate = (url) => {
    handleMenuClose();
    handleMobileMenuClose();
    navigate(url);
  };

  const menuId = "primary-search-account-menu";
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => handleNavigate("/myaccount")}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <SettingsIcon />
        </IconButton>
        <p>My Account</p>
      </MenuItem>
      <MenuItem onClick={handleSignOut}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <LogoutIcon />
        </IconButton>
        <p>Sign Out</p>
      </MenuItem>
    </Menu>
  );

  const mobileMenuId = "primary-search-account-menu-mobile";
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem onClick={() => handleNavigate("/myaccount")}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <p>My Account</p>
      </MenuItem>
      <MenuItem onClick={handleSignOut}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <LogoutIcon />
        </IconButton>
        <p>Sign Out</p>
      </MenuItem>
    </Menu>
  );

  const handleIconClick = (newValue) => {
    setValue(newValue);
    setOpen(true);
  };

  function checkJobs() {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/users/getUserJobs`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        let resultObj = JSON.parse(result);
        let _pendingList = resultObj.filter((obj) => {
          if (obj.jobStatus !== "completed" && obj.jobStatus !== 'failed' ) return obj;
          else return null;
        });

        let _completedList = resultObj.filter((obj) => {
          if (obj.jobStatus === "completed") return obj;
          else return null;
        });

        let _failedList = resultObj.filter((obj) => {
          if (obj.jobStatus === "failed") return obj;
          else return null;
        });
        props.setPendingList(_pendingList);
        props.setFailedList(_failedList);
        props.setCompletedList(_completedList);
      })
      .catch((error) => {
        // handleSignOut();
        console.log("error", error);
      });
  }

  useEffect(() => {
    // Fetch data initially
    checkJobs();

    // Fetch data every 15 seconds
    const intervalId = setInterval(() => {
      checkJobs();
    }, 5000);

    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  function handleView(jobId) {
    console.log("event view", jobId);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

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

  const CompletedDrawer = React.memo((props) => {
    const { completedList } = props.props;

    const chunkSize = Math.ceil(completedList.length / 3);
    const columns = [];

    for (let i = 0; i < 3; i++) {
      columns.push(completedList.slice(i * chunkSize, (i + 1) * chunkSize));
    }

    return (
      <div>
        <h2 style={{ padding: "10px", textAlign: "center" }}>Completed Jobs</h2>
        <Grid container spacing={1} justifyContent="center">
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
  )

  function PendingDrawer(props) {
    const { pendingList } = props.props;

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

  function FailedDrawer(props) {
    const { failedList } = props.props;

    const sortedJobs = failedList.sort((a, b) => {
      return a.jobId - b.jobId;
    });

    const chunkSize = Math.ceil(sortedJobs.length / 3);
    const columns = [];

    for (let i = 0; i < 3; i++) {
      columns.push(sortedJobs.slice(i * chunkSize, (i + 1) * chunkSize));
    }

    return (
      <div>
        <h2 style={{ padding: "10px", textAlign: "center" }}>Failed Jobs</h2>

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
                                  className="failed-jobs-container"
                                >
                                  <AutorenewIcon
                                    className="failed-jobs-icon"
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

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <TemporaryDrawer />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {/* MUI */}
            </Typography>
            {/* <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search> */}
            <Box sx={{ flexGrow: 1 }} />
            {props.pendingList && props.pendingList.length > 0 && (
              <IconButton
                size="large"
                aria-label="show pending jobs"
                // color="inherit"
                onClick={() => handleIconClick(0)}
              >
                <Badge badgeContent={props.pendingList.length} color="error">
                  <Tooltip title="Pending Jobs">
                    <AutorenewIcon
                      className="pending-jobs-icon"
                      style={{ color: "white" }}
                    />
                  </Tooltip>
                </Badge>
              </IconButton>
            )}
            <IconButton
              size="large"
              aria-label="show completed jobs"
              color="inherit"
              onClick={() => handleIconClick(1)}
            >
              <Tooltip title="Completed Jobs">
                <PlaylistAddCheckSharpIcon />
              </Tooltip>
            </IconButton>
            <IconButton
              size="large"
              aria-label="show failed jobs"
              color="inherit"
              onClick={() => handleIconClick(2)}
            >
              <Tooltip title="Failed Jobs">
                <ErrorIcon />
              </Tooltip>
            </IconButton>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {/* <IconButton
                size="large"
                aria-label="show 4 new mails"
                color="inherit"
              >
                <Badge badgeContent={4} color="error">
                  <MailIcon />
                </Badge>
              </IconButton> */}
              {/* <IconButton
                size="large"
                aria-label="show 17 new notifications"
                color="inherit"
              >
                <Badge badgeContent={17} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton> */}
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls={menuId}
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </Box>
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="show more"
                aria-controls={mobileMenuId}
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MoreIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        {renderMobileMenu}
        {renderMenu}
      </Box>
      {/* <ProjectBottomBar
        pendingList={props.pendingList}
        completedList={props.completedList}
      /> */}
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
        {value === 2 && (
          <FailedDrawer sx={{ maxHeight: "400px" }} props={props} />
        )}
      </Drawer>
    </>
  );
}
