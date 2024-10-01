const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('./server');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CALLBOSS_CHANNEL_NAME = 'callbossnetottt';
const CALLBOSS_ID_CHANNEL_NAME = 'callbossid'; // Novo canal
const AUTHORIZED_USER_ID = '929052615273250896'; // ID do usuário autorizado
const MY_SERVER_ID = '1180256244066418769'; // Coloque aqui o ID do seu servidor

client.once('ready', () => {
    console.log('Bot do Discord está online!');
    client.guilds.cache.forEach(guild => createChannelsIfNotExists(guild));
    client.user.setActivity('Guild:Otakus', { type: 'LISTENING' });
});

// Função para criar os canais se não existirem
async function createChannelsIfNotExists(guild) {
    await createChannelIfNotExists(guild, CALLBOSS_CHANNEL_NAME);
    // await createCallBossIdChannel(guild);
}

// Cria o canal principal
async function createChannelIfNotExists(guild, channelName) {
    const channelExists = guild.channels.cache.find(channel => channel.name === channelName);
    if (!channelExists) {
        try {
            await guild.channels.create({
                name: channelName,
                type: 0, // 0 para texto
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages],
                    }
                ]
            });
            console.log(`Canal ${channelName} criado em ${guild.name}`);
        } catch (error) {
            console.error(`Erro ao criar o canal em ${guild.name}:`, error);
        }
    }
}

// Cria o canal callbossid com permissões para administradores
async function createCallBossIdChannel(guild) {
    const channelExists = guild.channels.cache.find(channel => channel.name === CALLBOSS_ID_CHANNEL_NAME);
    if (!channelExists) {
        try {
            await guild.channels.create({
                name: CALLBOSS_ID_CHANNEL_NAME,
                type: 0, // 0 para texto
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id, // O cargo @everyone
                        deny: [PermissionsBitField.Flags.ViewChannel], // Nega a visualização do canal para everyone
                    },
                    {
                        id: '1290057620391985224', // Coloque o ID do cargo de administradores
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Permite que os administradores vejam e enviem mensagens
                    },
                    {
                        id: '1180272578141622302', // Coloque o ID do cargo de bots
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Permite que os bots vejam e enviem mensagens
                    }
                ]
            });
            console.log(`Canal ${CALLBOSS_ID_CHANNEL_NAME} criado em ${guild.name} com permissões para administradores.`);
        } catch (error) {
            console.error(`Erro ao criar o canal ${CALLBOSS_ID_CHANNEL_NAME} em ${guild.name}:`, error);
        }
    } else {
        console.log(`Canal ${CALLBOSS_ID_CHANNEL_NAME} já existe em ${guild.name}.`);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando para chamar o boss
    if (message.content.startsWith('/callboss')) {
        const args = message.content.split(' ').slice(1);
        const server = args.find(arg => arg.startsWith('server'))?.split('.')[1];
        const boss = args.find(arg => arg.startsWith('boss'))?.split('.')[1];

        if (!server || !boss) {
            return;
        }

        const response = `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\nCall Boss\n **Server:** ${server} **Boss:** ${boss} \n\n**Enviado por:** ${message.author.username} da Guild **${message.guild.name}** \n\n **ID do(a) ${message.author.username}:** ${message.author.id} \n **ID do Servidor(Guild):** ${message.guild.id} `;

        client.guilds.cache.forEach(guild => {
            const callBossChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
            if (callBossChannel) {
                callBossChannel.send(response).catch(console.error);
            } else {
                createChannelsIfNotExists(guild);
            }
        });

        // Envio específico para seu servidor
        /* if (message.guild.id === MY_SERVER_ID) {
             const myServerResponse = `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\nCall Boss (Informação para Controle)\n **Server:** ${server} **Boss:** ${boss} \n**ID do Servidor:** ${message.guild.id} \n\n**Enviado por:** ${message.author.username} (ID: ${message.author.id})`;
 
             const myCallBossChannel = message.guild.channels.cache.find(channel => channel.name === CALLBOSS_ID_CHANNEL_NAME);
 
             if (myCallBossChannel) {
                 // Verificando se o bot tem permissão para enviar mensagens
                 if (myCallBossChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) {
                     myCallBossChannel.send(myServerResponse).catch(console.error);
                 } else {
                     console.error(`O bot não tem permissão para enviar mensagens no canal ${myCallBossChannel.name}`);
                 }
             } else {
                 console.log(`Canal ${CALLBOSS_CHANNEL_NAME} não encontrado no servidor ${message.guild.name}`);
             }
         }*/
    }

    //Apaga mensagem de um ID
    if (message.content.startsWith('/clearuser')) {
        // Verifica se o autor da mensagem é um usuário autorizado
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        const args = message.content.split(' ');
        const userId = args[1]; // Obtém o ID do usuário cujas mensagens serão apagadas
        const limit = parseInt(args[2]) || 100; // Número de mensagens a serem apagadas (padrão é 100)

        if (!userId) {
            return message.reply("Por favor, forneça um ID de usuário.");
        }

        try {
            const messages = await message.channel.messages.fetch({ limit: limit }); // Obtém as mensagens mais recentes
            const userMessages = messages.filter(msg => msg.author.id === userId); // Filtra mensagens do usuário especificado

            await message.channel.bulkDelete(userMessages); // Apaga as mensagens filtradas
            message.channel.send(`Apaguei ${userMessages.size} mensagens do usuário <@${userId}> com sucesso!`);
        } catch (error) {
            console.error("Erro ao apagar mensagens:", error);
            message.channel.send("Não consegui apagar as mensagens do usuário.");
        }
    }

    

    // Comando para listar os servidores onde o bot está presente
    if (message.content.startsWith('/listguilds')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando. Converse com NetoTTT Discord: netottt");
        }

        try {
            // Lista de servidores
            let guildList = "Lista de servidores onde o bot está presente:\n";

            client.guilds.cache.forEach(guild => {
                guildList += `- Nome: **${guild.name}** | ID: **${guild.id}**\n`;
            });

            // Envia a lista de guildas para o usuário autorizado via DM
            const authorizedUser = await client.users.fetch(AUTHORIZED_USER_ID);
            authorizedUser.send(guildList)
                .then(() => message.reply("A lista de servidores foi enviada para o seu privado!"))
                .catch(error => {
                    console.error("Erro ao enviar DM:", error);
                    message.reply("Não consegui enviar a lista de servidores para o seu privado.");
                });

        } catch (error) {
            console.error("Erro ao listar servidores:", error);
            message.reply("Houve um erro ao listar os servidores.");
        }
    }


    // Comando para apagar todas as mensagens do bot
    if (message.content.startsWith('/clearbot')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando. Converse com NetoTTT Discord: netottt");
        }

        const messagesToDelete = [];
        client.guilds.cache.forEach(async (guild) => {
            const callBossChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
            if (callBossChannel) {

                //Apaga as mensagens
                const fetchedMessages = await callBossChannel.messages.fetch({ limit: 100 });
                fetchedMessages.forEach(msg => {
                    if (msg.author.id === client.user.id) {
                        messagesToDelete.push(msg);
                    }
                });

                messagesToDelete.forEach(async (msg) => {
                    await msg.delete().catch(console.error);
                });

                messagesToDelete.length = 0;
            }
        });

        // Avisa que as mensagens foram apagadas
        const response = 'As mensagens foram apagadas pelo desenvolvedor NetoTTT';
        callBossChannel.send(response).catch(console.error);
        message.channel.send("Todas as mensagens do bot foram apagadas!");
    }

    // Comando para banir um usuário
    if (message.content.startsWith('/banuser')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando. Converse com NetoTTT Discord: netottt");
        }
    
        const userId = message.content.split(' ')[1]; // Obtém o ID do usuário a ser banido
        const user = message.guild.members.cache.get(userId);
    
        if (!user) {
            return message.reply("Usuário não encontrado.");
        }
    
        try {
            await user.ban({ reason: 'Banido pelo bot.' });
            message.channel.send(`Usuário ${user.user.tag} foi banido com sucesso!`);
        } catch (error) {
            console.error("Erro ao banir o usuário:", error);
            message.channel.send("Não consegui banir o usuário.");
        }
    }
    

    // Comando para banir a guilda
    if (message.content.startsWith('/banguild')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando. Converse com NetoTTT Discord: netottt");
        }

        try {
            await message.guild.ban(message.guild.id, { reason: 'Servidor banido pelo bot.' });
            message.channel.send(`Servidor ${message.guild.name} foi banido com sucesso!`);
        } catch (error) {
            console.error("Erro ao banir o servidor:", error);
            message.channel.send("Não consegui banir o servidor.");
        }
    }

    // Comando para desbanir um usuário
    if (message.content.startsWith('/unbanuser')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando. Converse com NetoTTT Discord: netottt");
        }

        const userId = message.content.split(' ')[1]; // Obtém o ID do usuário a ser desbanido

        if (!userId) {
            return message.reply("Por favor, forneça o ID do usuário a ser desbanido.");
        }

        try {
            await message.guild.members.unban(userId); // Desbane o usuário
            message.channel.send(`Usuário com ID ${userId} foi desbanido com sucesso!`);
        } catch (error) {
            console.error("Erro ao desbanir o usuário:", error);
            message.channel.send("Não consegui desbanir o usuário. Verifique se o ID está correto e se o usuário foi banido anteriormente.");
        }
    }

    //Comando de ajuda em Portugues
    if (message.content.startsWith('/callajuda')) {
        const helpMessage = `
        **Regras para o Uso do Bot:**
        1. **Comando Básico**: Para invocar o bot, utilize o comando na seguinte estrutura:  
           \`/callboss server.[o servidor] boss.[o boss]\`  
           **Exemplo**: \`/callboss server.Sa1 boss.VK\`
        2. **Formato Correto**: Certifique-se de usar o formato correto ao digitar o comando.
        3. **Canal Específico**: As mensagens devem ser enviadas no canal chamado \`#callbossnetottt\`.
        4. **Respeito Mútuo**: Todos os usuários devem tratar os outros com respeito ao usar o bot.
        5. **Apenas para Uso em Jogo**: Este bot é destinado apenas para fins relacionados ao jogo.
        6. **Feedback e Relatos de Erros**: Se você encontrar um erro, entre em contato com o administrador do servidor ou com desenvolvedor NetoTTT Discord: netottt.
        7. **Limite de Comandos**: Não envie comandos em excesso.
    
        **Lista de Comandos Disponíveis**:
        - \`/callboss server.[servidor] boss.[boss]\`: Chama um boss específico no servidor.
        - \`/banuser [user_id]\`: Bane um usuário do servidor.
        - \`/unbanuser [user_id]\`: Desbane um usuário.
        - \`/banguild\`: Bane a guilda.
        - \`/unbanguild\`: Desbane a guilda.
        - \`/clearbot\`: Apaga todas as mensagens do bot nos canais.
        - \`/listguilds\`: Envia a lista de servidores com o bot para o DM do administrador.
        - \`/status\`: Verifica o status do bot.
        - \`/serverinfo\`: Mostra informações do servidor.
        - \`/kick [user_id]\`: Expulsa um usuário do servidor.
        - \`/announce [mensagem]\`: Faz um anúncio global.
        - \`/userinfo [user_id]\`: Mostra informações sobre um membro.
        - \`/mute [user_id]\`: Muta um usuário.
        - \`/unmute [user_id]\`: Desmuta um usuário.
        - \`/ping\`: Verifica a latência do bot.
        - \`/restart\`: Reinicia o bot.
         \`/clearuser\`: Remove todas as mensagens de um usuário específico dentro de um intervalo de mensagens definido.

    
        **Lista de Bosses e suas Abreviações:**
        - Vampire King: VK
        - Goblin Lord: GL
        - Kamon the Cursed: KC
        - Slime Lord: SL
        - Drow Queen: DQ
        - General Krinok: GK
        - Goliath: GO
        - Zarron Bravehorn: ZB
        - Cerberus: CE
        - Wicked Pumpkin: WP
        - La Calaca: LC
        - Haunted Willow: HW
        - Evil Snowman: ES
        - Santa Claus: SC
        - Clyde Rabbit: CR
        - Bonnie Rabbit: BR`;
    
        try {
            await message.author.send(helpMessage);
            message.channel.send("Enviei as informações de ajuda para você em DM!");
        } catch (error) {
            console.error("Erro ao enviar DM:", error);
            message.channel.send("Não consegui enviar as informações de ajuda em DM. Você pode ter DMs desativadas.");
        }
    }

    //Comando de ajuda em ingles
    if (message.content.startsWith('/callhelp')) {
        const helpMessage = `
        **Bot Usage Rules:**
        1. **Basic Command**: To call the bot, use the command in the following format:  
           \`/callboss server.[the server] boss.[the boss]\`  
           **Example**: \`/callboss server.Sa1 boss.VK\`
        2. **Correct Format**: Make sure to use the correct format when typing the command.
        3. **Specific Channel**: Messages must be sent in the \`#callbossnetottt\` channel.
        4. **Mutual Respect**: All users must treat others with respect when using the bot.
        5. **Game-Related Use Only**: This bot is intended solely for game-related purposes.
        6. **Feedback and Bug Reports**: If you encounter a bug, contact the server administrator or the developer NetoTTT Discord: netottt.
        7. **Command Limit**: Avoid sending commands excessively.
    
        **Available Commands**:
        - \`/callboss server.[server] boss.[boss]\`: Calls a specific boss in the server.
        - \`/banuser [user_id]\`: Bans a user from the server.
        - \`/unbanuser [user_id]\`: Unbans a user.
        - \`/banguild\`: Bans the entire guild.
        - \`/unbanguild\`: Unbans the entire guild.
        - \`/clearbot\`: Deletes all bot messages in the channels.
        - \`/listguilds\`: Sends a list of servers the bot is in to the admin's DM.
        - \`/status\`: Checks the bot's status.
        - \`/serverinfo\`: Displays information about the server.
        - \`/kick [user_id]\`: Kicks a user from the server.
        - \`/announce [message]\`: Sends a global announcement.
        - \`/userinfo [user_id]\`: Displays information about a member.
        - \`/mute [user_id]\`: Mutes a user.
        - \`/unmute [user_id]\`: Unmutes a user.
        - \`/ping\`: Checks the bot's latency.
        - \`/restart\`: Restarts the bot.
    
        **List of Bosses and their Abbreviations**:
        - Vampire King: VK
        - Goblin Lord: GL
        - Kamon the Cursed: KC
        - Slime Lord: SL
        - Drow Queen: DQ
        - General Krinok: GK
        - Goliath: GO
        - Zarron Bravehorn: ZB
        - Cerberus: CE
        - Wicked Pumpkin: WP
        - La Calaca: LC
        - Haunted Willow: HW
        - Evil Snowman: ES
        - Santa Claus: SC
        - Clyde Rabbit: CR
        - Bonnie Rabbit: BR`;
    
        try {
            await message.author.send(helpMessage);
            message.channel.send("I've sent the help information to you via DM!");
        } catch (error) {
            console.error("Error sending DM:", error);
            message.channel.send("I couldn't send the help information via DM. You might have DMs disabled.");
        }
    }

    //Comando para verificar se o bot está ativo e funcionando corretamente
    if (message.content.startsWith('/status')) {
        message.reply("O bot está online e funcionando corretamente!");
    }
    
    //Exibe informações sobre o servidor, como o número de membros, nome do dono, região, e número de canais
    if (message.content.startsWith('/serverinfo')) {
        const { guild } = message;
        const serverInfo = `
        **Nome do servidor**: ${guild.name}
        **ID do servidor**: ${guild.id}
        **Dono do servidor**: ${guild.ownerId}
        **Total de membros**: ${guild.memberCount}
        **Total de canais**: ${guild.channels.cache.size}
        **Região**: ${guild.preferredLocale}
        `;
        message.channel.send(serverInfo);
    }
    
    //Remove um usuário do servidor
    if (message.content.startsWith('/kick')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }
    
        const userId = message.content.split(' ')[1];
        const user = message.guild.members.cache.get(userId);
    
        if (!user) {
            return message.reply("Usuário não encontrado.");
        }
    
        try {
            await user.kick({ reason: 'Removido pelo bot.' });
            message.channel.send(`Usuário ${user.user.tag} foi removido com sucesso!`);
        } catch (error) {
            console.error("Erro ao remover o usuário:", error);
            message.channel.send("Não consegui remover o usuário.");
        }
    }
    
    //Este comando pode ser usado para fazer um anúncio geral em todos os servidores que o bot está
    if (message.content.startsWith('/announce')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }
    
        const announcement = message.content.slice(10); // Remove "/announce " do início
        client.guilds.cache.forEach(guild => {
            const announcementChannel = guild.channels.cache.find(channel => channel.name === 'geral' || channel.name === 'anuncios');
            if (announcementChannel) {
                announcementChannel.send(announcement).catch(console.error);
            }
        });
    
        message.channel.send("O anúncio foi enviado para todos os servidores.");
    }

    //Exibe informações detalhadas sobre um membro específico do servidor
    if (message.content.startsWith('/userinfo')) {
        const userId = message.content.split(' ')[1];
        const user = message.guild.members.cache.get(userId);
    
        if (!user) {
            return message.reply("Usuário não encontrado.");
        }
    
        const userInfo = `
        **Nome**: ${user.user.username}
        **ID**: ${user.user.id}
        **Tag**: ${user.user.tag}
        **Conta criada em**: ${user.user.createdAt}
        **Entrou no servidor em**: ${user.joinedAt}
        `;
        message.channel.send(userInfo);
    }

    //Silencia um usuário no servidor por um período específico
    if (message.content.startsWith('/mute')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }
    
        const userId = message.content.split(' ')[1];
        const user = message.guild.members.cache.get(userId);
    
        if (!user) {
            return message.reply("Usuário não encontrado.");
        }
    
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            return message.reply("O cargo 'Muted' não foi encontrado.");
        }
    
        try {
            await user.roles.add(muteRole);
            message.channel.send(`${user.user.tag} foi mutado.`);
        } catch (error) {
            console.error("Erro ao mutar o usuário:", error);
            message.channel.send("Não consegui mutar o usuário.");
        }
    }
    
    //Remove o mudo de um usuário
    if (message.content.startsWith('/unmute')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }
    
        const userId = message.content.split(' ')[1];
        const user = message.guild.members.cache.get(userId);
    
        if (!user) {
            return message.reply("Usuário não encontrado.");
        }
    
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            return message.reply("O cargo 'Muted' não foi encontrado.");
        }
    
        try {
            await user.roles.remove(muteRole);
            message.channel.send(`${user.user.tag} foi desmutado.`);
        } catch (error) {
            console.error("Erro ao desmutar o usuário:", error);
            message.channel.send("Não consegui desmutar o usuário.");
        }
    }
    
    //Verifica a latência do bot
    if (message.content.startsWith('/ping')) {
        const ping = Date.now() - message.createdTimestamp;
        message.reply(`Pong! Latência: ${ping}ms`);
    }

    //Permite ao administrador reiniciar o bot remotamente
    if (message.content.startsWith('/restart')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }
    
        message.channel.send("Reiniciando o bot...")
            .then(() => process.exit(0)) // Força o processo a terminar, reinicializando o bot.
            .catch(error => console.error("Erro ao reiniciar o bot:", error));
    }
    
    
});

client.on('guildCreate', guild => {
    createChannelsIfNotExists(guild);
});

client.login(DISCORD_TOKEN);
