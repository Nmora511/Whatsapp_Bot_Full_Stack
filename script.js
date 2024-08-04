
const apiUrl = "http://localhost:8001/api/";

document.getElementById('generateBtn').addEventListener('click', function(event){
    event.preventDefault();
    fetchQrCode();
});

document.getElementById('formExcel').addEventListener('submit', function(event) {
    event.preventDefault();
    postExcel();
});

document.getElementById('formFile').addEventListener('submit', function(event) {
    event.preventDefault();
    postMedia();
});

document.getElementById('formText').addEventListener('submit', function(event) {
    event.preventDefault();
    postMessage();
});

document.getElementById('formNumbers').addEventListener('submit', function(event) {
    console.log("teste")
    event.preventDefault();
    postNumbers();
});

document.getElementById('numbersData').addEventListener('change', function() {
    const fileInput = this;
    const fileName = fileInput.files[0].name; // Pega o nome do arquivo
    const dataUrlDisplay = document.getElementById('dataUrl');
    dataUrlDisplay.textContent = fileName; // Atualiza o texto do <p> com o nome do arquivo
});

document.getElementById('sentFile').addEventListener('change', function() {
    const fileInput = this;
    // const fileName = fileInput.files[0].name; // Pega o nome do arquivo
    const fileName = fileInput.files[0].name
    const dataUrlDisplay = document.getElementById('fileUrl');
    dataUrlDisplay.textContent = fileName; // Atualiza o texto do <p> com o nome do arquivo
});

function postExcel(){
    const formData = new FormData(document.getElementById('formExcel'));

    axios.post(apiUrl + 'excel', formData)
    .then(response => {
        if(response.status === 200){
            button = document.getElementById('sendDataBtn');
            button.textContent = "✔";
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function postMessage(){
    const message = document.getElementById("sentText").value;

    axios.post(apiUrl + 'message', { message : message})
    .then(response => {
        if(response.status === 200){
            button = document.getElementById('sendTextBtn');
            button.textContent = "✔";
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function postMedia(){
    const formData = new FormData(document.getElementById("formFile"));

    axios.post(apiUrl + 'media' , formData)
    .then(response => {
        if(response.status === 200){
            button = document.getElementById('sendFileBtn');
            button.textContent = "✔";
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function postNumbers(){
    const firstNumber = parseInt(document.getElementById("firstNumber").value);
    const lastNumber = parseInt(document.getElementById("lastNumber").value);

    axios.post(apiUrl + 'range', {
        firstNumber: firstNumber,
        lastNumber: lastNumber, 
    })
    .then(response => {
        if(response.status === 200){
            button = document.getElementById('dataSuccess');
            button.textContent = "✔";
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function getProgress(){
    fetch(apiUrl + "progress")
    .then(response => response.json())
    .then(async data => {
        progressBar = document.getElementById("progressBar");
        progressBar.value = data.percentage;

        progressNumber = document.getElementById("progressNumber");
        progressNumber.textContent = data. percentage + "%";

        chatLog = document.getElementById("wppHistory");
        chatLog.textContent = data.log;

        if(!data.finished){
            await sleep(30000);
            getProgress();
        }
    })
}

async function fetchQrCode() {
    await fetch(apiUrl + "qrcode")
        .then(response => response.json())
        .then(data => {
            if (data.url) {
                const qrCodeDisplay = document.getElementById('qrCodeDisplay');
                qrCodeDisplay.innerHTML = ` <div id="qrCodeContainer">
                                            <h1 class="text-4xl font-bold m-6 text-green-950">Qrcode</h1>
                                            <div class="w-fit h-fit border-green-950 border-[0.2rem] rounded-md"> 
                                                <img class="p-1 m-3 w-[25rem] h-[25rem] 
                                            </div>" src="${data.url}" alt="QR Code">
                                            </div>`;
            }
        })
        .catch(error => {
            console.error('Error fetching QR Code:', error);
            document.getElementById('qrCodeDisplay').innerHTML = `<p>Error Loading QR Code</p>`;
        });

    fetch(apiUrl + "qrcode/wait-for-ready")
    .then(response => response.json())
    .then(async data => {
        if (data.clientReady) {
            const sendingButton = document.getElementById("sending");
            sendingButton.classList.toggle("hidden");

            const qrcode = document.getElementById("qrCodeContainer");
            qrcode.classList.toggle("hidden");

            const qrCodeButton = document.getElementById("generateBtn");
            qrCodeButton.classList.remove("bg-green-950");
            qrCodeButton.classList.add("bg-green-800");

            await sleep(10000);
            getProgress();
        }
    })
    .catch(error => {
        console.error('Error fetching ClientStatus:', error);
    });
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}
