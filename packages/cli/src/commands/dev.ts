import execa from "execa";

export const command = "dev";

export const desc = "Start development servers.";

export const handler = async () => {
  const { stdout, stderr } = await execa("yarn", ["ds"]);

  console.log(stdout);
  console.log(stderr);
};
