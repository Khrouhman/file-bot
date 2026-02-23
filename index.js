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

var fileChoices = {}

export function getFiles() {
  return fileChoices
}

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
    const userDir = `${serverDir}/${userName}-${userId}`;

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

    const dir = `./${guild_id}/${userName}-${userId}`;
    if (!fs.existsSync(dir)) {
      error = `Directory not found. Creating one.`;
      initialize();
    }

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
        const output = execSync(`ls "${dir}"`, { encoding: 'utf8' });

        const fileList =`\`\`\`bash\n${output}\`\`\``;

        fileChoices = output.split('\n')
        console.log(fileChoices)

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
    
    // "challenge" command from discord tutorial
    // Will reuse to make getfile/removefile with dropdown/action row
    
    // Store for in-progress games. In production, you'd want to use a DB
    const activeGames = {};

    if (name === 'challenge' && id) {
      // Interaction context
      const context = req.body.context;
      // User ID is in user field for (G)DMs, and member for servers
      const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
      // User's object choice
      const objectName = req.body.data.options[0].value;

      // Create active game using message ID as the game ID
      activeGames[id] = {
        id: userId,
        objectName,
      };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `Rock papers scissors challenge from <@${userId}>`,
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: 'Accept',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  // TODO : Add a dropdown/action row to select files instead of manual typing
  // Will need to change command for getfile and removefile above
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith('accept_button_')) {
      // get the associated game ID
      const gameId = componentId.replace('accept_button_', '');
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: 'What is your object of choice?',
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: 'DELETE' });
      } catch (err) {
        console.error('Error sending message:', err);
      }
    } else if (componentId.startsWith('select_choice_')) {
      // get the associated game ID
      const gameId = componentId.replace('select_choice_', '');

      if (activeGames[gameId]) {
        // Interaction context
        const context = req.body.context;
        // Get user ID and object choice for responding user
        // User ID is in user field for (G)DMs, and member for servers
        const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
        const objectName = data.values[0];
        // Calculate result from helper function
        const resultStr = getResult(activeGames[gameId], {
          id: userId,
          objectName,
        });

        // Remove game from storage
        delete activeGames[gameId];
        // Update message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { 
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: resultStr
                }
              ]
             },
          });
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: 'PATCH',
            body: {
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: 'Nice choice ' + getRandomEmoji()
                }
              ],
            },
          });
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
    }
    
    return;
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
