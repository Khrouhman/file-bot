import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';
import { getFiles } from './index.js';

// Get the game choices from game.js
function createCommandChoices() {
  const files = getFiles();
  const commandChoices = [];

  for (let file of files) {
    commandChoices.push({
      name: file,
    });
  }
  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
// From discord tutorial. Reference for dropdown/action row
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
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
    },
    {
      name: 'hidden',
      description: 'Hidden file?',
      type: 5, // bool type
      required: false
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
