import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Link,
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
import TemporaryDrawer from "./TemporaryDrawer";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import ErrorIcon from "@mui/icons-material/Error";
import { styled, alpha } from "@mui/material/styles";
import blank_avatar from "../assets/blank_avatar.jpg";
import CompletedJobs from "./CompletedJobs";
import FailedJobs from "./FailedJobs";
import PendingJobs from "./PendingJobs";
import CloseIcon from "@mui/icons-material/Close";
import OMOPLogo from "../assets/6570077.png";
import REDCapLogo from "../assets/redcap_logo_high_res_white_on_black.svg";

export default function SearchAppBar(props) {
  // console.log('search bar', props.user)
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);
  // const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  // const [jobs, setJobs] = useState();

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const navigate = useNavigate();

  useEffect(() => {
    try {
      let userCookie = JSON.parse(Cookies.get("user"));
      // setUsername(userCookie.email);
      setName(userCookie.firstName + " " + userCookie.lastName);
      let userInfo
      // console.log('the props!!!', props)
      if (props.user) {
        userInfo = JSON.parse(props.user);
      }
      // console.log("prfewefwefops.", userInfo);
      setRole(userInfo.role);
    } catch (error) {
      console.log("error", error);
    }
  }, [props.user]);

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

  const StyledAccount = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(2, 2.5),
    marginTop: "10px",
    borderRadius: Number(theme.shape.borderRadius) * 1.5,
    backgroundColor: alpha(theme.palette.grey[500], 0.12),
    color: "white",
  }));

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
      <Box sx={{ mb: 1, mx: 2.5 }}>
        <Link underline="none">
          <StyledAccount>
            <Avatar src={blank_avatar} alt="photoURL" />

            <Box sx={{ ml: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
                <b>{name}</b>
              </Typography>

              <Typography variant="body2" sx={{ color: "text.primary" }}>
                {role}
              </Typography>
            </Box>
          </StyledAccount>
        </Link>
      </Box>
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
        props.setPendingList(_pendingList);
        props.setFailedList(_failedList);
        props.setCompletedList(_completedList);
      })
      .catch((error) => {
        handleSignOut();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <TemporaryDrawer />
            {/* <Avatar alt="Redcap Logo" sx={{backgroundColor: 'transparent'}}>
              <img
                src={REDCapLogo}
                alt="Redcap Logo"
                style={{
                  objectFit: "contain",
                  maxHeight: "100%",
                  maxWidth: "100%",
                  backgroundColor: 'transparent'
                }}
              />
            </Avatar> */}

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              REDCap To OMOP
            </Typography>
            {/* <Avatar alt="Redcap Logo">
              <img
                src={OMOPLogo}
                alt="OMOP Logo"
                style={{
                  objectFit: "contain",
                  maxHeight: "100%",
                  maxWidth: "100%",
                }}
              />
            </Avatar>
            */}

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
