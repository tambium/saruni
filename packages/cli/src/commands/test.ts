import { run } from "jest";

export const command = "test";

export const desc = "Runs jest with the project based setup.";

export const handler = async () => {
  try {
    run([`--config=${require.resolve("@saruni/config")}`]);
  } catch (e) {
    console.log(e);
  }
};
