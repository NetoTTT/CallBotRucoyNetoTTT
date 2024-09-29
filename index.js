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

    // Comando para apagar todas as mensagens do bot
    if (message.content.startsWith('/clearbot')) {
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando. Converse com NetoTTT Discord: netottt");
        }

        const messagesToDelete = [];
        client.guilds.cache.forEach(async (guild) => {
            const callBossChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
            if (callBossChannel) {
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


    // Comando de ajuda
    if (message.content.startsWith('/callajuda')) {
        const helpMessage = `
        **Regras para o Uso do Bot:**
        1. **Comando Básico**: Para invocar o bot, utilize o comando na seguinte estrutura:  
           \`/callboss server.[o servidor] boss.[o boss]\`  
           **Exemplo**: \`/callboss server.Sa1 boss.VK\`
        2. **Formato Correto**: Certifique-se de usar o formato correto ao digitar o comando. A sintaxe deve ser respeitada.
        3. **Canal Específico**: As mensagens devem ser enviadas no canal chamado \`#callbossnetottt\`.
        4. **Respeito Mútuo**: Todos os usuários devem tratar os outros com respeito ao usar o bot.
        5. **Apenas para Uso em Jogo**: Este bot é destinado apenas para fins relacionados ao jogo.
        6. **Feedback e Relatos de Erros**: Se você encontrar um erro, entre em contato com o administrador do servidor ou com desenvolvedor NetoTTT Discord: netottt .
        7. **Limite de Comandos**: Não envie comandos em excesso.

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
        - Bonnie Rabbit: BR`; // Mensagem de ajuda conforme a versão anterior

        try {
            await message.author.send(helpMessage);
            message.channel.send("Enviei as informações de ajuda para você em DM!");
        } catch (error) {
            console.error("Erro ao enviar DM:", error);
            message.channel.send("Não consegui enviar as informações de ajuda em DM. Você pode ter DMs desativadas.");
        }
    }
});

client.on('guildCreate', guild => {
    createChannelsIfNotExists(guild);
});

client.login(DISCORD_TOKEN);
