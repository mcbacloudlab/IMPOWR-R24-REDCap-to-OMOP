import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import AdminSection from "../components/MyAccountAdminSection";
import MyAccountNavBar from "../components/MyAccountNavBar";

export default function MyAccountPage(props) {
  // console.log("props", props);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  useEffect(() => {
    try {
      let userCookie = JSON.parse(Cookies.get("user"));
      setUsername(userCookie.email);
      setName(userCookie.firstName + " " + userCookie.lastName);
      let userInfo = JSON.parse(props.user);
      // console.log("prfewefwefops.", userInfo);
      setRole(userInfo.role);
    } catch (error) {
      console.log("error", error);
    }
  }, [props.user]);

  return (
      <Container component="main" maxWidth="90%">
        <CssBaseline />
          <MyAccountNavBar props={props} username={username} name={name} role={role}/>
        {/* </Paper> */}
      </Container>
  );
}