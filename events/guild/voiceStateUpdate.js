const { Permissions, MessageEmbed } = require("discord.js");
const con = require("../../db.js");
const emb = require("../../botconfig/embed.json");
const emoji = require("../../botconfig/emojis.json");

module.exports = async (client, oldState, newState) => {
    if(newState.channelId != null){
        con.query(`SELECT * FROM seraphine_hub_channels WHERE guild='${newState.guild.id}' AND channel='${newState.channelId}'`, function (err, res){
            if(res.length > 0){
                let channelName = res[0].name.replace('{USER}', newState.member.user.username);
                newState.guild.channels.create(channelName, {
                    type: 'GUILD_VOICE',
                    userLimit: res[0].userlimit,
                    parent: client.channels.cache.get(res[0].channel).parent,
                    permissionOverwrites: [
                        {
                            id: newState.guild.me.id,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.MANAGE_CHANNELS]
                        },
                        {
                            id: newState.member.id,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.MANAGE_CHANNELS]
                        }
                    ]
                }).then(vch => {
                    newState.member.voice.setChannel(vch, "Moved user to their respective new channel!")
                    if(res[0].text){
                        newState.guild.channels.create(channelName.replace(/ /g, '-'), {
                            type: 'GUILD_TEXT',
                            parent: client.channels.cache.get(res[0].channel).parent,
                            permissionOverwrites: [
                                {
                                    id: newState.guild.roles.everyone,
                                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                                },
                                {
                                    id: newState.guild.me.id,
                                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.MANAGE_CHANNELS]
                                },
                                {
                                    id: newState.member.id,
                                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.MANAGE_CHANNELS]
                                }
                            ]
                        }).then(txtch => {
                            const infoBlock = new MessageEmbed()
                            .setTitle(`WELCOME TO YOUR PRIVATE TEXT CHANNEL`)
                            .setFooter({text: emb.footertext})
                            .setTimestamp()
                            .setThumbnail(client.user.displayAvatarURL())
                            .setDescription(`Owner of this channel is ${newState.member} and they can edit voice channel userlimit, name and bitrate!\n\n${emoji.sera_peace} Once the channel empties out from all users, channels will be deleted!`)
                            txtch.send({embeds: [infoBlock]});

                            const logentry = new MessageEmbed()
                            .setTitle(`NEW VOICE CHANNEL`)
                            .setTimestamp()
                            .addFields(
                                {name: `USER`, value: `${newState.member}\n${emoji.id} \`${newState.member.id}\``, inline: true},
                                {name: `CHANNEL(S) CREATED`, value: `${emoji.plus} ${vch}\n${emoji.plus} ${txtch}`}
                            );

                            con.query(`SELECT * FROM seraphine_guilds WHERE guild='${newState.guild.id}'`, function(errlog, reslog){
                                if(newState.guild.channels.cache.find(c => c.id === reslog[0].logchannel)){
                                    client.channels.cache.get(reslog[0].logchannel).send({embeds: [logentry]});
                                }
                            });

                            con.query(`INSERT INTO seraphine_channels (guild, channel, userlimit, text_channel, owner) VALUES ('${newState.guild.id}', '${vch.id}', '${res[0].userlimit}', '${txtch.id}', '${newState.member.id}')`)
                        })
                    } else {
                        const logentry = new MessageEmbed()
                            .setTitle(`NEW VOICE CHANNEL`)
                            .setTimestamp()
                            .addFields(
                                {name: `USER`, value: `${newState.member}\n${emoji.id} \`${newState.member.id}\``, inline: true},
                                {name: `CHANNEL(S) CREATED`, value: `${emoji.plus} ${vch}`}
                            );

                            con.query(`SELECT * FROM seraphine_guilds WHERE guild='${newState.guild.id}'`, function(errlog, reslog){
                                if(newState.guild.channels.cache.find(c => c.id === reslog[0].logchannel)){
                                    client.channels.cache.get(reslog[0].logchannel).send({embeds: [logentry]});
                                }
                            });
                        con.query(`INSERT INTO seraphine_channels (guild, channel, userlimit, owner) VALUES ('${newState.guild.id}', '${vch.id}', '${res[0].userlimit}', '${newState.member.id}')`)
                    }
                })
            } else {
                con.query(`SELECT * FROM seraphine_channels WHERE guild='${newState.guild.id}' AND channel='${newState.channelId}'`, function (errr, ress){
                    if(ress.length > 0){
                        if(ress[0].text_channel != null){
                            let textChannel = client.channels.cache.get(ress[0].text_channel);
                            textChannel.permissionOverwrites.create(newState.member, {
                                VIEW_CHANNEL: true
                            })
                        }
                    }
                })
            }
        })
    }
    if(oldState.channelId != null){
        con.query(`SELECT * FROM seraphine_channels WHERE guild='${newState.guild.id}' AND channel='${oldState.channelId}'`, function (err, res){
            if(res.length > 0){
                let vch = client.channels.cache.get(oldState.channelId);
                if(vch){
                    let channelCount = vch.members.filter(m => !m.user.bot).size;
                    if(channelCount == 0){
                        if(res[0].text_channel != null){
                            const logentry = new MessageEmbed()
                            .setTitle(`REMOVED VOICE CHANNEL`)
                            .setTimestamp()
                            .addFields(
                                {name: `USER`, value: `${newState.member}\n${emoji.id} \`${newState.member.id}\``, inline: true},
                                {name: `CHANNEL(S) DELETED`, value: `${emoji.plus} ${vch.name}\n${emoji.plus} ${client.channels.cache.get(res[0].text_channel).name}`}
                            );
                            con.query(`SELECT * FROM seraphine_guilds WHERE guild='${newState.guild.id}'`, function(errlog, reslog){
                                if(newState.guild.channels.cache.find(c => c.id === reslog[0].logchannel)){
                                    client.channels.cache.get(reslog[0].logchannel).send({embeds: [logentry]});
                                }
                            });
                            client.channels.cache.get(res[0].text_channel).delete('Deleting empty private channel')
                        } else {
                            const logentry = new MessageEmbed()
                            .setTitle(`REMOVED VOICE CHANNEL`)
                            .setTimestamp()
                            .addFields(
                                {name: `USER`, value: `${newState.member}\n${emoji.id} \`${newState.member.id}\``, inline: true},
                                {name: `CHANNEL(S) DELETED`, value: `${emoji.plus} ${vch.name}`}
                            );
                            con.query(`SELECT * FROM seraphine_guilds WHERE guild='${newState.guild.id}'`, function(errlog, reslog){
                                if(newState.guild.channels.cache.find(c => c.id === reslog[0].logchannel)){
                                    client.channels.cache.get(reslog[0].logchannel).send({embeds: [logentry]});
                                }
                            });
                        }
                        vch.delete('Deleting empty private channel')
                        con.query(`DELETE FROM seraphine_channels WHERE guild='${newState.guild.id}' AND channel='${oldState.channelId}'`)
                    } else {
                        if(res[0].text_channel != "NULL"){
                            client.channels.cache.get(res[0].text_channel).permissionOverwrites.delete(newState.member);
                        }
                    }
                }
            }
        })
    }
}