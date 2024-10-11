const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('./server');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const serviceAccount = require('./callbossdiscordbot-firebase-adminsdk-g4z86-bf1e6615b1.json'); // caminho para suas credenciais do Firebase

const puppeteer = require('puppeteer');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const dbfire = admin.firestore();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CALLBOSS_CHANNEL_NAME = 'callbossnetottt';
const CALLBOSS_ID_CHANNEL_NAME = 'callbossid'; // Novo canal
const AUTHORIZED_USER_ID = '929052615273250896'; // ID do usuário autorizado
const MY_SERVER_ID = '1180256244066418769'; // Coloque aqui o ID do seu servidor
const uri = 'mongodb+srv://foque222:Q12L1lMhwovUNyc9@callbossnetottt.hdkwm.mongodb.net/?retryWrites=true&w=majority&appName=callbossnetottt'; // Substitua pelo URI do MongoDB Atlas
const clientDB = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

clientDB.connect().then(() => {
    db = clientDB.db('bossRankingDB'); // Nome do banco de dados
});

client.once('ready', () => {
    console.log('Bot do Discord está online!');
    client.guilds.cache.forEach(guild => createChannelsIfNotExists(guild));
    client.user.setActivity('NetoTTT', { type: 'LISTENING' });
});

async function addBossCall(username) {
    const collection = db.collection('callboss_ranking');

    // Incrementa o contador de anúncios para o usuário
    await collection.updateOne(
        { name: username },
        { $inc: { count: 1 } },
        { upsert: true } // Se o usuário não existir, ele será inserido
    );
}

async function getBossCallRanking() {
    const collection = db.collection('callboss_ranking');

    // Busca os usuários ordenados por quantidade de anúncios
    const ranking = await collection.find().sort({ count: -1 }).toArray();
    return ranking;
}

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

async function getExperienceData() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://www.rucoystats.com/tables/skills', { waitUntil: 'networkidle2' });

    const expData = await page.evaluate(() => {
        const data = [];
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                const level = parseInt(cells[0]?.innerText);
                const expToNext = parseInt(cells[1]?.innerText.replace(/,/g, ''));
                const totalExp = parseInt(cells[2]?.innerText.replace(/,/g, ''));

                // Verifica se as células têm valores válidos
                if (!isNaN(level) && !isNaN(expToNext) && !isNaN(totalExp)) {
                    data.push({ level, expToNext, totalExp });
                }
            }
        });
        return data;
    });

    await browser.close();
    return expData;
}

// Listen for additions in the bossCalls collection
dbfire.collection('bossCalls').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const data = change.doc.data();
            const response = `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n**Call Boss**\n**Server:** ${data.server} **Boss:** ${data.boss} \n\n**Sent by:** ${data.user} via WhatsApp \n**User ID:** ${data.userId} \n**Guild ID:** ${data.guildId}`;

            // Send the message to all channels with CALLBOSS_CHANNEL_NAME
            client.guilds.cache.forEach(guild => {
                const callBossChannel = guild.channels.cache.find(channel => channel.name === 'callbossnetottt');
                if (callBossChannel) {
                    callBossChannel.send(response).catch(console.error);
                }
            });
        }
    });
});

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
        const args = message.content.split(' ');

        if (args.length < 4) {
            return message.channel.send(
                'Para usar este comando corretamente, insira a skill atual, a skill desejada e a quantidade de XP por hora.\n' +
                'Exemplo de uso: `/exp 200 300 3600`\n' +
                'Nota: 3600 XP/h é o ganho ao treinar com 1 inimigo. Se estiver treinando com 4 inimigos (skillando), o ganho pode ser de até 14400 XP/h.\n\n' +
                'To use this command correctly, provide the current skill, the desired skill, and the XP per hour.\n' +
                'Example usage: `/exp 200 300 3600`\n' +
                'Note: 3600 XP/h is the gain when training with 1 enemy. If training with 4 enemies (skilling), the gain can be up to 14400 XP/h.'
            );
        }

        const skillAtual = parseInt(args[1]); // Primeiro argumento: skill atual
        const skillDesejada = parseInt(args[2]); // Segundo argumento: skill desejada
        const xpPorHora = parseInt(args[3]); // Terceiro argumento: XP por hora

        // Verificar se as skills estão dentro do intervalo permitido
        if (skillAtual < 55 || skillDesejada > 1000) {
            return message.channel.send('As habilidades devem estar entre 55 e 1000.');
        }

        try {
            // Obter dados de experiência
            const expData = await getExperienceData();

            // Calcular a experiência total necessária
            let experienciaTotalNecessaria = 0;

            for (let i = skillAtual - 55; i < skillDesejada - 55; i++) {
                if (expData[i]) { // Verifica se expData[i] está definido
                    experienciaTotalNecessaria += expData[i].expToNext;

                    // Imprime o valor acumulado de experienciaTotalNecessaria no console
                    //console.log(`Nível ${i + 55}: Exp total acumulada = ${experienciaTotalNecessaria}`);
                } else {
                    console.log(`Índice fora do alcance: ${i}`);
                    return message.channel.send('Erro ao acessar os dados de experiência. Verifique a tabela.');
                }
            }

            // Calcular o tempo necessário em horas
            const tempoNecessarioEmHoras = experienciaTotalNecessaria / xpPorHora;

            // Converter tempo para horas e minutos
            const dias = Math.floor(tempoNecessarioEmHoras / 24);
            const horasRestantes = Math.floor(tempoNecessarioEmHoras % 24);
            const minutos = Math.round((tempoNecessarioEmHoras - Math.floor(tempoNecessarioEmHoras)) * 60);

            // Verificar se o tempo total inclui dias e formatar a mensagem de forma apropriada
            let resultado;
            if (dias > 0) {
                resultado = `Para ir do Skill ${skillAtual} ao Skill ${skillDesejada} com ${xpPorHora} XP/h, levará ${dias}d ${horasRestantes}h ${minutos}m.\n` +
                    `To go from Skill ${skillAtual} to Skill ${skillDesejada} with ${xpPorHora} XP/h, it will take ${dias}d ${horasRestantes}h ${minutos}m.`;
            } else {
                resultado = `Para ir do Skill ${skillAtual} ao Skill ${skillDesejada} com ${xpPorHora} XP/h, levará ${horasRestantes}h ${minutos}m.\n` +
                    `To go from Skill ${skillAtual} to Skill ${skillDesejada} with ${xpPorHora} XP/h, it will take ${horasRestantes}h ${minutos}m.`;
            }

            message.channel.send(resultado);
        } catch (error) {
            console.error(error);
            message.channel.send('Ocorreu um erro ao buscar os dados.');
        }
    }

    const cooldowns = new Map();

    if (message.content.startsWith('/callboss')) {
        const args = message.content.split(' ').slice(1);
        let server = args.find(arg => arg.startsWith('server'))?.split('.')[1];
        let boss = args.find(arg => arg.startsWith('boss'))?.split('.')[1];
        let P = args.find(arg => arg.startsWith('p'))?.split('.')[1];

        // Verifica se o server e boss estão no formato correto
        const validServers = ['na1', 'na2', 'na3', 'na4', 'na5', 'na6', 'sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'eu1', 'eu2', 'eu3', 'eu4', 'eu5', 'eu6', 'a1', 'a2', 'a3', 'a4'];
        const validBosses = ['gl', 'kc', 'sl', 'dq', 'gk', 'go', 'zb', 'ce', 'wp', 'lc', 'hw', 'es', 'sc', 'cr', 'br'];
        const validP = ["1","2"];

        // Transformar para minúsculo para validação
        server = server?.toLowerCase();
        boss = boss?.toLowerCase();

        if (!validServers.includes(server) || !validBosses.includes(boss) || !validP.includes(P)) {
            const validServersList = validServers.map(s => s.toUpperCase()).join(', ');
            const validBossesList = validBosses.map(b => b.toUpperCase()).join(', ');
        
            return message.reply(
                `Servidor ou boss inválido. Por favor, forneça um servidor e boss válidos.\n\n**Servidores válidos:** ${validServersList}\n**Bosses válidos:** ${validBossesList}`
            );
        }
        

        // Verificar o cooldown
        const now = Date.now();
        const cooldownAmount = 60 * 1000; // 1 minuto em milissegundos

        if (cooldowns.has(message.author.id)) {
            const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`Você deve esperar mais ${timeLeft.toFixed(1)} segundos antes de usar o comando novamente.`);
            }
        }

        cooldowns.set(message.author.id, now);

        // Incrementa o contador de boss calls para o usuário
        await addBossCall(message.author.username);

        // Obtém o ranking atualizado do usuário
        const ranking = await getBossCallRanking();

        // Encontrar a posição do usuário no ranking
        const userRanking = ranking.findIndex(user => user.name === message.author.username) + 1;
        const userCalls = ranking.find(user => user.name === message.author.username).count;

        // Monta a mensagem de anúncio do boss com o rank individual
        const response = `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n**Call Boss**\n**Server:** ${server.toUpperCase()} **Boss:** ${boss.toUpperCase()} **P** ${P}\n\n**Sent by:** ${message.author.username} from Guild **${message.guild.name}** \n\n**Current Rank:** #${userRanking} with **${userCalls}** boss announcements\n\n**ID do(a) ${message.author.username}:** ${message.author.id} \n**ID Server (Guild) ID:** ${message.guild.id}`;

        // Envia a chamada de boss para a coleção do usuário (registro individual)
        await dbfire.collection('bossCallsUsers').doc(message.author.id).collection('calls').add({
            server: server.toUpperCase(),
            boss: boss.toUpperCase(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Envia a chamada de boss para a coleção global (todas as chamadas)
        await dbfire.collection('bossCallsGlobal').add({
            server: server.toUpperCase(),
            boss: boss.toUpperCase(),
            user: message.author.username,
            userId: message.author.id,
            guildId: message.guild.id,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Envia a mensagem para todos os canais CALLBOSS_CHANNEL_NAME
        client.guilds.cache.forEach(guild => {
            const callBossChannel = guild.channels.cache.find(channel => channel.name === 'callbossnetottt'); // Substitua pelo nome do seu canal
            if (callBossChannel) {
                callBossChannel.send(response).catch(console.error);
            }
        });

        // Envia uma confirmação ao usuário no canal original
        message.channel.send(`**${message.author.username}**, seu rank foi atualizado! Você está em **#${userRanking}** com **${userCalls}** calls de boss.`);
    }



    if (message.content.startsWith('/tops')) {
        // Verifica se o usuário tem permissão para usar o comando (somente você pode usar)
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.channel.send('Você não tem permissão para usar este comando.');
        }

        // Busca o ranking de usuários
        const ranking = await getBossCallRanking();

        if (ranking.length > 0) {
            let rankingMessage = 'Boss announcer ranking:\n';
            ranking.forEach((user, index) => {
                rankingMessage += `${index + 1}. ${user.name}: ${user.count} Calls\n`;
            });

            // Envia o ranking para o canal onde o comando foi chamado
            message.channel.send(rankingMessage);

            // Envia o ranking para todos os servidores com o canal CALLBOSS_CHANNEL_NAME
            client.guilds.cache.forEach(guild => {
                const callBossChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
                if (callBossChannel) {
                    callBossChannel.send(rankingMessage).catch(console.error);
                } else {
                    createChannelsIfNotExists(guild);
                }
            });
        } else {
            message.channel.send('Nenhum anúncio de boss foi registrado ainda.');
        }
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

    if (message.content.startsWith('/sendmsg')) {
        // Verificar se o usuário é autorizado
        if (message.author.id !== AUTHORIZED_USER_ID) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        const args = message.content.split(' ').slice(1);
        const targetUserId = args[0]; // O primeiro argumento é o ID do usuário de destino
        const msgContent = args.slice(1).join(' '); // O restante é a mensagem a ser enviada

        // Verifica se o ID do usuário e a mensagem foram fornecidos
        if (!targetUserId || !msgContent) {
            return message.reply("Por favor, forneça o ID do usuário e a mensagem. Exemplo: `/sendmsg 123456789012345678 Olá, como vai?`");
        }

        // Tenta encontrar o usuário com o ID fornecido
        client.users.fetch(targetUserId).then(user => {
            // Envia a mensagem para o usuário encontrado
            user.send(msgContent)
                .then(() => {
                    message.reply(`Mensagem enviada para o usuário ${user.tag}.`);
                })
                .catch(err => {
                    console.error("Erro ao enviar mensagem: ", err);
                    message.reply("Houve um erro ao enviar a mensagem.");
                });
        }).catch(err => {
            console.error("Erro ao buscar usuário: ", err);
            message.reply("Não consegui encontrar o usuário com o ID fornecido.");
        });
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
        1. **Comando**: Use \`/callboss server.[servidor] boss.[boss] p.[P1 ou P2]\`.
           **Ex**: \`/callboss server.Sa1 boss.VK p.1\`
        2. **Formato Correto**: Verifique se digitou corretamente.
        3. **Canal**: Envie no canal \`#callbossnetottt\`.
        4. **Respeito**: Trate todos com respeito.
        5. **Uso**: Apenas para fins de jogo.
        6. **Feedback**: Relate erros ao admin ou NetoTTT Discord: netottt.
        7. **Limite**: Não envie muitos comandos.

        **Comandos Disponíveis**:
        - \`/callboss server.[servidor] boss.[boss] p.[P1 ou P2]\`: Chama um boss.
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
        - \`/exp\`: Calcula o tempo necessário para subir de um nível de skill para outro, com base na quantidade de XP por hora.

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
        1. **Command**: Use \`/callboss server.[server] boss.[boss] p.[P1 or P2]\`.
           **Ex**: \`/callboss server.Sa1 boss.VK p.1\`
        2. **Correct Format**: Ensure you typed it correctly.
        3. **Channel**: Send in \`#callbossnetottt\`.
        4. **Respect**: Treat everyone with respect.
        5. **Use**: For gaming purposes only.
        6. **Feedback**: Report errors to the admin or NetoTTT Discord: netottt.
        7. **Limit**: Don't spam commands.

        **Available Commands**:
        - \`/callboss server.[server] boss.[boss] p.[P1 or P2]\`: Calls a boss.
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
        - \`/exp\`: Calculates the time needed to climb from one skill level to another, based on the amount of XP per hour.


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

        const announcement = message.content.slice(5); // Remove "/ann " do início
        client.guilds.cache.forEach(guild => {
            const announcementChannel = guild.channels.cache.find(channel => channel.name === CALLBOSS_CHANNEL_NAME);
            if (announcementChannel) {
                announcementChannel.send(announcement).catch(console.error);
            }
        });

        // Envia a chamada de boss para a coleção global (todas as chamadas)
        await dbfire.collection('UpdatesAndAnn').add({
            announcement,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
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
