import type { RouteSectionProps } from "@solidjs/router";
import type { Component } from "solid-js";
import { A } from "~/components/ui/A";
import { Heading } from "~/components/ui/heading";

export const Privacy: Component<RouteSectionProps> = () => {
  return (
    <div class="m-auto mb-8 max-w-4xl [&>:is(p,ul)]:mb-4">
      <Heading level={1}>Privacy policy</Heading>
      <Heading level={2}>Introduction</Heading>
      <p>
        This project ("signalstats", "I", "my") was built with the intention to not harm the privacy of its users. This
        project was created to be useful, but also to showcase privacy-preserving technology. It is designed to not
        collect any personally identifiable information.
      </p>
      <p>
        All data processing happens on your device. The data contained in your backup and your passphrase will never
        leave it.
      </p>
      <Heading level={2}>Data I collect and usage of data</Heading>
      <p>
        I do not track any individual people. When you visit my website, your browser transfers data to the server,
        which makes you identifiable like your IP address. This is just how browsers work. But I do not use that data to
        track you or try to identify you as a person.
      </p>
      <p>
        To ensure that signalstats keeps working, the server logs some information that helps with identifying problems.
        <br />
        My server logs the following information:
      </p>
      <ul class="list-inside list-disc">
        <li>
          The date and time of the request: <strong>day/month/year:time timezone offset</strong>
        </li>
        <li>
          The type of the request, for example <strong>GET</strong> or <strong>POST</strong>, and which version of the
          HTTP protocol was used, for example <strong>HTTP/2.0</strong>
        </li>
        <li>
          The status code of the request (for example if it was successful or not): <strong>200</strong>
        </li>
        <li>
          The referer URL, meaning from which site you came:{" "}
          <strong>https://git.duskflower.dev/duskflower/signal-stats</strong>
        </li>
        <li>
          The user agent, which contains information about your system and browser:{" "}
          <strong>Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0</strong>
        </li>
      </ul>
      <p>
        The server on purpose does <strong>not log the IP address</strong>.
      </p>
      <p>
        These logs are kept for 10 days after which they are permanently deleted.
        <br />I use a self-hosted instance of <A href="https://umami.is">Umami</A> to collect anonymous statistics about
        my website. The goal is to stay up to date with the website traffic and identify trends in it. The collected
        data does not allow us to identify individuals. All of it is stored in aggregated form. The raw data is
        immediately deleted after the statistics are generated. That means that if I collect your screen resolution, it
        will only be used to detect the type of device (desktop, laptop, mobile), and the IP address is only used to
        identify the country you are coming from.
      </p>
      <Heading level={2}>Sharing of data with third parties</Heading>
      <p>
        I do not in any way share data with advertising companies or other third parties. Everything runs on my own
        server.
        <br />
        The only situation in which I might need to share data is to comply with legal requirements.
      </p>
      <Heading level={2}>Your rights</Heading>
      <p>You have certain rights regarding your personal data:</p>
      <ul class="list-inside list-disc">
        <li>The right to access your data</li>
        <li>The right to rectify your data</li>
        <li>The right to request deletion of your data</li>
      </ul>
      <p>However, since I am not processing any personal data,</p>
      <Heading level={2}>Contact</Heading>
      <p>
        I run this website as an individual. If you have any questions or complaints regarding my privacy and data
        practices, you can reach out to the data controller:
      </p>
      <p class="bg-info p-4">
        duskflower
        <br />
        privacy(at)duskflower.dev
      </p>
      <Heading level={2}>About this policy</Heading>
      <p>
        This policy is currently up to date, the last change was done in January 2024.
        <br />
        With the development of signalstats or with new legal requirements it might become necessary to adjust the
        policy. All updates will be posted under here. To get the current version, refer to this page.
      </p>
    </div>
  );
};
