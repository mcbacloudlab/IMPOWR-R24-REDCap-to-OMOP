import * as React from "react";
import {
  AppBar,
  Badge,
  Box,
  Drawer,
  IconButton,
  MenuItem,
  Menu,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MoreIcon from "@mui/icons-material/MoreVert";
// import TemporaryDrawer from "./TemporaryDrawer";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CompletedJobs from "./JobsOverview";
import FailedJobs from "./FailedJobs";
import PendingJobs from "./PendingJobs";
import CloseIcon from "@mui/icons-material/Close";
import { useLists } from "./ListsContext";
import _ from "lodash";
import Logo from "../assets/logo.png";
// import RedisLogo from "../assets/redis.png";
import MuiAlert from "@mui/material/Alert";
import { ViewContext } from "./ViewContext";
// import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
// import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
// import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import WarningIcon from "@mui/icons-material/Warning";

export default function SearchAppBar({ openSnackbar, ...props }) {
  // console.log("search bar", props);
  // console.log('opensnackbar', openSnackbar)

  const {
    pendingList,
    // failedList,
    // completedList,
    setPendingList,
    setFailedList,
    setCompletedList,
    setAllCompletedList,
    setAllPendingList,
    setAllFailedList,
    setInitCheckJobsRan,
  } = useLists();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);
  const { view } = useContext(ViewContext);
  const [redisDown, setRedisDown] = useState(false);

  // console.log('view', view)

  const [snackbarMessage, setSnackbarMessage] = useState("");

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (props.user) {
        try {
          // Attempt to parse the string as JSON
        } catch (error) {
          // Handle the case where the string is not valid JSON
          console.info(
            "The provided string is not a valid JSON object:",
            error.message
          );
          return;
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  }, [props.user, view]);

  let userCookie = Cookies.get("user");
  let userInfo;
  let role = "default";
  try {
    if (userCookie) {
      userCookie = JSON.parse(userCookie);
      userInfo = JSON.parse(props.user);
      role = userInfo.role;
    }
  } catch (error) {
    // console.log('error', error)
  }

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
    // props.setServerError(true)
    orcidLogout();
    navigate("/signin");
  };

  // Client-side code to sign out the user
  function orcidLogout() {
    // Make a request to the server-side endpoint to sign out the user and clear the JWT cookie
    fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/orcid/orcidLogout`, {
      credentials: "include", // Include cookies with the request
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle successful sign out (e.g., update user state, navigate to sign-in page)
      })
      .catch((error) => {
        // Handle errors
        console.error(error);
      });
  }

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
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/users/getUserJobs`,
      requestOptions
    )
      .then((response) => {
        // const statusCode = response.status;
        // if (statusCode !== 200) {
        // console.log("Error!", statusCode);
        // handleSignOut('Server error')
        // return;
        // } else
        return response.text();
      })
      .then((result) => {
        if (!result) return;
        let resultObj = JSON.parse(result);
        if (resultObj.message) {
          if (resultObj.message.includes("Redis server is down")) {
            setRedisDown(true);
            return;
          } else {
            setRedisDown(false);
          }
        } else {
          setRedisDown(false);
        }

        let _pendingList = resultObj.filter((obj) => {
          if (obj.jobStatus !== "completed" && obj.jobStatus !== "failed")
            return obj;
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

        // Use functional update form of setState
        setPendingList((prevPendingList) => {
          // Compare the previous state with the new value
          if (!_.isEqual(prevPendingList, _pendingList)) {
            // console.log("set the pending, found diff");
            // Return the new value to update the state
            return _pendingList;
          }
          // Return the previous state to keep it unchanged
          return prevPendingList;
        });

        // Use functional update form of setState
        setFailedList((prevFailedList) => {
          // Compare the previous state with the new value
          if (!_.isEqual(prevFailedList, _failedList)) {
            // Return the new value to update the state
            return _failedList;
          }
          // Return the previous state to keep it unchanged
          return prevFailedList;
        });

        // Use functional update form of setState
        setCompletedList((prevCompletedList) => {
          // Compare the previous state with the new value
          if (!_.isEqual(prevCompletedList, _completedList)) {
            // console.log("set the pending, found diff");
            // Return the new value to update the state
            return _completedList;
          }
          // Return the previous state to keep it unchanged
          return prevCompletedList;
        });
        setInitCheckJobsRan(true);
        // setPendingList(_pendingList);
        // setFailedList(_failedList);
        // setCompletedList(_completedList);
      })
      .catch((error) => {
        // handleSignOut();
        setInitCheckJobsRan(true);
        console.log("the error", error);
      });
  }

  function checkAllJobs() {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.token);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/users/getAllUserJobs`,
      requestOptions
    )
      .then((response) => {
        // const statusCode = response.status;
        // if (statusCode !== 200) {
        //   console.log("Error!", statusCode);
        //   // handleSignOut('Server error')
        //   return;
        // } else
        return response.text();
      })
      .then((result) => {
        if (!result) return;
        let resultObj = JSON.parse(result);
        if (resultObj.message) {
          if (resultObj.message.includes("Redis server is down")) {
            setRedisDown(true);
            return;
          } else {
            setRedisDown(false);
          }
        } else {
          setRedisDown(false);
        }
        let _pendingList = resultObj.filter((obj) => {
          if (obj.jobStatus !== "completed" && obj.jobStatus !== "failed")
            return obj;
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

        // Use functional update form of setState
        setAllPendingList((prevPendingList) => {
          // Compare the previous state with the new value
          if (!_.isEqual(prevPendingList, _pendingList)) {
            // console.log("set the pending, found diff");
            // Return the new value to update the state
            return _pendingList;
          }
          // Return the previous state to keep it unchanged
          return prevPendingList;
        });

        // Use functional update form of setState
        setAllFailedList((prevFailedList) => {
          // Compare the previous state with the new value
          if (!_.isEqual(prevFailedList, _failedList)) {
            // console.log("set the pending, found diff");
            // Return the new value to update the state
            return _failedList;
          }
          // Return the previous state to keep it unchanged
          return prevFailedList;
        });

        // Use functional update form of setState
        setAllCompletedList((prevCompletedList) => {
          // Compare the previous state with the new value
          if (!_.isEqual(prevCompletedList, _completedList)) {
            // console.log("set the pending, found diff");
            // Return the new value to update the state
            return _completedList;
          }
          // Return the previous state to keep it unchanged
          return prevCompletedList;
        });

        // setPendingList(_pendingList);
        // setFailedList(_failedList);
        // setCompletedList(_completedList);
      })
      .catch((error) => {
        // handleSignOut();
        console.log("error", error);
      });
  }

  useEffect(() => {
    // Fetch data initially
    // checkJobs();
    displayMessage(
      "This account is pending approval. Please be patient while we approve all user requests."
    );
    // Fetch data every 15 seconds
    let userJobsInterval, allJobsInterval;
    if (!openSnackbar) {
      userJobsInterval = setInterval(() => {
        checkJobs();
      }, 2000);
    } else {
      clearInterval(userJobsInterval);
    }

    if (role === "admin" && view === "All Jobs Overview") {
      allJobsInterval = setInterval(() => {
        checkAllJobs();
      }, 2000);
    } else {
      clearInterval(allJobsInterval);
    }

    // Clean up interval on unmount
    return () => {
      clearInterval(userJobsInterval);
      clearInterval(allJobsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSnackbar, view]);

  const displayMessage = (msg) => {
    setSnackbarMessage(msg);
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar
            sx={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto", // This divides the toolbar into three sections
            }}
          >
            {/* Left content */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <img
                src={Logo}
                alt="logo"
                width="50"
                height="50"
                sx={{ marginRight: "30px" }}
              />
              {/* <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" }, marginLeft: "20px" }}
            >
              CDE To OMOP
            </Typography> */}

              <Typography>
                {redisDown ? (
                  <>
                    <Tooltip title="Unable to connect to the Redis server">
                      <WarningIcon
                        className="blinking-icon"
                        style={{ margin: "10px", color: "#D6291F" }}
                      />
                    </Tooltip>
                  </>
                ) : (
                  ""
                )}{" "}
              </Typography>
            </Box>

            {/* Centered content */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {view}
              </Typography>
            </Box>

            {/* Right content */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {pendingList && pendingList.length > 0 && (
                <IconButton
                  size="large"
                  aria-label="show pending jobs"
                  // color="inherit"
                  onClick={() => handleIconClick(0)}
                >
                  <Badge badgeContent={pendingList.length} color="error">
                    <Tooltip title="Pending Jobs">
                      <AutorenewIcon
                        className="pending-jobs-icon"
                        style={{ color: "white" }}
                      />
                    </Tooltip>
                  </Badge>
                </IconButton>
              )}
              <Box sx={{ display: { xs: "none", md: "flex" } }}>
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
            </Box>
          </Toolbar>
        </AppBar>
        {renderMobileMenu}
        {renderMenu}

        {openSnackbar && (
          <MuiAlert
            elevation={6}
            variant="filled"
            sx={{}}
            severity="warning" // Change severity to "success", "info", "warning", or "error"
          >
            {snackbarMessage}
          </MuiAlert>
        )}

        {/* </Snackbar> */}
      </Box>
      <Drawer
        sx={{ height: "600px", overflow: "auto" }}
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: "30px",
            // marginTop: "50px",
          }}
        >
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </span>
        {value === 0 && <PendingJobs props={props} />}
        {value === 1 && <CompletedJobs props={props} setOpen={setOpen} />}
        {value === 2 && <FailedJobs props={props} />}
      </Drawer>
    </>
  );
}
