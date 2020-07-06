import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";
import { CommandBuilder } from "yargs";

interface CreateKeyParams {
  name: string;
}

export const command = "create-key";

export const builder: CommandBuilder = (yargs) => {
  return yargs.option("name", { default: "bastion-key", type: "string" });
};

export const desc = "creates a key with aws that can be used in ssh sessions";

export const handler = async (args: CreateKeyParams) => {
  try {
    // @ts-ignore
    const hasKey = (await fs.exists(`${args.name}.pem`)) as boolean;

    if (hasKey) {
      console.log(chalk.red(`The file ${args.name}.pem already exists.`));
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
      args.name,
    ]);

    const { KeyMaterial } = JSON.parse(stdout);

    await fs.writeFile(`${args.name}.pem`, KeyMaterial);

    console.log(
      chalk.green(`Your key was created and saved as ${args.name}.pem`)
    );
  } catch (e) {
    console.log(e);
  }
};
