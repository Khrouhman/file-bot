                                                        
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';
import Path from 'path';

const client = new Client({  
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log('Bot is online!');
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

      message.reply({ files: [filePath] });
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

      console.log('Attachment object:', attachment); // Log the entire attachment
      const filename = attachment.name;
      

      var filePath = ``;
      if(!text) filePath = `${dir}/${filename}`;
      else filePath = `${dir}/${text}`;


      const request = https.get(attachment.url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          message.reply('File saved successfully.');
        });
      });

      request.on('error', () => {
        message.reply('Failed to download file.');
      });
    } catch (err) {
      message.reply('Failed to save file.');
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

          message.reply({ context: `File converted: ${newName}` , files: [newFile] });

          setTimeout(() => {
            fs.unlinkSync(filePath);
            fs.unlinkSync(newFile);
          }, 2000 );

        } catch (err) {
          message.reply('Failed to process file');
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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

