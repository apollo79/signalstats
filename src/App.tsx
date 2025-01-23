import { A, Route, Router, useNavigate } from "@solidjs/router";
import { createEffect, Show, Suspense, type Component } from "solid-js";
import { DmId, GroupId, Home, Overview, preloadDmId, Privacy } from "./pages";

import "./app.css";
import { MetaProvider } from "@solidjs/meta";
import { Portal } from "solid-js/web";
import { Callout, CalloutTitle, CalloutContent } from "./components/ui/callout";
import { dbLoaded } from "./db";
import { hasCashedData } from "./lib/db-cache";
import { isWasmSupported } from "./lib/utils";
import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";
import { ModeToggle } from "./components/ui/mode-toggle";

const NO_DATA_NEEDED_PAGES = ["/", "/privacy"];

const App: Component = () => {
  const storageManager = createLocalStorageManager("vite-ui-theme");
  return (
    <div class="mx-auto max-w-(--breakpoint-2xl)">
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
                <ColorModeScript storageType={storageManager.type} />
                <ColorModeProvider storageManager={storageManager}>
                  <header class="flex justify-end bg-accent p-4">
                    <ModeToggle />
                  </header>
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
                  <main class="px-4 md:px-0">
                    <Suspense>{props.children}</Suspense>
                  </main>
                  <footer class="mt-4 flex flex-row justify-end bg-muted p-8">
                    <A href="/privacy">Privacy policy</A>
                  </footer>
                </ColorModeProvider>
              </>
            );
          }}
        >
          <Route path="/" component={Home} />
          <Route path="/overview" component={Overview} />
          <Route path="/dm/:dmid" component={DmId} preload={preloadDmId} />
          <Route path="/group/:groupid" component={GroupId} />
          <Route path="/privacy" component={Privacy} />{" "}
        </Router>
      </MetaProvider>
    </div>
  );
};

export default App;
