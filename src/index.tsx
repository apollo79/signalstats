/* @refresh reload */
import { MetaProvider } from "@solidjs/meta";
import { Router, useNavigate } from "@solidjs/router";
import { Portal, render } from "solid-js/web";
import App from "./App";
import { hasCashedData } from "./lib/db-cache";
import { createEffect, Show } from "solid-js";
import { dbLoaded } from "./db";
import { Callout, CalloutContent, CalloutTitle } from "./components/ui/callout";
import { A } from "./components/ui/A";
import { isWasmSupported } from "./lib/utils";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

const NO_DATA_NEEDED_PAGES = ["/", "/privacy"];

if (root) {
  render(
    () => (
      <div class="mx-auto max-w-screen-2xl">
        <MetaProvider>
          <Router
            root={(props) => {
              const navigate = useNavigate();

              createEffect(() => {
                if (!dbLoaded() && !hasCashedData() && !NO_DATA_NEEDED_PAGES.includes(props.location.pathname)) {
                  navigate("/");
                }
              });

              const wasmSupport = isWasmSupported();

              return (
                <>
                  <Show when={!wasmSupport}>
                    <Portal>
                      <div class="fixed inset-0 mx-4 flex flex-col items-center justify-center backdrop-blur-lg">
                        <Callout variant="error">
                          Your browser does not support WebAssembly, which is required for this site to work with the
                          big amount of data a signal backup contains.
                          <br />
                          Please try a different browser.
                        </Callout>
                      </div>
                    </Portal>
                  </Show>
                  <Show
                    when={props.location.pathname !== "/" && !dbLoaded() && hasCashedData()}
                    fallback={
                      <Show when={!dbLoaded() && hasCashedData()}>
                        <Callout variant="default" class="m-4">
                          There is currently no backup database loaded, but you can watch statistics that have been
                          cached, meaning only chats you already opened or chats that were preloaded.
                          <br />
                          <A
                            href="/overview"
                            onClick={() => {
                              umami.track("Watch cached statistics");
                            }}
                          >
                            Watch cached statistics
                          </A>
                        </Callout>
                      </Show>
                    }
                  >
                    <Callout variant="warning" class="m-4">
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
                  <div class="flex flex-row justify-end bg-muted p-8">
                    <A href="/privacy">Privacy policy</A>
                  </div>
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
