// import logo from './logo.svg';
import "./App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SearchAppBar from "./components/SearchAppBar";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MatchManager from "./pages/MatchManagerPage";
import Archived from "./pages/ArchivedPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import MyAccountPage from "./pages/MyAccountPage";
import Cookies from "js-cookie";
import { Navigate, useLocation } from "react-router-dom";
import jwtDecode from "jwt-decode";
import ProjectManagementPage from "./pages/ProjectManagementPage";
// 008C95
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#008C95', // your custom primary color
    },
    secondary: {
      main: '#008C95', // your custom secondary color
    },
  },
});

const validateJwtToken = async (jwtToken) => {
  try {
    const decodedToken = jwtDecode(jwtToken);
    if (!decodedToken) {
      return null;
    }
    const now = Date.now().valueOf() / 1000;
    if (typeof decodedToken.exp !== "undefined" && decodedToken.exp < now) {
      return null;
    } else {
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + jwtToken);

      var formdata = new FormData();

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/users/validateUser`,
        requestOptions
      );

      if (response.status === 200) {
        return response.text().then((resp) => {
          Cookies.set("user", resp, { expires: 7, secure: true });
          return resp;
        });
      } else {
        Cookies.remove("token");
        Cookies.remove("user");
        return null;
      }
    }
  } catch (error) {
    return null;
  }
};

function ProtectedRoute({
  user,
  children,
  validateJwtToken,
  setUser,
  setToken,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  useEffect(() => {
    // console.log('use effect ran')
    setIsLoading(true);
    const jwtToken = Cookies.get("token");
    setToken(jwtToken);
    const userInfo = Cookies.get("user");
    if (!jwtToken || !userInfo) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const validateUser = async () => {
      const result = await validateJwtToken(jwtToken);
      // console.log('result', result)
      setUser(result);
      setIsLoading(false);
    };

    validateUser();
  }, [location, setUser, validateJwtToken]);

  if (isLoading) {
    return <div></div>;
  }

  if (!user) {
    Cookies.remove("token");
    Cookies.remove("user");
    return <Navigate to="/signin" replace />;
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const updateUser = (newUser) => {
    setUser(newUser);
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <header className="App-header">
          <BrowserRouter>
            <div>
              {user && <SearchAppBar updateUser={updateUser} />}
              <Routes>
                <Route
                  path="/"
                  element={<SignInPage updateUser={updateUser}></SignInPage>}
                  exact
                />
                <Route
                  path="/match-manager"
                  element={
                    <ProtectedRoute
                      user={user}
                      setUser={setUser}
                      validateJwtToken={validateJwtToken}
                      token={token}
                      setToken={setToken}
                    >
                      <MatchManager token={token}></MatchManager>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/archived"
                  element={
                    <ProtectedRoute
                      user={user}
                      setUser={setUser}
                      validateJwtToken={validateJwtToken}
                      token={token}
                      setToken={setToken}
                    >
                      <Archived token={token}></Archived>
                    </ProtectedRoute>
                  }
                  exact
                />
                <Route
                  path="/myaccount"
                  element={
                    <ProtectedRoute
                      user={user}
                      setUser={setUser}
                      validateJwtToken={validateJwtToken}
                      token={token}
                      setToken={setToken}
                    >
                      <MyAccountPage user={user} token={token}></MyAccountPage>
                    </ProtectedRoute>
                  }
                  exact
                />
                <Route
                  path="/project-management"
                  element={
                    <ProtectedRoute
                      user={user}
                      setUser={setUser}
                      validateJwtToken={validateJwtToken}
                      token={token}
                      setToken={setToken}
                    >
                      <ProjectManagementPage
                        user={user} token={token}
                      ></ProjectManagementPage>
                    </ProtectedRoute>
                  }
                  exact
                />
                <Route
                  path="/signin"
                  element={<SignInPage updateUser={updateUser}></SignInPage>}
                  exact
                />
                <Route
                  path="/signup"
                  element={<SignUpPage></SignUpPage>}
                  exact
                />
                <Route component={Error} />
              </Routes>
            </div>
          </BrowserRouter>
        </header>
      </div>
    </ThemeProvider>
  );
}

export default App;
