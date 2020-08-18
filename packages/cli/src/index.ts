#!/usr/bin/env node
import yargs from 'yargs';

yargs.commandDir('./commands').scriptName('saruni').demandCommand().argv;
