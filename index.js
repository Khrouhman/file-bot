import 'dotenv/config';
import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';
import Path from 'path';

// For Discord express slash commands
import express from 'express';
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';

// Websocket client
const client = new Client({  
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Test incoming command
  console.log(req.body)

  // Interaction id, type and data, server name and who requested
  const { id, type, data, guild_id, member } = req.body;

  // Grab id from who requested it
  const userId = member.user.id;
  // Will replace id with username later
  const userName = member.user.username;

  // Handle verification requests
   
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // Commands
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `hello world`
            }
          ]
        },
      });
    }

    if (name === 'list') {
      var error = ``
      try {
        const dir = `./${guild_id}/${userId}`;
        if (!fs.existsSync(dir)) error = `Directory not found.`;

        const output = execSync(`ls "${dir}"`, { encoding: 'utf8' });
        const fileList =`\`\`\`bash\n${output}\`\`\``;

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `${fileList}`
              }
            ]
          },
        });
      } catch (err) {
        console.log(`Error listing files`);
        error = `Error Listing Files. Contact the developer.`
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL, // Only show to user
            content: `${error}`
          },
        });
      }
    }

    if (name === 'listall') {
      var error = ``
      try {
        const dir = `./${guild_id}/${userId}`;
        if (!fs.existsSync(dir)) error = `Directory not found.`;
        const output = execSync(`ls -a "${dir}"`, { encoding: 'utf8' });
        const fileList =`\`\`\`bash\n${output}\`\`\``;

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `${fileList}`
              }
            ]
          },
        });
      } catch (err) {
        console.log(`Error listing files`);
        error = `Error Listing Files. Contact the developer.`
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL, // Only show to user
            content: `${error}`
          },
        });
      }
    }

    if (name === 'savefile') {
      var error = ``
      try {
          // Test log for file object
          console.log(data.resolved.attachments);

          // The uploaded file object
          // Convert to array with Object values to handle different ids better
          const file = Object.values(data.resolved.attachments);
          const fileName = file[0].filename;
          const fileContent = file[0].url;

          // Download the file first
          const response = await fetch(fileContent);
          const buffer = await response.arrayBuffer();

          const dir = `./${guild_id}/${userId}`;
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(`${dir}/${fileName}`, Buffer.from(buffer));

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `File **${fileName}** uploaded successfully!`
            }
          });
      } catch {
        console.error(`Error saving file.`);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `File failed to save. Contact Developer.`
          }
        });
      }
    }

    if (name === 'getfile') {
      var error = ``;
      // Test log
      console.log(data);
      const fileName = data.options[0].value

          const dir = `./${guild_id}/${userId}`;
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          const filePath = `${dir}/${fileName}`;
	        const fileContent = fs.readFileSync(filePath);

          // Use multipart/form-data with proper structure
          const formData = new FormData();
          formData.append('payload_json', JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `File: **${fileName}**`,
              files: [{
                name: fileName,
                file: fileContent
              }]
            }
          }));
    }
    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});


// Websocket approach
client.on('ready', () => {
  console.log('Filebot reporting for duty!');
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args[0]?.toLowerCase();
  const text = args.slice(1).join(' ');

  const serverId = message.guild?.id;
  const userId = message.author.id;

  if (command === '--initialize') {
    try {
      const serverDir = `./${serverId}`;
      const userDir = `${serverDir}/${userId}`;

      if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

      fs.writeFileSync(`${serverDir}/.serverid.txt`, message.guild?.name || 'Unknown Server');
      fs.writeFileSync(`${userDir}/.userid.txt`, message.author.username);

      message.reply('Initialization complete.');

    } catch (err) {
      message.reply('Failed to initialize.');
    }
  }

  if (command === 'ls') {
    try {
      const dir = `./${serverId}/${userId}`;
      if (!fs.existsSync(dir)) return message.reply('Directory not found.');

      const output = execSync(`ls "${dir}"`, { encoding: 'utf8' });
      message.reply(`\`\`\`bash\n${output}\`\`\``);
    } catch (err) {
      message.reply('Error listing files.');
    }
  }

  if (command === 'ls -a') {
    try {
      const dir = `./${serverId}/${userId}`;
      if (!fs.existsSync(dir)) return message.reply('Directory not found.');
 
      const output = execSync(`ls -a "${dir}"`, { encoding: 'utf8' });
      message.reply(`\`\`\`bash\n${output}\`\`\``);
    } catch (err) {
      message.reply('Error listing files.');
    }
  }

  if (command === 'sendfile') {
    try {
      const dir = `./${serverId}/${userId}`;
      if (!fs.existsSync(dir)) return message.reply('Directory not found.');

      const filePath = `${dir}/${text}`;
      if (!fs.existsSync(filePath)) return message.reply('File not found.');

      message.reply({ content: `File: ${text}`, files: [filePath] });
    } catch (err) {
      message.reply('Failed to send file.');
    }
  }

  if (command === 'savefile') {
    try {
      const dir = `./${serverId}/${userId}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const attachment = message.attachments.first();
      if (!attachment) return message.reply('No attachment provided.');

      //console.log('Attachment object:', attachment); // Test Log the entire attachment
      var filename = ``;
      if(!text) filename = attachment.name;
      else filename = text;

      var filePath = `${dir}/${filename}`;

      // Temp save file
      const fileStream = fs.createWriteStream(filePath);
      
      // Actually saves file
      const request = https.get(attachment.url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          message.reply(`File saved successfully. Name: ${filename}`);
	  console.log(`File saved: ${filePath}.`);
        });
      });

      request.on('error', () => {
        message.reply('Failed to download file.');
      });
    } catch (err) {
      message.reply('Failed to save file.');
    }
  }

  if (command === 'removefile') {
    try {
      const dir = `./${serverId}/${userId}`;
      if (!fs.existsSync(dir)) return message.reply('Directory not found.');

      const filePath = `${dir}/${text}`;
      if (!fs.existsSync(filePath)) return message.reply('File not found.');

      fs.unlinkSync(filePath);
      message.reply(`Removed file: ${text}`);
    } catch (err) {
      message.reply('Failed to send file.');
    }
  }



  if (command === 'convert') {
    try {
      const dir = `./${serverId}/${userId}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const attachment = message.attachments.first();
      if (!attachment) return message.reply('No attachment provided.');

      //console.log('Attachment object:', attachment); // Log the entire attachment

      const filename = attachment.name || 'temp_file';

      var filePath = ``;
      if(!text) filePath = `${dir}/${filename}`;
      else filePath = `${dir}/${text}`;

      // Temp file for conversion
      const fileStream = fs.createWriteStream(filePath);

      const request = https.get(attachment.url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
        try {
          // Grab only filename without extension
          const nameOnly = Path.parse(filePath).name;
          const newName = nameOnly + ".jpg";
          const newFile = `${dir}/${newName}`;

          const output = execSync(`ffmpeg -hide_banner -loglevel error -i "${filePath}" ${newFile}`, { encoding: 'utf8' });

          message.reply({ content: `File converted: ${newName}`, files: [newFile] });

          setTimeout(() => {
            fs.unlinkSync(filePath);
            fs.unlinkSync(newFile);
          }, 2000 );

        } catch (err) {
          message.reply('Failed to process file');
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (fs.existsSync(newFile)) fs.unlinkSync(newFile);
        }
        });
      });

      request.on('error', () => {
        message.reply('Failed to download file.');
      });
    } catch (err) {
      message.reply('Failed to save file.');
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

