import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
// import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
// import Paper from "@mui/material/Paper";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
// import { Typography } from "@mui/material";
// import AdminSection from "../components/MyAccountAdminSection";
import MyAccountNavBar from "../components/MyAccountNavBar";


export default function MyAccountPage(props) {
  // console.log("myaccount", props);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [orcidBool, setOrcidBool] = useState(false)

  useEffect(() => {
    try {
      let userCookie =(Cookies.get("user"));
      let userInfo
      if(userCookie){
        userCookie = JSON.parse(userCookie)
        setUsername(userCookie.email);
        setName(userCookie.firstName + " " + userCookie.lastName);
        if(userCookie.orcidId){
          setOrcidBool(true)
        }
        userInfo = JSON.parse(props.user);
      }
      // console.log('usercook', userCookie)
      // console.log("userInfo.", userInfo);
      if(!userInfo){
        setRole(null)
      }else{
        setRole(userInfo.role);
      }
      
    } catch (error) {
      console.log("error", error);
    }
  }, [props.user]);

  return (
      <Container component="main" maxWidth="90%">
        <CssBaseline />
          <MyAccountNavBar props={props} username={username} name={name} role={role} orcidBool={orcidBool}/>
        {/* </Paper> */}
      </Container>
  );
}
