import { lazy } from "solid-js";

export { Home } from "./home";

export const GroupId = lazy(() => import("./group/group-id"));
export const DmId = lazy(() => import("./dm/dm-id"));

export const Overview = lazy(() => import("./overview"));
