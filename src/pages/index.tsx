import { lazy } from "solid-js";

export { Home } from "./home";

export const Overview = lazy(() => import("./overview"));
