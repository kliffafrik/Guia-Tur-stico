(() => {
    const locais = {
        'bibliotheca_publica_carlos_drummond_de_andrade.html': 'Biblioteca Pública Carlos Drummond de Andrade',
        'casa_do_cantador.html': 'Casa do Cantador',
        'catedral.html': 'Catedral de Brasília',
        'esplanada_dos_ministerios.html': 'Esplanada dos Ministérios',
        'feira_central_da_ceilandia.html': 'Feira Central da Ceilândia',
        'parque_setor_o.html': 'Parque Setor O',
        'praca_do_relogio.html': 'Praça do Relógio',
        'rodoviaria_do_plano_piloto.html': 'Rodoviária do Plano Piloto'
    };

    function usuarioAtual() {
        return sessionStorage.getItem('usuarioLogado');
    }

    function carregarFavoritos(usuario) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos') || '{}');
        return Array.isArray(favoritos[usuario]) ? favoritos[usuario] : [];
    }

    function salvarFavoritos(usuario, itens) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos') || '{}');
        favoritos[usuario] = itens;
        localStorage.setItem('favoritos', JSON.stringify(favoritos));
    }

    function atualizarBotao(botao) {
        const usuario = usuarioAtual();
        if (!usuario) {
            botao.textContent = 'Entre para favoritar';
            botao.setAttribute('aria-pressed', 'false');
            return;
        }

        const ativo = carregarFavoritos(usuario).includes(botao.dataset.favorito);
        botao.textContent = ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        botao.setAttribute('aria-pressed', String(ativo));
    }

    document.querySelectorAll('[data-favorito]').forEach(botao => {
        atualizarBotao(botao);
        botao.addEventListener('click', () => {
            const usuario = usuarioAtual();
            if (!usuario) {
                window.location.href = 'index.html?login=1';
                return;
            }

            const local = botao.dataset.favorito;
            const favoritos = carregarFavoritos(usuario);
            salvarFavoritos(usuario, favoritos.includes(local)
                ? favoritos.filter(item => item !== local)
                : [...favoritos, local]);
            atualizarBotao(botao);
        });
    });

    const lista = document.getElementById('lista-favoritos');
    if (!lista) return;

    const usuario = usuarioAtual();
    if (!usuario) {
        lista.textContent = 'Entre na sua conta para ver seus locais favoritos.';
        return;
    }

    const itens = carregarFavoritos(usuario).filter(item => locais[item]);
    if (itens.length === 0) {
        lista.textContent = 'Você ainda não adicionou locais aos favoritos.';
        return;
    }

    const ul = document.createElement('ul');
    itens.forEach(item => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = item;
        link.textContent = locais[item];

        const remover = document.createElement('button');
        remover.type = 'button';
        remover.textContent = 'Remover';
        remover.addEventListener('click', () => {
            salvarFavoritos(usuario, carregarFavoritos(usuario).filter(favorito => favorito !== item));
            li.remove();
            if (!ul.children.length) lista.textContent = 'Você ainda não adicionou locais aos favoritos.';
        });

        li.append(link, document.createTextNode(' '), remover);
        ul.appendChild(li);
    });
    lista.appendChild(ul);
})();
