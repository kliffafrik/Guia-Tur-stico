(() => {
    const locais = {
        // --- Ceilândia ---
        'bibliotheca_publica_carlos_drummond_de_andrade.html': 'Biblioteca Pública Carlos Drummond de Andrade',
        'casa_do_cantador.html': 'Casa do Cantador',
        'feira_central_da_ceilandia.html': 'Feira Central da Ceilândia',
        'parque_setor_o.html': 'Parque Setor O',
        'casa_akotirene.html': 'Casa Akotirene',
        'espaco_jovem_de_expressao.html': 'Espaço Jovem de Expressão',
        'praca_do_hip_hop.html': 'Praça do Hip Hop',
        'teatro_newton_rossi.html': 'Teatro Newton Rossi',

        // --- Brasília ---
        'catedral.html': 'Catedral de Brasília',
        'esplanada_dos_ministerios.html': 'Esplanada dos Ministérios',
        'rodoviaria_do_plano_piloto.html': 'Rodoviária do Plano Piloto',
        'memorial_jk.html': 'Memorial JK',
        'memorial_dos_povos_indigenas.html': 'Memorial dos Povos Indígenas',
        'espaco_cultural_renato_russo.html': 'Espaço Cultural Renato Russo',
        'ccbb_brasilia.html': 'Centro Cultural Banco do Brasil (CCBB Brasília)',
        'clube_do_choro_de_brasilia.html': 'Clube do Choro de Brasília',

        // --- Taguatinga ---
        'praca_do_relogio.html': 'Praça do Relógio',
        'mercado_sul.html': 'Mercado Sul (Mercadão Sul)',
        'taguaparque.html': 'Taguaparque',
        'parque_ecologico_do_cortado.html': 'Parque Ecológico do Cortado'
    };

    async function iniciar() {
        const lista = document.getElementById('lista-favoritos');
        const botoes = Array.from(document.querySelectorAll('[data-favorito]'));
        const auth = await window.authNavigationReady;
        if (!auth.user) {
            botoes.forEach(botao => {
                botao.textContent = 'Entre para favoritar';
                botao.setAttribute('aria-pressed', 'false');
            });
            if (lista) lista.textContent = 'Entre na sua conta para ver seus locais favoritos.';
            botoes.forEach(botao => botao.addEventListener('click', () => {
                window.location.href = 'index.html?login=1';
            }));
            return;
        }

        const supabase = await window.supabaseReady;
        const userId = auth.user.id;
        const { data, error } = await supabase
            .from('favorites')
            .select('destination_slug')
            .eq('user_id', userId);
        if (error) throw error;

        const itens = new Set((data || []).map(item => item.destination_slug));
        const atualizarBotao = botao => {
            const ativo = itens.has(botao.dataset.favorito);
            botao.textContent = ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
            botao.setAttribute('aria-pressed', String(ativo));
        };

        async function definirFavorito(slug, ativo) {
            const resultado = ativo
                ? await supabase.from('favorites').insert({ user_id: userId, destination_slug: slug })
                : await supabase.from('favorites').delete().eq('user_id', userId).eq('destination_slug', slug);
            if (resultado.error) throw resultado.error;
            if (ativo) itens.add(slug);
            else itens.delete(slug);
        }

        async function renderizarLista() {
            if (!lista) return;
            lista.replaceChildren();
            const validos = Array.from(itens).filter(item => locais[item]);
            if (!validos.length) {
                lista.textContent = 'Você ainda não adicionou locais aos favoritos.';
                return;
            }

            const ul = document.createElement('ul');
            validos.forEach(item => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = item;
                link.textContent = locais[item];

                const remover = document.createElement('button');
                remover.type = 'button';
                remover.textContent = 'Remover';
                remover.addEventListener('click', async () => {
                    remover.disabled = true;
                    try {
                        await definirFavorito(item, false);
                        li.remove();
                        if (!ul.children.length) lista.textContent = 'Você ainda não adicionou locais aos favoritos.';
                        botoes.forEach(atualizarBotao);
                    } catch (removeError) {
                        alert('Não foi possível remover este favorito. Tente novamente.');
                        remover.disabled = false;
                    }
                });

                li.append(link, document.createTextNode(' '), remover);
                ul.appendChild(li);
            });
            lista.appendChild(ul);
        }

        botoes.forEach(botao => {
            atualizarBotao(botao);
            botao.addEventListener('click', async () => {
                const slug = botao.dataset.favorito;
                botao.disabled = true;
                try {
                    await definirFavorito(slug, !itens.has(slug));
                    botoes.forEach(atualizarBotao);
                    await renderizarLista();
                } catch (favoriteError) {
                    alert('Não foi possível atualizar seus favoritos. Tente novamente.');
                } finally {
                    botao.disabled = false;
                }
            });
        });

        await renderizarLista();
    }

    iniciar().catch(error => {
        console.error('Falha ao carregar favoritos:', error);
        const lista = document.getElementById('lista-favoritos');
        if (lista) lista.textContent = 'Não foi possível carregar os favoritos. Tente novamente mais tarde.';
    });
})();