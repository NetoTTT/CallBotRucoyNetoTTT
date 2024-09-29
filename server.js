const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bem-vindo ao bot do Discord!');
});

app.get('/ping', (req, res) => {
    res.send('Bot está acordado!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
