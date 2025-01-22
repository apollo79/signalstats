import { useNavigate, type RouteSectionProps } from "@solidjs/router";
import { createSignal, type JSX, Show, type Component } from "solid-js";

import { Title } from "@solidjs/meta";
import { Portal } from "solid-js/web";
import { Flex } from "~/components/ui/flex";

import { Progress, ProgressLabel, ProgressValueLabel } from "~/components/ui/progress";
import { loadDb } from "~/db";
import { decryptBackup } from "~/lib/decryptor";
import { createDropzone, createFileUploader } from "@solid-primitives/upload";
import { Button } from "~/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";

export const Home: Component<RouteSectionProps> = () => {
  const navigate = useNavigate();

  const fileUploader = createFileUploader({
    accept: ".backup",
    multiple: false,
  });

  const dropzone = createDropzone({
    onDrop: (files) => {
      const file = files.at(0);

      if (file?.name.endsWith(".backup")) {
        setBackupFile(file.file);
      }
    },
  });

  const [passphrase, setPassphrase] = createSignal("");
  const [backupFile, setBackupFile] = createSignal<File>();

  const [decryptionProgress, setDecryptionProgress] = createSignal<number>();
  const [loadingProgress, setLoadingProgress] = createSignal<number>();
  // const [isLoadingDatabase, setIsLoadingDatabase] = createSignal(false);

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();

    const currentBackupFile = backupFile();
    const currentPassphrase = passphrase();

    if (currentBackupFile && currentPassphrase) {
      // const hashChunk = await currentBackupFile.slice(-1000).text();
      // const hash = hashString(hashChunk);

      // if (hash === dbHash()) {
      //   return;
      // }

      // setDbHash(hash);

      decryptBackup(currentBackupFile, currentPassphrase, setDecryptionProgress)
        .then(async (decrypted) => {
          umami.track("Decrypt backup");
          setDecryptionProgress(undefined);
          // setIsLoadingDatabase(true);
          setLoadingProgress(0);

          await loadDb(decrypted.database_statements, setLoadingProgress);
          umami.track("Load database");

          // setIsLoadingDatabase(false);
          setLoadingProgress(undefined);

          navigate("/overview");
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
          class="fixed inset-0 gap-y-8 backdrop-blur-lg backdrop-filter"
          classList={{
            // hidden: decryptionProgress() === undefined && !isLoadingDatabase(),
            hidden: decryptionProgress() === undefined && loadingProgress() === undefined,
          }}
        >
          <Show when={decryptionProgress() !== undefined}>
            <p class="font-bold text-2xl">Decrypting backup</p>
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
          <Show when={loadingProgress() !== undefined}>
            {/* <p class="font-bold text-2xl">Loading database</p>
            <p class="text-muted-foreground">This can take some time</p> */}
            <p class="font-bold text-2xl">Loading database</p>
            <Progress
              value={loadingProgress()}
              minValue={0}
              maxValue={100}
              getValueLabel={({ value }) => `${value}%`}
              class="w-[300px] space-y-1"
            >
              <div class="flex justify-between">
                <ProgressLabel>Loading...</ProgressLabel>
                <ProgressValueLabel />
              </div>
            </Progress>
          </Show>
        </Flex>
      </Portal>
      <Title>Signal stats</Title>
      <form class="flex flex-col gap-y-8 p-8" onSubmit={onSubmit}>
        <TextField onChange={(value) => setPassphrase(value)}>
          <TextFieldLabel>Passphrase</TextFieldLabel>
          <TextFieldInput type="password" class="max-w-md" />
        </TextField>
        <Flex
          ref={dropzone.setRef}
          justifyContent="center"
          alignItems="center"
          class="relative min-h-32 min-w-96 max-w-xl rounded-lg border-4 border-border border-dashed"
          classList={{
            "border-ring": dropzone.isDragging(),
          }}
        >
          <Button
            onClick={() =>
              fileUploader.selectFiles((files) => {
                setBackupFile(files.at(0)?.file);
              })
            }
          >
            Select backup file
          </Button>
          <span
            class="absolute bottom-2"
            classList={{
              "text-muted-foreground": !backupFile(),
            }}
          >
            {backupFile() ? backupFile()?.name : "or drop the file here"}
          </span>
        </Flex>
        <Button type="submit" class="max-w-72">
          Decrypt and load backup
        </Button>
      </form>
    </>
  );
};

export default Home;
