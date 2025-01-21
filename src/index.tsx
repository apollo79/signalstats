/* @refresh reload */
import { MetaProvider } from "@solidjs/meta";
import { Router, useNavigate } from "@solidjs/router";
import { render } from "solid-js/web";
import App from "./App";
import { hasCashedData } from "./lib/db-cache";
import { createEffect, Show } from "solid-js";
import { dbLoaded } from "./db";
import { Callout, CalloutContent, CalloutTitle } from "./components/ui/callout";
import { A } from "./components/ui/A";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

if (root) {
  render(
    () => (
      <div class="mx-auto max-w-screen-2xl">
        <MetaProvider>
          <Router
            root={(props) => {
              const navigate = useNavigate();

              createEffect(() => {
                if (!dbLoaded() && !hasCashedData() && props.location.pathname !== "/") {
                  navigate("/");
                }
              });

              return (
                <>
                  <Show
                    when={props.location.pathname !== "/" && !dbLoaded() && hasCashedData()}
                    fallback={
                      <Show when={!dbLoaded() && hasCashedData()}>
                        <Callout variant="default" class="my-4">
                          There is currently no backup database loaded, but you can watch statistics that have been
                          cached, meaning only chats you already opened or chats that were preloaded.
                          <br />
                          <A href="/overview">Watch cached statistics</A>
                        </Callout>
                      </Show>
                    }
                  >
                    <Callout variant="warning" class="my-4">
                      <CalloutTitle>You are watching cached statistics</CalloutTitle>
                      <CalloutContent>
                        Currently there is no backup database loaded. You can only watch statistics that have been
                        cached, meaning only chats you already opened or chats that were preloaded.
                        <br />
                        <A href="/">Load a backup</A>
                      </CalloutContent>
                    </Callout>
                  </Show>
                  {props.children}
                </>
              );
            }}
          >
            <App />
          </Router>
        </MetaProvider>
      </div>
    ),
    root,
  );
}
