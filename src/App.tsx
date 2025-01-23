import { Route } from "@solidjs/router";
import { type Component } from "solid-js";
import { DmId, GroupId, Home, Overview, preloadDmId, Privacy } from "./pages";

import "./app.css";

const App: Component = () => {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/overview" component={Overview} />
      <Route path="/dm/:dmid" component={DmId} preload={preloadDmId} />
      <Route path="/group/:groupid" component={GroupId} />
      <Route path="/privacy" component={Privacy} />
    </>
  );
};

export default App;
