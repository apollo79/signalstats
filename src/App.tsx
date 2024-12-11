import { type Component } from "solid-js";
import { Route } from "@solidjs/router";

import { Home, Overview } from "./pages";

import "./app.css";

const App: Component = () => {
  return (
    <>
      <Route
        path="/"
        component={Home}
      />
      <Route
        path="/overview"
        component={Overview}
      />
      <Route path="/thread/:threadid" />
    </>
  );
};

export default App;
