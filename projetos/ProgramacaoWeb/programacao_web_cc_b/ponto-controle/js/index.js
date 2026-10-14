// Função para atualizar data e hora na página principal
function atualizarDataHora() {
    var agora = new Date();
    var fusoHorario = document.getElementById('fusoHorario').value;
    var opcoes = { timeZone: fusoHorario };
    var hora = agora.toLocaleTimeString('en-US', opcoes);
    var data = agora.toLocaleDateString('en-US', opcoes);
    document.getElementById('dataHora').textContent = data + ' ' + hora;
}

// Função para atualizar data e hora no modal
function atualizarModalDataHora() {
    var dataHora = document.getElementById('dataHora').textContent;
    document.getElementById('modalDataHora').textContent = dataHora;
}

// Função para exibir uma mensagem no banner de notificação
function exibirNotificacao(mensagem) {
    var banner = document.getElementById('bannerNotificacao');
    banner.textContent = mensagem;
    banner.style.display = 'block'; // Exibe o banner

    // Oculta o banner após 3 segundos
    setTimeout(function() {
        banner.style.display = 'none';
    }, 3000);
}

// Função para abrir/fechar opções avançadas no modal
document.getElementById('gearIcon').addEventListener('click', function() {
    var advancedOptions = document.getElementById('advancedOptions');
    if (advancedOptions.style.display === 'none') {
        advancedOptions.style.display = 'block'; // Mostrar opções avançadas
    } else {
        advancedOptions.style.display = 'none'; // Ocultar opções avançadas
    }
});

// Função para registrar o ponto ao clicar no botão dentro do modal
document.getElementById('punch-in-button').addEventListener('click', function() {
    // Verificar se o campo de data e hora manual foi preenchido
    var dataHoraManual = document.getElementById('manualDataHora').value;
    var dataHora = dataHoraManual || document.getElementById('modalDataHora').textContent;
    var tipoPonto = document.getElementById('punch-in-select').value;
    var observacao = document.getElementById('observacao').value;
    var justificativa = document.getElementById('justificativa').value;
    var arquivo = document.getElementById('arquivo').files[0];

    // Obter a localização do usuário
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;

            // Salvar o registro e exibir o banner de sucesso
            salvarRegistro(dataHora, tipoPonto, latitude, longitude, observacao, justificativa, arquivo);
            exibirNotificacao(`Ponto de ${tipoPonto} registrado com sucesso às ${dataHora}.`);
        }, function(error) {
            console.error('Erro ao obter localização:', error);
        });
    } else {
        console.error('Geolocalização não é suportada pelo navegador.');
    }

    // Fechar o modal após salvar o ponto
    document.getElementById('modal').style.display = 'none';
});

// Função para salvar um registro de ponto no localStorage
function salvarRegistro(dataHora, tipoPonto, latitude, longitude, observacao = '', justificativa = '', arquivo = null) {
    let registros = JSON.parse(localStorage.getItem('registros')) || [];
    
    // Adicionar o novo registro ao array de registros
    registros.push({
        dataHora,
        tipoPonto,
        latitude,
        longitude,
        observacao,
        justificativa,
        arquivo,
        isEdited: false // Marcação para diferenciar registros editados
    });
    
    // Salvar de volta no localStorage
    localStorage.setItem('registros', JSON.stringify(registros));
}

// Função para carregar os registros no relatório
function carregarRegistros() {
    let registros = JSON.parse(localStorage.getItem('registros')) || [];
    // Aqui você pode renderizar os registros em uma tabela ou lista
}

// Função para registrar ponto com possibilidade de registro no passado
function registrarPonto(dataHoraManual = null) {
    let dataHora = dataHoraManual || document.getElementById('modalDataHora').textContent;
    let tipoPonto = document.getElementById('punch-in-select').value;
    let observacao = document.getElementById('observacao').value;
    let justificativa = document.getElementById('justificativa').value;
    let arquivo = document.getElementById('arquivo').files[0];

    // Obter a localização do usuário
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;
            salvarRegistro(dataHora, tipoPonto, latitude, longitude, observacao, justificativa, arquivo);
            exibirNotificacao(`Ponto de ${tipoPonto} registrado com sucesso às ${dataHora}.`);
        }, function(error) {
            console.error('Erro ao obter localização:', error);
        });
    } else {
        console.error('Geolocalização não é suportada pelo navegador.');
    }
}

// Função para edição de um registro
function editarRegistro(indice) {
    let registros = JSON.parse(localStorage.getItem('registros'));
    let registro = registros[indice];

    // Permitir que o usuário altere o tipo de ponto, data e observações
    let novoTipoPonto = prompt("Editar tipo de ponto (entrada, saída, intervalo, voltaIntervalo):", registro.tipoPonto);
    let novaObservacao = prompt("Editar observação:", registro.observacao);
    
    registros[indice].tipoPonto = novoTipoPonto;
    registros[indice].observacao = novaObservacao;
    registros[indice].isEdited = true; // Marcar como editado

    localStorage.setItem('registros', JSON.stringify(registros));
    carregarRegistros();
}

// Função para excluir um registro
function excluirRegistro() {
    alert('O ponto não pode ser excluído.');
}

// Filtros para o relatório (última semana e último mês)
function filtrarRegistros(periodo) {
    let registros = JSON.parse(localStorage.getItem('registros')) || [];
    let hoje = new Date();

    if (periodo === 'semana') {
        let seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);
        registros = registros.filter(reg => new Date(reg.dataHora) >= seteDiasAtras);
    } else if (periodo === 'mes') {
        let umMesAtras = new Date();
        umMesAtras.setMonth(hoje.getMonth() - 1);
        registros = registros.filter(reg => new Date(reg.dataHora) >= umMesAtras);
    }

    // Renderizar os registros filtrados
}

// Funções para abrir e fechar o modal
document.getElementById('baterPonto').addEventListener('click', function() {
    atualizarModalDataHora(); // Atualiza o modal com a data e hora atuais
    document.getElementById('modal').style.display = 'block';
});

document.getElementById('close').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

// Fechar o modal ao pressionar a tecla 'Escape'
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.getElementById('modal').style.display = 'none';
    }
});

// Atualização de data e hora a cada segundo
setInterval(atualizarDataHora, 1000);
setInterval(atualizarModalDataHora, 1000);

// Atualiza a hora imediatamente quando o fuso horário é alterado
document.getElementById('fusoHorario').addEventListener('change', atualizarDataHora);
