import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Cookies from "js-cookie";
import { useState, useEffect, useMemo } from "react";
import { Typography } from "@mui/material";
import AdminSection from "../components/MyAccountAdminSection";
import MyAccountNavBar from "../components/MyAccountNavBar";
import { useLocation } from "react-router-dom";
import CompletedJobTable from "../components/CompletedJobTable";
import { ExportToCsv } from "export-to-csv";

var XLSX = require("xlsx");
export default function CompletedJobsViewPage(props) {
  const [data, setData] = useState("");
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [jobId, setJobId] = useState();
  const [csvFilename, setCSVFilename] = useState("");

  const location = useLocation();
  let _jobId, _data;
  if (location.state.jobId) {
    _jobId = location.state.jobId;
    _data = location.state.result;
  }

  const columns = useMemo(() => colDefs, [colDefs]);

  useEffect(() => {
    if (_data) {
      if(_jobId) setJobId(_jobId)
      if (_data) importExcel(JSON.parse(_data));
    }
  }, []);

  function importExcel(e) {
    // console.log('e', [].concat(...e))
    let joinedArrays = [].concat(...e);
    console.log("joinedArrays", joinedArrays);
    const file = joinedArrays;
    // setCSVFilename(file.name);

    const workSheet = XLSX.utils.json_to_sheet(file);
    //convert to array
    const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
    let headers = fileData[0];

    headers = headers.filter((key) => key !== "redCapKeys");
    console.log("headers", headers);
    const heads = headers.map((head) => {
      return {
        accessorKey: head.replace(/\./g, ""),
        header: head.replace(/\./g, ""),
      };
    });
    setColDefs(heads);
    //removing header

    fileData.splice(0, 1);
    const filteredArr = fileData.map((arr) => arr.filter(Boolean));
    console.log("fileData", filteredArr);

    setData(convertToJson(headers, filteredArr));
    // setApprovedData(convertToJson(headers, fileData, true));
    // setIsLoading(false);
    setIsFormLoaded(true);
  }

  const convertToJson = (headers, data, approved) => {
    const rows = [];
    let approvedIdx = headers.indexOf("Approved");
    data.forEach((row) => {
      let rowData = {};
      row.forEach((element, index) => {
        if (approved) {
          if (row[approvedIdx] === "Y") {
            rowData[headers[index]] = element;
          }
        } else {
          rowData[headers[index]] = element;
        }
      });
      if (Object.keys(rowData).length !== 0) {
        rows.push(rowData);
      }
    });
    return rows;
  };

  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    filename: csvFilename.replace(/\.[^/.]+$/, ""),
    showLabels: true,
    useBom: false,
    useKeysAsHeaders: false,
    headers: colDefs.map((c) => {
      return c.header;
    }),
  };
  const csvExporter = new ExportToCsv(csvOptions);
  const handleExportData = () => {
    let _data = data;
    // if (selectedTabIdx) {
    //   _data = approvedData; //change export data if on approved tab
    // }
    let keys = _data.reduce(function (acc, obj) {
      Object.keys(obj).forEach(function (key) {
        if (!acc.includes(key)) acc.push(key);
      });
      return acc;
    }, []);

    _data.forEach(function (obj) {
      keys.forEach(function (key) {
        if (!obj[key]) obj[key] = "";
      });
    });

    csvExporter.generateCsv(_data);
  };

  function resetScreen() {
    setData("");
    // setApprovedData("");
    // setIsLoading(false);
    // setCSVFilename("");
    setIsFormLoaded(false);
    setJobId()
    // setSelectedFile("");
  }

  return (
    <Container component="main" maxWidth="90%">
      <CssBaseline />
      <h1>Completed Job {jobId}</h1>
      {isFormLoaded && (
        <CompletedJobTable
          props={props}
          columns={columns}
          data={data}
          handleExportData={handleExportData}
          resetScreen={resetScreen}
        />
      )}

      {/* <MyAccountNavBar props={props} username={username} name={name} role={role}/> */}
      {/* </Paper> */}
    </Container>
  );
}
