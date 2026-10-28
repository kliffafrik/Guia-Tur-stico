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
        let linksInNav = Array.from(nav.querySelectorAll('a'));
        let destino = new URL(href, window.location.href).pathname.toLowerCase();
        let matchingLinks = linksInNav.filter(anchor =>
            anchor.id === id ||
            anchor.textContent.trim() === label ||
            (anchor.getAttribute('href') &&
                new URL(anchor.getAttribute('href'), window.location.href).pathname.toLowerCase() === destino)
        );
        let link = matchingLinks.shift();
        if (!link) {
            link = document.createElement('a');
            link.textContent = label;
            link.href = href;
        }
        matchingLinks.forEach(duplicate => duplicate.remove());
        link.id = id;
        if (link.parentElement !== nav) nav.appendChild(link);
    });

    let links = [
        { id: 'nav-perfil', label: 'Perfil', href: 'perfil.html', commonOnly: true },
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
        link.classList.toggle('hidden', commonOnly ? !usuarioLogado || usuarioLogado.tipo !== 'comum'
            : adminOnly ? !usuarioLogado || usuarioLogado.tipo !== 'admin1'
            : loggedOutOnly ? !!usuarioLogado
            : loggedInOnly ? !usuarioLogado
            : false);

        if (id === 'nav-perfil') link.href = href;
        link.classList.toggle('active', id === 'nav-perfil' && /perfil\.html$/i.test(window.location.pathname));
        if (loggedInOnly) {
            link.href = href;
            link.removeAttribute('onclick');
            link.addEventListener('click', event => {
                event.preventDefault();
                sessionStorage.removeItem('usuarioLogado');
                window.location.assign(href);
            });
        }
        if (isHomePage) return;

        link.href = href;
    });
})();
