const OAuth2 = require("oauth").OAuth2;
var jwt = require("jsonwebtoken");
const axios = require("axios");
// Initialize the OAuth2 client
const CLIENT_ID = process.env.ORCID_CLIENT_ID;
const CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET;
const AUTHORIZATION_URL = process.env.ORCID_AUTH_URL;
const TOKEN_URL = process.env.ORCID_TOKEN_URL;
const REDIRECT_URI = process.env.ORCID_REDIRECT_URI;
const oauth2 = new OAuth2(
  CLIENT_ID, //client ID
  CLIENT_SECRET, //client secret
  "", // Base URL is not needed for OAuth 2.0
  AUTHORIZATION_URL,
  TOKEN_URL,
  null // Custom headers are not needed
);

async function orcidLogin(req, res) {
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Add this at the top of your file

  // Generate the authorization URL and redirect the user to ORCID
  const authURL = oauth2.getAuthorizeUrl({
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "/authenticate openid",
  });
  res.redirect(authURL);
}

async function orcidCallback(req, res) {
  // Route for handling the OAuth 2.0 callback
  // Get the authorization code from the query parameters
  const code = req.query.code;

  // Exchange the authorization code for an access token
  oauth2.getOAuthAccessToken(
    code,
    { grant_type: "authorization_code", redirect_uri: REDIRECT_URI },
    async (error, accessToken, refreshToken, results) => {
      if (error) {
        console.log("error", error);
        res.send("Error during ORCID login");
      } else {
        // Get the user's ORCID iD from the access token response
        const orcidId = results.orcid;
        console.log("results", results);
        console.log("accesstoken", accessToken);
        const decoded = jwt.decode(results.id_token);
        console.log(decoded);
        // Create a JWT payload with the user's ORCID iD
        let firstName, lastName
        if(decoded){
          firstName = decoded.given_name
          lastName = decoded.family_name
        }else{
          firstName = results.name
          lastName = ""
        }
        const jwtPayload = {
          user: "orcidUser",
          orcidId: orcidId,
          firstName: firstName,
          lastName: lastName,
          role: "default",
        };

        // Sign the JWT with the secret key
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, {
          expiresIn: "1h",
        });

        // Store the JWT in a cookie
        res.cookie("token", token, { httpOnly: true });
        // Store the user information in another cookie (optional)
        res.cookie(
          "user",
          JSON.stringify({
            user: "orcidUser",
            orcidId: orcidId,
            firstName: firstName,
            lastName: lastName,
            role: "default",
          })
        );

        //need to attempt to get email address from ORCID, won't always get an email address if unverified or private emails, just store orcid id if no email found

        // Redirect the user to the /myaccount route and pass the ORCID iD as a query parameter
        res.redirect(
          `${process.env.FRONTEND_URL}/myaccount?orcidId=${orcidId}`
        );
        // Use the ORCID iD in your application (e.g., log in the user)
        // res.send(`Logged in with ORCID iD: ${orcidId}`);
        const orcidRecord = await getOrcidRecord(accessToken, orcidId);
        console.log("orcidRecord", orcidRecord);
        if (!orcidRecord) return;
        else {
          res.send({
            orcidId: orcidId,
            orcidRecord: orcidRecord,
          });
        }
      }
    }
  );
}

async function orcidLogout(req, res) {
  // Clear the JWT cookie by setting its value to an empty string and its expiration date to the past
  // console.log('orcidLogout', res.cookie)
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.cookie("user", "", { httpOnly: true, expires: new Date(0) });

  // Optionally, clear any other cookies you want to remove here

  // Send a response indicating successful sign out
  res.json({ message: "Signed out successfully" });
}

async function getOrcidRecord(accessToken, orcidId) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    const response = await axios.get(
      `${process.env.ORCID_RECORD_URL}${orcidId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(error.response.data);
    // throw new Error('Failed to retrieve ORCID record');
  }
}

module.exports = {
  orcidLogin,
  orcidCallback,
  orcidLogout,
};
