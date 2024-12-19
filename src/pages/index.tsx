import { lazy } from "solid-js";

export { Home } from "./home";

export { preloadDmId } from "./dm/dm-id";
export const GroupId = lazy(() => import("./group/group-id"));
export const DmId = lazy(() => import("./dm/dm-id"));

export const Overview = lazy(() => import("./overview"));
