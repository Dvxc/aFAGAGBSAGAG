const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');

const config = require('./config.json');
const bot = new Discord.Client();

bot.on("ready", () => {
    console.log("READY");

    setInterval(function(){
        let sendChannel = bot.channels.find("id", config.channelId);

        let rl = readline.createInterface({
            input: fs.createReadStream('./accounts.txt')
        });

        var processed = 0;
        var lines = "";
        rl.on('line', (line) => {
            if(processed >= 1) {
                lines += line + "\n";
                return;
            }
            sendChannel.send(line);
            processed++;
        });

        rl.on("close", () => {
            fs.writeFileSync('./accounts.txt', (lines));
        });
        
    }, config.time);
});

bot.on("message", (message) => {
    
    if(message.author.bot) return;

    if(message.channel.type == "dm") return;

    if(!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command == "ping") {
        message.reply(`**Pong!** ${bot.ping} :ping_pong:`);
    }

    if(command == "generate") {
        if(config.genDisabled == true) return;
        let amount = parseInt(args[0]);
        if(!amount) return message.reply("Specify an amount!");
        console.log(`Generating ${amount}`);
        var processed = 0;
        var keys = "";
        while (processed < amount) {
            let randomNum = Math.floor(Math.random() * 999999999999);
            keys += randomNum + ",\n";
            processed++;
        }
        fs.writeFileSync('./keys.txt', keys);
    }

    if(command == "redeem") {
        let code = args[0];
        let redeemRole = message.guild.roles.find("name", config.redeemRole);

        if(!code || code.length <= 0){
            message.reply("No valid code specified!");
            return;
        }

        if(message.member.roles.has(redeemRole.id)) {
            message.reply("You've already redeemed a key!");
            return;
        } 

        giveRole();
        

        function giveRole() {
        
            var keys = new Map();
            var toRewrite = "";

            let rl = readline.createInterface({
                input: fs.createReadStream('./keys.txt')
            });

            rl.on('line', (line) => {
                var cleaned = line.replace(",", "");
                keys.set(cleaned, cleaned);
            });

            rl.on("close", () => {
                if(keys.has(code)){
                    message.reply(`Code valid! Giving ${config.redeemRole} role to you now...`);
                    keys.delete(code);
                    message.member.addRole(redeemRole);

                    var processed = 0;

                    keys.forEach(key => {
                        toRewrite += `${key},\n`;
                        processed++;
                    });

                    if(processed == keys.size){
                        fs.writeFileSync('./keys.txt', toRewrite);
                    }
                } else {
                    message.reply("Code not found in database!");
                }
            });
            }
    }
});

bot.login(config.token);