import { createSignal, Show, type Component, type JSX } from "solid-js";
import { type RouteSectionProps, useNavigate } from "@solidjs/router";

import { setDb, SQL } from "~/db";
import { Portal } from "solid-js/web";
import { Flex } from "~/components/ui/flex";
import { Title } from "@solidjs/meta";

export const Home: Component<RouteSectionProps> = () => {
  const [isLoadingDb, setIsLoadingDb] = createSignal(false);
  const navigate = useNavigate();

  const onFileChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        setIsLoadingDb(true);

        setTimeout(() => {
          const Uints = new Uint8Array(reader.result as ArrayBuffer);
          setDb(new SQL.Database(Uints));
          setIsLoadingDb(false);
          navigate("/overview");
        }, 10);
      });

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <>
      <Portal>
        <Show when={isLoadingDb()}>
          <Flex alignItems="center" justifyContent="center" class="fixed inset-0 backdrop-blur-lg backdrop-filter">
            <p class="font-bold text-2xl">Loading database</p>
          </Flex>
        </Show>
      </Portal>
      <Title>Signal stats</Title>
      <div>
        <input type="file" accept=".sqlite" onChange={onFileChange}></input>
      </div>
    </>
  );
};

export default Home;
