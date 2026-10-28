(() => {
    let nav = document.querySelector('nav');
    if (!nav) {
        let container = document.querySelector('.content') || document.body;
        nav = document.createElement('nav');
        container.insertBefore(nav, container.firstChild);
    }

    let isHomePage = /index\.html$/i.test(window.location.pathname);
    let mainLinks = [
        { id: 'nav-home', label: 'Home', href: 'index.html' },
        { id: 'nav-ondeir', label: 'Onde Ir', href: 'ondeir.html' },
        { id: 'nav-favoritos', label: 'Favoritos', href: 'favoritos.html' }
    ];
    mainLinks.forEach(({ id, label, href }) => {
        let link = document.getElementById(id) || Array.from(document.querySelectorAll('a'))
            .find(anchor => anchor.getAttribute('href') === href);
        if (!link) {
            link = document.createElement('a');
            link.textContent = label;
            link.href = href;
        }
        link.id = id;
        if (link.parentElement !== nav) nav.appendChild(link);
    });

    let links = [
        { id: 'nav-perfil', label: 'Perfil', href: 'index.html?perfil=1', commonOnly: true },
        { id: 'nav-painel-admin', label: 'Painel Admin', href: 'index.html?painel-admin=1', adminOnly: true },
        { id: 'nav-login', label: 'Login / Admin', href: 'index.html?login=1', loggedOutOnly: true },
        { id: 'nav-sair', label: 'Sair', href: 'index.html', loggedInOnly: true }
    ];

    links.forEach(({ id, label, href }) => {
        if (!document.getElementById(id)) {
            let link = document.createElement('a');
            link.id = id;
            link.textContent = label;
            link.href = href;
            nav.appendChild(link);
        }
    });

    let usuarioLogado = null;
    let usuarioSalvo = sessionStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        usuarioLogado = usuarios.find(usuario => usuario.user === usuarioSalvo) || null;
        if (!usuarioLogado) sessionStorage.removeItem('usuarioLogado');
    }

    links.forEach(({ id, href, commonOnly, adminOnly, loggedOutOnly, loggedInOnly }) => {
        let link = document.getElementById(id);
        if (isHomePage) return;

        link.href = href;
        link.classList.toggle('hidden', commonOnly ? !usuarioLogado || usuarioLogado.tipo !== 'comum'
            : adminOnly ? !usuarioLogado || usuarioLogado.tipo === 'comum'
            : loggedOutOnly ? !!usuarioLogado
            : loggedInOnly ? !usuarioLogado
            : false);

        if (loggedInOnly) {
            link.onclick = () => sessionStorage.removeItem('usuarioLogado');
        }
    });
})();
