import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";

interface CreateKeyParams {
  name: string;
}

export const command = "create-key <name>";

export const desc = "creates a key with aws that can be used in ssh sessions";

export const handler = async (args: CreateKeyParams) => {
  try {
    // @ts-ignore
    const hasKey = (await fs.exists("bastion-key.pem")) as boolean;

    if (hasKey) {
      console.log(chalk.red("The file bastion.key.pem already exists."));
      console.log(
        chalk.yellow(
          "It is advised to backup this file then either delete or remove it."
        )
      );

      process.exit(1);
    }

    const { stdout } = await execa("aws", [
      "ec2",
      "create-key-pair",
      "--key-name",
      "bastion-key",
    ]);

    const { KeyMaterial } = JSON.parse(stdout);

    await fs.writeFile("bastion-key.pem", KeyMaterial);
  } catch (e) {
    console.log(e);
  }
};
