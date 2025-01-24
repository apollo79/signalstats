import { BackupDecryptor } from "@duskflower/signal-decrypt-backup-wasm";

const CHUNK_SIZE = 1024 * 1024 * 40; // 40MB chunks

export async function decryptBackup(
  file: File,
  passphrase: string,
  progressCallback: (progress: number) => void,
  statementsCallback?: (statements: string[]) => void | Promise<void>,
): Promise<string[]> {
  const fileSize = file.size;
  const decryptor = new BackupDecryptor();
  decryptor.set_progress_callback(fileSize, progressCallback);

  let offset = 0;

  try {
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const arrayBuffer = await chunk.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      decryptor.feed_data(uint8Array);

      let done = false;
      while (!done) {
        try {
          done = decryptor.process_chunk(passphrase);
        } catch (e) {
          console.error("Error processing chunk:", e);
          throw e;
        }
      }

      await statementsCallback?.(decryptor.get_new_decrypted_statements());

      offset += CHUNK_SIZE;
    }

    const result = decryptor.finish();

    return result;
  } catch (e) {
    console.error("Decryption failed:", e);
    throw e;
  }
}
