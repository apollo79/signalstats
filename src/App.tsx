import { type Component } from "solid-js";
import { Route } from "@solidjs/router";

import { allThreadsOverviewQuery } from "./db";
import { DmId, GroupId, Home, Overview } from "./pages";

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
      <Route
        path="/dm/:dmid"
        component={DmId}
      />
      <Route
        path="/group/:groupid"
        component={GroupId}
      />
      <Route
        path="/test"
        component={() => {
          console.time("first");
          console.log(allThreadsOverviewQuery());
          void allThreadsOverviewQuery().then((result) => {
            console.log(result);
            console.timeEnd("first");
            console.time("second");
            void allThreadsOverviewQuery().then((result) => {
              console.log(result);
              console.timeEnd("second");
            });
          });
          return "";
        }}
      />
    </>
  );
};

export default App;
