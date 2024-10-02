const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('./server');
const axios = require('axios');
const cheerio = require('cheerio');
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

    if (message.content.startsWith('/exp')) {
        const args = message.content.split(' ').slice(1);
        const levelAtual = parseInt(args[0]); // Primeiro argumento: nível atual
        const levelDesejado = parseInt(args[1]); // Segundo argumento: nível desejado
        const xpPorHora = parseInt(args[2]); // Terceiro argumento: XP por hora

        if (isNaN(levelAtual) || isNaN(levelDesejado) || isNaN(xpPorHora)) {
            return message.channel.send('Por favor, forneça os níveis e a experiência por hora corretamente. Exemplo: !exp 200 300 3600');
        }

        const url = 'https://www.rucoystats.com/tables/skills'; // Coloque a URL correta aqui

        try {
            // Fazer a requisição para a URL
            const response = await axios.get(url);
            const data = response.data;

            // Usar cheerio para carregar o HTML
            const $ = cheerio.load(data);

            // Armazenar dados de experiência
            const expData = [];

            // Supondo que a tabela tenha a classe '.exp-table' e as colunas corretas
            $('.exp-table tr').each((index, element) => {
                const level = $(element).find('td.level').text().trim();
                const expToNext = $(element).find('td.exp-to-next').text().trim(); // Ajuste conforme a estrutura da tabela
                const totalExp = $(element).find('td.total-exp').text().trim(); // Ajuste conforme a estrutura da tabela

                if (level && expToNext && totalExp) {
                    expData.push({
                        level: parseInt(level),
                        expToNext: parseInt(expToNext),
                        totalExp: parseInt(totalExp),
                    });
                }
            });

            // Calcular a experiência necessária
            const expNecessaria = expData.reduce((sum, row) => {
                if (row.level > levelAtual && row.level <= levelDesejado) {
                    return sum + row.expToNext;
                }
                return sum;
            }, 0);

            // Calcular o tempo necessário para alcançar o nível desejado
            const horasNecessarias = expNecessaria / xpPorHora;
            const horasInteiras = Math.floor(horasNecessarias);
            const minutos = Math.floor((horasNecessarias - horasInteiras) * 60);

            // Enviar a mensagem com o resultado
            message.channel.send(`Para subir do nível ${levelAtual} para ${levelDesejado}, você precisará de ${expNecessaria} XP, que levará aproximadamente ${horasInteiras}h ${minutos}m com ${xpPorHora} XP/hora.`);
        } catch (error) {
            console.error(error);
            message.channel.send('Ocorreu um erro ao buscar os dados.');
        }
    }

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

        // Usar uma função assíncrona para esperar as operações de deletar mensagens
        const deleteBotMessages = async (guild) => {
            const callBossChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
            if (callBossChannel) {
                const fetchedMessages = await callBossChannel.messages.fetch({ limit: 100 });
                const messagesToDelete = fetchedMessages.filter(msg => msg.author.id === client.user.id);

                // Deletar mensagens do bot
                await Promise.all(messagesToDelete.map(msg => msg.delete().catch(console.error)));

                return callBossChannel; // Retorna o canal onde as mensagens foram deletadas
            } else {
                createChannelsIfNotExists(guild);
                return null; // Indica que o canal não foi encontrado
            }
        };

        // Executar a deleção de mensagens em todos os servidores e coletar canais
        const deleteResults = await Promise.all(client.guilds.cache.map(guild => deleteBotMessages(guild)));

        // Enviar mensagem ao canal indicando que as mensagens foram apagadas em cada canal encontrado
        const response = 'As mensagens foram apagadas pelo desenvolvedor NetoTTT\nThe messages were deleted by developer NetoTTT';
        for (const channel of deleteResults) {
            if (channel) {
                await channel.send(response).catch(console.error);
            }
        }

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
        **Regras do Bot:**
        1. **Comando**: Use \`/callboss server.[servidor] boss.[boss]\`.
           **Ex**: \`/callboss server.Sa1 boss.VK\`
        2. **Formato Correto**: Verifique se digitou corretamente.
        3. **Canal**: Envie no canal \`#callbossnetottt\`.
        4. **Respeito**: Trate todos com respeito.
        5. **Uso**: Apenas para fins de jogo.
        6. **Feedback**: Relate erros ao admin ou NetoTTT Discord: netottt.
        7. **Limite**: Não envie muitos comandos.

        **Comandos Disponíveis**:
        - \`/callboss server.[servidor] boss.[boss]\`: Chama um boss.
        - \`/banuser [user_id]\`: Bane um usuário.
        - \`/unbanuser [user_id]\`: Desbane um usuário.
        - \`/banguild\`: Bane a guilda.
        - \`/unbanguild\`: Desbane a guilda.
        - \`/clearbot\`: Apaga mensagens do bot.
        - \`/status\`: Verifica o status do bot.
        - \`/kick [user_id]\`: Expulsa um usuário.
        - \`/ping\`: Verifica a latência.
        - \`/restart\`: Reinicia o bot.
        - \`/clearuser\`: Remove mensagens de um usuário.
        - \`/ann\`: anuncio.

        **Bosses e Abreviações**:
        - VK: Vampire King
        - GL: Goblin Lord
        - KC: Kamon the Cursed
        - SL: Slime Lord
        - DQ: Drow Queen
        - GK: General Krinok
        - GO: Goliath
        - ZB: Zarron Bravehorn
        - CE: Cerberus
        - WP: Wicked Pumpkin
        - LC: La Calaca
        - HW: Haunted Willow
        - ES: Evil Snowman
        - SC: Santa Claus
        - CR: Clyde Rabbit
        - BR: Bonnie Rabbit`;

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
        **Bot Rules:**
        1. **Command**: Use \`/callboss server.[server] boss.[boss]\`.
           **Ex**: \`/callboss server.Sa1 boss.VK\`
        2. **Correct Format**: Ensure you typed it correctly.
        3. **Channel**: Send in \`#callbossnetottt\`.
        4. **Respect**: Treat everyone with respect.
        5. **Use**: For gaming purposes only.
        6. **Feedback**: Report errors to the admin or NetoTTT Discord: netottt.
        7. **Limit**: Don't spam commands.

        **Available Commands**:
        - \`/callboss server.[server] boss.[boss]\`: Calls a boss.
        - \`/banuser [user_id]\`: Bans a user.
        - \`/unbanuser [user_id]\`: Unbans a user.
        - \`/banguild\`: Bans the guild.
        - \`/unbanguild\`: Unbans the guild.
        - \`/clearbot\`: Deletes bot messages.
        - \`/status\`: Checks the bot status.
        - \`/kick [user_id]\`: Kicks a user.
        - \`/ping\`: Checks latency.
        - \`/restart\`: Restarts the bot.
        - \`/clearuser\`: Removes messages from a specific user.

        **Bosses and Abbreviations**:
        - VK: Vampire King
        - GL: Goblin Lord
        - KC: Kamon the Cursed
        - SL: Slime Lord
        - DQ: Drow Queen
        - GK: General Krinok
        - GO: Goliath
        - ZB: Zarron Bravehorn
        - CE: Cerberus
        - WP: Wicked Pumpkin
        - LC: La Calaca
        - HW: Haunted Willow
        - ES: Evil Snowman
        - SC: Santa Claus
        - CR: Clyde Rabbit
        - BR: Bonnie Rabbit`;

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
    if (message.content.startsWith('/ann')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        const announcement = message.content.slice(10); // Remove "/announce " do início
        client.guilds.cache.forEach(guild => {
            const announcementChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
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
