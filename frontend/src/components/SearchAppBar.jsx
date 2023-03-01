import * as React from "react";
// import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
// import InputBase from "@mui/material/InputBase";
import Badge from "@mui/material/Badge";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
// import SearchIcon from "@mui/icons-material/Search";
import AccountCircle from "@mui/icons-material/AccountCircle";
// import MailIcon from "@mui/icons-material/Mail";
// import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreIcon from "@mui/icons-material/MoreVert";
import TemporaryDrawer from "./TemporaryDrawer";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
// import ProjectBottomBar from "./ProjectBottomBar";
import { useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
// import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Grid, List, ListItem, ListItemText, Button } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";

// const Search = styled("div")(({ theme }) => ({
//   position: "relative",
//   borderRadius: theme.shape.borderRadius,
//   backgroundColor: alpha(theme.palette.common.white, 0.15),
//   "&:hover": {
//     backgroundColor: alpha(theme.palette.common.white, 0.25),
//   },
//   marginRight: theme.spacing(2),
//   marginLeft: 0,
//   width: "100%",
//   [theme.breakpoints.up("sm")]: {
//     marginLeft: theme.spacing(3),
//     width: "auto",
//   },
// }));

// const SearchIconWrapper = styled("div")(({ theme }) => ({
//   padding: theme.spacing(0, 2),
//   height: "100%",
//   position: "absolute",
//   pointerEvents: "none",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
// }));

// const StyledInputBase = styled(InputBase)(({ theme }) => ({
//   color: "inherit",
//   "& .MuiInputBase-input": {
//     padding: theme.spacing(1, 1, 1, 0),
//     // vertical padding + font size from searchIcon
//     paddingLeft: `calc(1em + ${theme.spacing(4)})`,
//     transition: theme.transitions.create("width"),
//     width: "100%",
//     [theme.breakpoints.up("md")]: {
//       width: "20ch",
//     },
//   },
// }));

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
      {/* <MenuItem>
        <IconButton size="large" aria-label="show 4 new mails" color="inherit">
          <Badge badgeContent={4} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem> */}
      {/* <MenuItem>
        <IconButton
          size="large"
          aria-label="show 17 new notifications"
          color="inherit"
        >
          <Badge badgeContent={17} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem> */}
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
        <h2 style={{ padding: "10px", textAlign: "center" }}>Completed Jobs</h2>
        <Grid container spacing={1} justifyContent="center">
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
                    <Button
                      variant="contained"
                      // onClick={(event) => handleView(event)}
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
                ))}
              </List>
            </Grid>
          ))}
        </Grid>
      </div>
    );
  }

  function PendingDrawer(props) {
    // const classes = useStyles();
    const { pendingList } = props.props;
    console.log("p1", pendingList);

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
        <AppBar position="static">
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
                <CheckIcon />
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
      </Drawer>
    </>
  );
}
