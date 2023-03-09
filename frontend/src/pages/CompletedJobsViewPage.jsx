import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { useState, useEffect, useMemo } from "react";
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
      if (_jobId) setJobId(_jobId);
      if (_data) importExcel(JSON.parse(_data));
    }
  }, []);

  function importExcel(e) {
    //removing header

    // fileData.splice(0, 1);
    // const filteredArr = fileData.map((arr) => arr.filter(Boolean));
    // console.log("fileData", filteredArr);

    //group into subRows
    const result = [];
    let currentRedcapFieldLabel = null;
    let currentItem = null;

    e.forEach((item, index) => {
      if (item.redcapFieldLabel !== currentRedcapFieldLabel) {
        if (currentItem) {
          result.push(currentItem);
        }
        item.selected = 'true';
        currentItem = { ...item, subRows: [] };
        currentRedcapFieldLabel = item.redcapFieldLabel;
      } else {
        currentItem.subRows.push({ ...item, selected: 'false' });
      }

      if (index === e.length - 1) {
        result.push(currentItem);
      }
    });

    console.log("result", result);

    const headers = Object.keys(result[0]).map((key) => {
      if (key !== 'subRows') {
      return {
        accessorKey: key.replace(/\./g, ""),
        header: key.replace(/\./g, ""),
      };
    }else return null
    }).filter((header) => header !== null);;
    setColDefs(headers);

    setData(result);
    setCSVFilename(`Completed_Job_${_jobId}.csv`);
    setIsFormLoaded(true);
  }

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
    setIsFormLoaded(false);
    setJobId();
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
    </Container>
  );
}
