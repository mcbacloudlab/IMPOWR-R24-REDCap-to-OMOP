import { useState, useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export default function FormSelect(props) {
  console.log("form select props", props);
  const [selectedForm, setSelectedForm] = useState("");

  //   const forms = ["bioinformatics_core_participants", "bioinformatics_core_activity_survey"];

  const handleChange = (event) => {
    setSelectedForm(event.target.value);
  };

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
    </FormControl>
  );
}
