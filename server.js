const express = require('express');
const app = express();

app.use(express.json());

// Rota para receber comandos e enviar para o bot
app.post('/discord-callboss', (req, res) => {
    const { server, boss, user } = req.body;
    console.log(`Server: ${server}, Boss: ${boss}, User: ${user}`);
    // Aqui você pode fazer uma chamada ao bot do Discord usando o cliente do bot
    res.send('Comando enviado para o Discord!');
});

// Porta que será usada pelo Railway (Railway atribui uma porta automaticamente)
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});
