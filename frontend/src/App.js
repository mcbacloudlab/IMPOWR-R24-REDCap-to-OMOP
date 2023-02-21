// import logo from './logo.svg';
import "./App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SearchAppBar from "./components/SearchAppBar";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MatchManager from "./pages/MatchManager";
import Archived from "./pages/Archived";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import MyAccountPage from "./pages/MyAccountPage";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [user, setUser] = useState(null);

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
          return "loggedIn";
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

  const ProtectedRoute = ({ user, children }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const jwtToken = Cookies.get("token");
      const userInfo = Cookies.get("user")
      if (!jwtToken || !userInfo) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const validateUser = async () => {
        const result = await validateJwtToken(jwtToken);
        setUser(result);
        setIsLoading(false);
      };

      validateUser();
    }, []);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      Cookies.remove("token");
      Cookies.remove("user");
      return <Navigate to="/signin" replace />;
    }

    return children;
  };

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  useEffect(() => {
    // perform additional actions when user is updated here
  }, [user]);

  return (
    <ThemeProvider theme={darkTheme}>
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
                    <ProtectedRoute user={user}>
                      <MatchManager></MatchManager>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/archived"
                  element={
                    <ProtectedRoute user={user}>
                      <Archived></Archived>
                    </ProtectedRoute>
                  }
                  exact
                />
                <Route
                  path="/myaccount"
                  element={
                    <ProtectedRoute user={user}>
                      <MyAccountPage></MyAccountPage>
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
