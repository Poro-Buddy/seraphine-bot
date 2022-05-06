const { MessageEmbed, Message, ClientVoiceManager } = require("discord.js");
const config = require("../botconfig/config.json");
const emb = require("../botconfig/embed.json");
const settings = require("../botconfig/settings.json");
const IC = require('../botconfig/internalChannels.json');
const emojis = require('../botconfig/emojis.json');
const con = require("../db.js");
module.exports = {
  name: "edit", //the command name for the Slash Command
  description: "Edit existing hub channel", //the command description for Slash Command Overview
  cooldown: 1,
  memberpermissions: ['MANAGE_CHANNELS'], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  options: [ //OPTIONAL OPTIONS, make the array empty / dont add this option if you don't need options!	
		{"String": {name: "channel_id", description: "HUB channels ID or Discord channel ID of the HUB channel", required: true}},
		{"StringChoices": {name: "option", description: "What are we editing on the HUB channel?", required: true, choices: [["name", "name"], ["userlimit", "userlimit"], ["text_channel", "text_channel"]]}},
		{"String": {name: "new_value", description: "Set the new value for the option", required: true}}
  ],
  run: async (client, interaction) => {
    try{
	    //console.log(interaction, StringOption)
		
		//things u can directly access in an interaction!
		const { member, channelId, guildId, applicationId, 
		        commandName, deferred, replied, ephemeral, 
				options, id, createdTimestamp 
		} = interaction; 
		const { guild } = member;

		let channel_id = options.getString("channel_id");
		let optionToEdit = options.getString("option");
		let newValue = options.getString("new_value");
		let oldValue;
        
        con.query(`SELECT * FROM seraphine_hub_channels WHERE id='${channel_id}' OR channel='${channel_id}'`, function(err, res){
            if(res.length > 0){
                let hubChannel = guild.channels.cache.get(res[0].channel);
                if(optionToEdit == 'name'){
                    con.query(`UPDATE seraphine_hub_channels SET name='${newValue}' WHERE id='${channel_id}'`)
                    oldValue = res[0].name;
                }
                if(optionToEdit == 'userlimit'){
                    if(!isNaN(newValue)){
                        if(newValue > 99) newValue = 99;
		                if(newValue < 0) newValue = 0;
                        con.query(`UPDATE seraphine_hub_channels SET userlimit='${newValue}' WHERE id='${channel_id}'`)
                        oldValue = res[0].userlimit;
                    }
                }
                if(optionToEdit == 'text_channel'){
                    if(newValue == 'true' || newValue == '1' || newValue == 'yes') newValue = 1;
                    if(newValue == 'false' || newValue == '0' || newValue == 'no') newValue = 0;
                    con.query(`UPDATE seraphine_hub_channels SET text='${newValue}' WHERE id='${channel_id}'`)
                    oldValue = res[0].text == 0 ? 'NO' : 'YES';
                    newValue = newValue == 0 ? 'NO' : 'YES';
                }

                const changesMade = new MessageEmbed()
                .setTitle(`HUB CHANNEL EDITED`)
                .setDescription(`${hubChannel}\n\`${hubChannel.name}\`\n\`(${hubChannel.id})\``)
                .addFields(
                    {name: `OPTION`, value: `${optionToEdit.replace('_', ' ').toUpperCase()}`, inline: true},
                    {name: `OLD VALUE`, value: `${isNaN(oldValue) ? oldValue.toUpperCase() : oldValue}`, inline: true},
                    {name: `NEW VALUE`, value: `${isNaN(newValue) ? newValue.toUpperCase() : newValue}`, inline: true},
                    {name: `EDITED BY`, value: `${member}\n${member.user.tag}`}
                )
                .setTimestamp()
                .setFooter({text: emb.footertext, iconURL: client.user.displayAvatarURL()});

                interaction.reply({embeds: [changesMade], ephemeral: true});

                con.query(`SELECT * FROM seraphine_guilds WHERE guild='${guild.id}'`, function(err1, res1){
                    if(res.length > 0){
                        try {
                            guild.channels.cache.get(res1[0].logchannel).send({embeds: [changesMade]});
                        } catch(errTry){
                            console.log(String(errTry.stack).bgRed)
                        }
                    }
                });
            } else {
                const noChannelFound = new MessageEmbed()
                .setTitle(`COULD NOT FIND CHANNEL`)
                .setDescription(`We searched far and wide and could not find any HUB channels from your server matching ID \`${channel_id}\``)
                .setTimestamp()
                .setFooter({text: emb.footertext, iconURL: client.user.displayAvatarURL()});

                interaction.reply({embeds: [noChannelFound], ephemeral: true});
            }
        });

		
  	} catch (e) {
        console.log(String(e.stack).bgRed)
    }
}
}