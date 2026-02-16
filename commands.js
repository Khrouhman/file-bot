import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Simple test command
const LS_COMMAND = {
  name: 'list',
  description: 'List files',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const LSA_COMMAND = {
  name: 'listall',
  description: 'List all files',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const SAVEFILE_COMMAND = {
  name: 'savefile',
  description: 'Save file to directory.',
  type: 1,
  options: [
    {
      name: 'file',
      description: 'The file to upload',
      type: 11, // Attachment type
      required: true
    }
  ],
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const GETFILE_COMMAND = {
  name: 'getfile',
  description: 'Get file from server.',
  type: 1,
  options: [
    {
	name: 'filename',
	description: 'file to retrieve',
	type: 3, // String type
	required: false
    }
  ],
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};


const ALL_COMMANDS = [TEST_COMMAND, LS_COMMAND, LSA_COMMAND, SAVEFILE_COMMAND, GETFILE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
