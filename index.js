const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('./server')
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Token do bot (que será configurado via .env)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Nome do canal que o bot vai usar
const CALLBOSS_CHANNEL_NAME = 'callbossnetottt';

// ID do usuário autorizado a usar o comando de limpeza
const AUTHORIZED_USER_ID = '929052615273250896';  // Substitua pelo ID do usuário autorizado

// Quando o bot estiver pronto
client.once('ready', () => {
    console.log('Bot do Discord está online!');
    // Cria o canal nos servidores em que o bot estiver
    client.guilds.cache.forEach(guild => createChannelIfNotExists(guild));
});

// Função para criar o canal caso não exista
async function createChannelIfNotExists(guild) {
    const channelExists = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
    if (!channelExists) {
        try {
            await guild.channels.create({
                name: CALLBOSS_CHANNEL_NAME,
                type: 0,  // 0 representa o tipo de canal de texto
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages], // Bloquear o envio de mensagens por todos os usuários
                    }
                ]
            });
            console.log(`Canal ${CALLBOSS_CHANNEL_NAME} criado em ${guild.name}`);
        } catch (error) {
            console.error(`Erro ao criar o canal em ${guild.name}:`, error);
        }
    }
}

// Lógica para escutar mensagens
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;  // Ignora as mensagens do próprio bot

    // Comando para chamar o boss
    if (message.content.startsWith('/callboss')) {
        // Extrai as informações do comando
        const args = message.content.split(' ').slice(1);
        const server = args.find(arg => arg.startsWith('server'))?.split('.')[1];
        const boss = args.find(arg => arg.startsWith('boss'))?.split('.')[1];

        // Verifica se tanto server quanto boss foram fornecidos
        if (!server || !boss) {
            return;  // Não faz nada se server ou boss não forem especificados
        }

        // Monta a mensagem
        const response = `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\nCall Boss\n **Server:** ${server} **Boss:** ${boss} \n\n**Enviado por:** ${message.author.username} da Guild **${message.guild.name}**`;

        // Envia a mensagem para o canal específico em todos os servidores
        client.guilds.cache.forEach(guild => {
            const callBossChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
            if (callBossChannel) {
                callBossChannel.send(response).catch(console.error);
            } else {
                // Se o canal não existir por algum motivo, tenta criá-lo novamente
                createChannelIfNotExists(guild);
            }
        });
    }

    // Comando para apagar todas as mensagens do bot
    if (message.content.startsWith('/clearbot')) {
        // Verifica se o autor da mensagem é o usuário autorizado
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        // Apaga mensagens do bot em todos os servidores
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

                // Deleta as mensagens
                messagesToDelete.forEach(async (msg) => {
                    await msg.delete().catch(console.error);
                });

                // Limpa a lista após deletar
                messagesToDelete.length = 0; 
            }
        });

        message.channel.send("Todas as mensagens do bot foram apagadas!");
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
        - Bonnie Rabbit: BR
        `;

        // Envia a mensagem de ajuda como DM para o usuário
        try {
            await message.author.send(helpMessage);
            message.channel.send("Enviei as informações de ajuda para você em DM!");
        } catch (error) {
            console.error("Erro ao enviar DM:", error);
            message.channel.send("Não consegui enviar as informações de ajuda em DM. Você pode ter DMs desativadas.");
        }
    }
});

// Evento para quando o bot entrar em um novo servidor
client.on('guildCreate', guild => {
    createChannelIfNotExists(guild);
});

// Logar o bot
client.login(DISCORD_TOKEN);
