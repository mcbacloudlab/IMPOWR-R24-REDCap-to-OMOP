async function getJobVerificationInfo(jobId, formName, token) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    var data = {
      jobId: jobId,
      formName: formName,
    };
  
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };
  
    return fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/queue/getJobVerifyinfo`,
      requestOptions
    )
      .then((response) => {
        if (response.ok) return response.text();
        else throw new Error("Error");
      })
      .then((result) => {
        console.log('returning job verify data',JSON.parse(result) )
        return JSON.parse(result);
      });
  }
  
  module.exports = { getJobVerificationInfo };
  