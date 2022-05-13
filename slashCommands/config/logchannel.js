const { MessageEmbed, Message, ClientVoiceManager, Permissions } = require("discord.js");
const config = require("../../botconfig/config.json");
const emb = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const IC = require('../../botconfig/internalChannels.json');
const emojis = require('../../botconfig/emojis.json');
const con = require("../../db.js");
module.exports = {
  name: "logchannel", //the command name for the Slash Command
  description: "Switch Seraphines log channel", //the command description for Slash Command Overview
  cooldown: 1,
  memberpermissions: ['MANAGE_CHANNELS'], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  options: [
		{"Channel": { name: "channel", description: "Channel that you want to change Seraphine's logs to", required: true }}, //to use in the code: interacton.getChannel("what_channel")
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

		let newChannel = options.getChannel("channel");
        let noperms = new MessageEmbed()
			.setTitle(`INSUFFICIENT PERMISSIONS!`)
			.setFooter({text: emb.footertext, iconURL: client.user.displayAvatarURL()});
        let errorEmbed = new MessageEmbed()
            .setTitle(`WE ARE FACING SOME ISSUES...`)
            .setFooter({text: emb.footertext, iconURL: client.user.displayAvatarURL()});
        if(!guild.me.permissionsIn(interaction.channel.parent).has(`VIEW_CHANNEL`)){
            noperms.setDescription(`I'm missing \`VIEW_CHANNEL\` permission from the channel \`${interaction.channel.parent}\`!`);
            interaction.reply({embeds: [noperms], ephemeral: true});
            return false;
        }
        else if(!guild.me.permissionsIn(interaction.channel).has(`SEND_MESSAGES`)){
            noperms.setDescription(`I'm missing \`SEND_MESSAGES\` permission from the channel ${interaction.channel}!`);
            interaction.reply({embeds: [noperms], ephemeral: true});
            return false;
        }
        
        if(newChannel.type == 'GUILD_TEXT'){
            con.query(`SELECT * FROM seraphine_guilds WHERE guild='${guild.id}'`, function(err, res){
                if(res.length > 0){
                    con.query(`UPDATE seraphine_guilds SET logchannel='${newChannel.id}' WHERE guild='${guild.id}'`)
                } else {
                    con.query(`INSERT INTO seraphine_guilds (guild, logchannel) VALUES ('${guild.id}', '${newChannel.id}')`)
                }

                const successEmbed = new MessageEmbed()
                    .setTitle(`SUCCESS!`)
                    .setDescription(`Successfully changed Seraphine's log channel to ${newChannel}`)
                    .setFooter({text: emb.footertext, iconURL: client.user.displayAvatarURL()});

                interaction.reply({embeds: [successEmbed], ephemeral: true})
                newChannel.send({embeds: [successEmbed.addField(`CHANGED BY`, `${member}\n\`${member.user.tag}\``)]});
            })
        } else {
            interaction.reply({embeds: [errorEmbed.setDescription(`${newChannel} is not \`TEXT\` channel and can't be used as a log channel.`)], ephemeral: true});
        }

  	} catch (e) {
        console.log(String(e.stack).bgRed)
    }
}
}