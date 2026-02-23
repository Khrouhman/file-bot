import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';

// For Discord express slash commands
import express from 'express';
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';

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
  const { id, type, data, guild_id, member, token } = req.body;

  // Grab id from who requested it
  const userId = member.user.id;
  const userName = member.user.username;

  // Initialize
  function initialize() {
    const serverDir = `./${guild_id}`;
    const userDir = `${serverDir}/${userId}`;

    if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    fs.writeFileSync(`${userDir}/.userid.txt`, userName);
  }

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
        if (!fs.existsSync(dir)) {
          error = `Directory not found. Creating one.`;
          initialize();
        }

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
      try {
        const dir = `./${guild_id}/${userId}`;
        if (!fs.existsSync(dir)) {
            initialize();
        }

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
        error = `Error Listing Files.\nDoes directory exist?`
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
      var hidden = false
      try {
        var hidden = data.options[1].value;
      } catch (error) {
        if (error instanceof TypeError) {
          console.log('User did not enter hidden');
        } else {
          throw error; // Re-throw if not a TypeError
        }
      }

      try {
          // Test log for file object
          //console.log(data.resolved.attachments);
          console.log(data.options);

          if (!fs.existsSync(dir)) {
            initialize();
          }
          // The uploaded file object
          // Convert to array with Object values to handle different ids better
          const file = Object.values(data.resolved.attachments);
          const fileContent = file[0].url;
          var fileName = `default`
          if (hidden) {
            fileName = '.' + file[0].filename;
          } else {
            fileName = file[0].filename;
          }


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

    if (name === 'removefile') {
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

      try {
        const fileName = data.options[0].value;
        const dir = `./${guild_id}/${userId}`;
        const filePath = `${dir}/${fileName}`;

        if (!fs.existsSync(filePath)) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `File not found: **${fileName}**`
            }
          });
        }

        // Filebot is thinking
        // Makes bot wait so code can send websocket
        res.send({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });

        // Discord expects Multipart form data json
        const form = new FormData();

        // Add message to Discord reply
        form.append(
          'payload_json',
          JSON.stringify({ content: `File retrieved: ${fileName}` })
        );

        const fileBuffer = fs.readFileSync(filePath); // Get file buffer
        const blob = new Blob([fileBuffer]); // Convert to blob (discord requires blob instead of buffer)

        form.append('files[0]', blob, fileName); // Add file to discord reply

        // Webhook sends file
        await fetch(
          `https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${token}`,
          {
            method: 'POST',
            body: form
          }
        );
        return; // Tell Discord bot request is done
      } catch {
        console.error(`Error retrieving file.`);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `File could not be retrieved.\nDoes Directory exist?`
          }
        });
      }
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
