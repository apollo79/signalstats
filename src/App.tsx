import { type Component } from "solid-js";
import { Route } from "@solidjs/router";
import { Home, Overview } from "./pages";

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
    </>
  );
};

export default App;
