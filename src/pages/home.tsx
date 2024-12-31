import { useNavigate, type RouteSectionProps } from "@solidjs/router";
import { createSignal, Show, type Component, type JSX } from "solid-js";

import { Title } from "@solidjs/meta";
import { Portal } from "solid-js/web";
import { Flex } from "~/components/ui/flex";

import {
  Progress,
  ProgressLabel,
  ProgressValueLabel,
} from "~/components/ui/progress";
// import { db } from "~/db";
import { loadDb } from "~/db-queries";
import { decryptBackup } from "~/lib/decryptor";

export const Home: Component<RouteSectionProps> = () => {
  const [decryptionProgress, setDecryptionProgress] = createSignal<number>();
  const [isLoadingDatabase, setIsLoadingDatabase] = createSignal(false);
  const [passphrase, setPassphrase] = createSignal("");
  const navigate = useNavigate();

  const onFileChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (
    event,
  ) => {
    const file = event.currentTarget.files?.[0];
    const currentPassphrase = passphrase();

    if (file && currentPassphrase) {
      decryptBackup(file, currentPassphrase, setDecryptionProgress)
        .then((result) => {
          setDecryptionProgress(undefined);
          setIsLoadingDatabase(true);

          setTimeout(() => {
            loadDb(result.database_statements);

            setIsLoadingDatabase(false);

            navigate("/overview");
          }, 0);
        })
        .catch((error) => {
          console.error("Decryption failed:", error);
        });
    }
  };

  return (
    <>
      <Portal>
        <Flex
          flexDirection="col"
          alignItems="center"
          justifyContent="center"
          class="fixed inset-0 backdrop-blur-lg backdrop-filter gap-y-8"
          classList={{
            hidden: decryptionProgress() === undefined && !isLoadingDatabase(),
          }}
        >
          <Show when={decryptionProgress() !== undefined}>
            <p class="font-bold text-2xl">Decrypting database</p>
            <Progress
              value={decryptionProgress()}
              minValue={0}
              maxValue={100}
              getValueLabel={({ value }) => `${value}%`}
              class="w-[300px] space-y-1"
            >
              <div class="flex justify-between">
                <ProgressLabel>Processing...</ProgressLabel>
                <ProgressValueLabel />
              </div>
            </Progress>
          </Show>
          <Show when={isLoadingDatabase()}>
            <p class="font-bold text-2xl">Loading database</p>
          </Show>
        </Flex>
      </Portal>
      <Title>Signal stats</Title>
      <div>
        <input
          type="password"
          onChange={(event) => setPassphrase(event.currentTarget.value)}
        />
        <input type="file" accept=".backup" onChange={onFileChange} />
      </div>
    </>
  );
};

export default Home;
