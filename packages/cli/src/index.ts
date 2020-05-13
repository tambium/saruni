import yargs from "yargs";

yargs.commandDir("./commands").scriptName("saruni").demandCommand().argv;
