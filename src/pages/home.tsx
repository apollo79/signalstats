import { redirect, useNavigate, type RouteSectionProps } from "@solidjs/router";
import { type Component, type JSX } from "solid-js";
import { setDb, SQL } from "~/db";

export const Home: Component<RouteSectionProps> = () => {
  const navigate = useNavigate();

  const onFileChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    const file = event.currentTarget.files![0];
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const Uints = new Uint8Array(reader.result as ArrayBuffer);
      setDb(new SQL.Database(Uints));
      navigate("/overview");
    });

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <input
        type="file"
        accept=".sqlite"
        onChange={onFileChange}
      ></input>
    </div>
  );
};

export default Home;
