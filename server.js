const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const cors = require('cors');
const timeout = require('connect-timeout')
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.static('public'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(timeout('10m')); // '5m' significa 5 minutos
const port = 8001; // Certifique-se de que a porta não conflita com outras aplicações

// Configura o cliente do WhatsApp
const client = new Client(); 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Diretório onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        // Cria o nome do arquivo com o identificador único e a extensão original
        cb(null, file.originalname);
    }
});
const upload = multer({ storage : storage });


let qrCodeUrl = '';
let clientReady = false;

let readyPromise;
let resolveReady;

let _excelUrl;
let excelData = {
    get excelFile() {
        return _excelUrl ? lerArquivoXlsx(_excelUrl) : undefined;
    },
    set excelUrl(value) {
        _excelUrl = value;
    }
};

let sentMedia;
let sentMessage;

let start;
let end;

let counter;
let percentage;
let timeleft;

let log = "";
let message;
let finished = false;

client.on('qr', (qr) => {
    // Gera QR Code como URL
    QRCode.toDataURL(qr, (err, url) => {
        qrCodeUrl = url;
        clientReady = false;
        readyPromise = new Promise(resolve => {
            resolveReady = resolve;
        });
    });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    clientReady = true;
    resolveReady();

    for (let i = start; i <= end; i++){
        let contato = excelData.excelFile[i].numbers;
        await send(contato);
    }

     finished = true;

     await client.destroy();

});

client.initialize();

// Rota para pegar o QR Code
app.get('/api/qrcode', (req, res) => {
    if (qrCodeUrl) {
        console.log(sentMedia);
        res.send({ url: qrCodeUrl });
        console.log("QrCode Enviado");
    } else {
        res.status(404).send({ message: 'QR Code not available yet.' });
    }
});

app.get('/api/qrcode/wait-for-ready', async (req, res) => {
    if (!qrCodeUrl) {
        return res.status(404).send({ message: 'QR Code not available yet.' });
    }
    // Aguarda a promessa ser resolvida (o cliente estar pronto)
    await readyPromise;
    res.send({ clientReady: clientReady });
});

app.post('/api/excel', upload.single('excel'), (req, res) => {

    try {
        excelData.excelUrl = req.file.path;
        console.log('Excel Adicionado');
        res.send('file received successfully');
    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
        res.status(500).send('Erro ao processar o arquivo');
    }
});

app.post('/api/message', (req, res) => {
    sentMessage = req.body.message;
    console.log('Mensagem Adicionada');
    res.send("message received successfully");
});

app.post('/api/media', upload.single('media'), (req, res) => {
    console.log(req.file);
    sentMedia = MessageMedia.fromFilePath(req.file.path);
    console.log('Media Adicionada');
    res.send("media received successfully");
})

app.post('/api/range', (req, res) => {
    counter = req.body.firstNumber;
    start = req.body.firstNumber - 1;
    end = req.body.lastNumber - 1;
    console.log('Range adicionado');
    res.send("range received successfully");
})

app.get('/api/progress', (req, res) => {
    res.status(200).send({
        percentage : percentage,
        log : log,
        finished : finished
    })
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function send(chatId){
    if(sentMessage && sentMedia){
        await client.sendMessage(chatId, sentMedia);
        await client.sendMessage(chatId, sentMessage);
    }
    else if(sentMessage){
        await client.sendMessage(chatId, sentMessage);
    }
    else if(sentMedia){
        await client.sendMessage(chatId, sentMedia);
    }
    else{
        return;
    }

    timeleft = ((end + 1) - counter) * 30
    message = "Mensagem enviada para " + chatId + " | " + counter + "/" + (end+1) + " | aprox. " + timeleft + "s restantes";
    log = log + "\n" + message;
    console.log(message);
    percentage = Math.round((counter / (end+1)) * 100);
    counter++; 

    await sleep(30000);
}

function lerArquivoXlsx(caminhoArquivo) {
    try{
        const workbook = XLSX.readFile(caminhoArquivo);
        const sheet_name_list = workbook.SheetNames;
        const dados = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        return dados;
    }
    catch(error){
        console.log(error);
        throw error;
    }
  }