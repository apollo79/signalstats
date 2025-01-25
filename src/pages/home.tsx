import { createDropzone, createFileUploader } from "@solid-primitives/upload";
import { Title } from "@solidjs/meta";
import { type RouteSectionProps, useNavigate } from "@solidjs/router";
import { Eye, EyeClosed } from "lucide-solid";
import { type Component, type JSX, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { Button } from "~/components/ui/button";
import { Flex } from "~/components/ui/flex";
import { Progress, ProgressLabel, ProgressValueLabel } from "~/components/ui/progress";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import { loadDb } from "~/db";
import { decryptBackup } from "~/lib/backup-decryptor";
import * as m from "~/paraglide/messages";

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
  const [totalStatements, setTotalStatements] = createSignal(0);
  const [executedStatements, setExecutedStatements] = createSignal(0);

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();

    const currentBackupFile = backupFile();
    const currentPassphrase = passphrase();

    if (currentBackupFile && currentPassphrase) {
      console.time();
      decryptBackup(currentBackupFile, currentPassphrase, setDecryptionProgress, async (statements) => {
        const length = statements.length;
        setTotalStatements((oldValue) => oldValue + length);
        const prevExecutedStatements = executedStatements();

        await loadDb(statements, (progress) => {
          setExecutedStatements(Math.round(prevExecutedStatements + (progress / 100) * length));
        });

        setExecutedStatements(prevExecutedStatements + length);
      })
        .then(() => {
          umami.track("Decrypt backup");
          umami.track("Load database");

          console.timeEnd();
          navigate("/overview");
        })
        .catch((error) => {
          console.error("Decryption failed:", error);
        });
    }
  };

  const [showPassphrase, setShowPassphrase] = createSignal(false);

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
            hidden: decryptionProgress() === undefined && totalStatements() === 0,
          }}
        >
          <Show when={decryptionProgress() !== undefined}>
            <p class="font-bold text-2xl">{m.polite_brief_tern_promise()}</p>
            <Progress
              value={decryptionProgress()}
              minValue={0}
              maxValue={100}
              getValueLabel={({ value }) => `${value}%`}
              class="w-[300px] space-y-1"
            >
              <div class="flex justify-between">
                <ProgressLabel>{m.awake_best_millipede_dazzle()}</ProgressLabel>
                <ProgressValueLabel />
              </div>
            </Progress>
          </Show>
          <Show when={totalStatements() !== 0}>
            <p class="font-bold text-2xl">{m.ideal_wise_poodle_leap()}</p>
            <Progress
              value={executedStatements()}
              minValue={0}
              maxValue={totalStatements()}
              getValueLabel={({ value, max }) => `${value} of ${max}`}
              class="w-[300px] space-y-1"
            >
              <div class="flex justify-between">
                <ProgressLabel>{m.mealy_wacky_toucan_spark()}</ProgressLabel>
                <ProgressValueLabel />
              </div>
            </Progress>
          </Show>
        </Flex>
      </Portal>
      <Title>Signal stats</Title>
      <form class="mx-auto flex w-full flex-col gap-y-8 p-8 md:w-fit" onSubmit={onSubmit}>
        <Flex flexDirection="row" class="w-full gap-x-2 md:w-sm" alignItems="end">
          <TextField onChange={(value) => setPassphrase(value)} class="grow">
            <TextFieldLabel>{m.big_actual_osprey_jump()}</TextFieldLabel>
            <TextFieldInput type={showPassphrase() ? "text" : "password"} />
          </TextField>
          <Button variant="ghost" onClick={() => setShowPassphrase((oldValue) => !oldValue)}>
            <Show when={showPassphrase()} fallback={<EyeClosed />}>
              <Eye />
            </Show>
          </Button>
        </Flex>
        <Flex
          ref={dropzone.setRef}
          justifyContent="center"
          alignItems="center"
          class="relative min-h-40 w-full rounded-lg border-4 border-border border-dashed md:w-xl"
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
            {m.same_heroic_robin_grow()}
          </Button>
          <span
            class="absolute bottom-2"
            classList={{
              "text-muted-foreground": !backupFile(),
            }}
          >
            {backupFile() ? backupFile()?.name : m.neat_real_squid_cure()}
          </span>
        </Flex>
        <Button type="submit" class="max-w-72 self-end md:w-sm">
          {m.green_awake_oryx_aid()}
        </Button>
      </form>
    </>
  );
};

export default Home;
