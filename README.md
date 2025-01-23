# Signalstats

This project lets you see all the statistics of your [Signal](https://signal.org) chats.

- Get insights on your chats: How many messages have you written? At what daytime? Which words do you use the most?
- Privacy friendly: no data is sent to a server, everything happens on your device

You can try the hosted version on [signalstats.duskflower.dev](https://signalstats.duskflower.dev) or run the code on your own machine.
This project was created as an alternative to [WhatsAnalyze](https://whatsanalyze.com/) for the Signal messenger.

## How it works

Since Signal doesn't let you export chats as unencrypted text or zip files like WhatsApp, the only way to get Signal chat data is to use the backup function. Sadly, local backups are to my knowledge currently only available on Android devices.

A backup contains the database (the database statements needed to create the database) with all the messages, recipients, groups and much more, and also attachments, stickers and avatars.

Since that is quite a big amount of _encrypted_ data (easily multiple GBs), I chose to implement the decryption in [WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) using Rust and tried to optimize the code for performance. The code for the decryption can be found at [signal-decrypt-backup-wasm](https://git.duskflower.dev/duskflower/signal-decrypt-backup-wasm) and is based on [signal_for_android_decryption](https://github.com/mossblaser/signal_for_android_decryption).

After the decryption, all the database statements are executed on a WebAssembly database using [@sqlite.org/sqlite-wasm](https://github.com/sqlite/sqlite-wasm) and after that it is possible to execute queries on the database to obtain the data needed for statistics.

## Encountered an issue

Please report bugs in the [Github issues](https://github.com/apollo79/signalstats/issues).

## Developing and running the code locally

This project is built as an Single-page application using [SolidJS](https://solidjs.com).

```shell
# clone the repository
git clone https://git.duskflower.dev/duskflower/signalstats.git

# go to the project directory
cd signalstats

# install the dependencies
pnpm install # or npm install or yarn install

# to run the development version
pnpm dev
# or
pnpm start

# to build the project
pnpm build

# you can preview the build by running
pnpm serve
```

`pnpm build` will create the `dist` folder which you can serve as a static site.
