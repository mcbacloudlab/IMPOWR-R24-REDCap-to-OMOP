import { useState, useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

export default function FormSelect(props) {
  const [selectedForm, setSelectedForm] = useState("");

  //   const forms = ["bioinformatics_core_participants", "bioinformatics_core_activity_survey"];
  function getDataDictionary(event){
    console.log('getdatadictionary', selectedForm)
  }  

  useEffect(() => {
    console.log("the prop select", props.forms[0]);
    console.log("typeof", typeof props.forms[0]);
    setSelectedForm(props.forms[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleChange = (event) => {
    console.log("handle change");
    setSelectedForm(event.target.value);
  };
  if (props.forms.length > 0) {
    return (
      <FormControl>
        <InputLabel id="select-form-label">Select a Form</InputLabel>
        <Select
          labelId="select-form-label"
          id="select-form"
          value={selectedForm || (props.forms && props.forms[0])} // add a null check before accessing the array
          onChange={handleChange}
        >
          {props.forms.map((form) => (
            <MenuItem key={form} value={form}>
              {form}
            </MenuItem>
          ))}
        </Select>
        <Button
        variant="contained"
        component="label"
        startIcon={<AddIcon />}
        onClick={(e) => getDataDictionary(e)}
      >
        Import Data Dictionary
      </Button>
      </FormControl>
    );
  }
}
