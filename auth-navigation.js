(() => {
    const scriptUrl = document.currentScript.src;
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

    async function carregarClienteSupabase() {
        if (!window.supabaseReady) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = new URL('supabase-client.js', scriptUrl).href;
                script.onload = resolve;
                script.onerror = () => reject(new Error('Não foi possível carregar o cliente Supabase.'));
                document.head.appendChild(script);
            });
        }
        return window.supabaseReady;
    }

    window.appAuth = { user: null, profile: null, isAdmin: false };

    window.refreshAuthNavigation = async function() {
        const supabase = await carregarClienteSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        let profile = null;
        let isAdmin = false;
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, full_name, email, city, age, gender_identity, created_at')
                .eq('id', user.id)
                .maybeSingle();
            profile = data;

            const { data: adminResult } = await supabase.rpc('is_site_admin');
            isAdmin = adminResult === true;
        }

        window.appAuth = { user, profile, isAdmin };
        links.forEach(({ id, href, commonOnly, adminOnly, loggedOutOnly, loggedInOnly }) => {
            const link = document.getElementById(id);
            link.classList.toggle('hidden', commonOnly ? !user || isAdmin
                : adminOnly ? !user || !isAdmin
                : loggedOutOnly ? !!user
                : loggedInOnly ? !user
                : false);
            link.href = href;
            if (id === 'nav-perfil') {
                link.classList.toggle('active', /perfil\.html$/i.test(window.location.pathname));
            }
        });

        return window.appAuth;
    };

    const logoutLink = document.getElementById('nav-sair');
    logoutLink.addEventListener('click', async event => {
        event.preventDefault();
        const supabase = await carregarClienteSupabase();
        await supabase.auth.signOut();
        await window.refreshAuthNavigation();
        window.location.assign('index.html');
    });

    window.authNavigationReady = window.refreshAuthNavigation().catch(error => {
        console.error('Falha ao carregar autenticação:', error);
        links.forEach(({ id }) => document.getElementById(id).classList.add('hidden'));
        throw error;
    });

    window.authNavigationReady.then(async () => {
        const supabase = await carregarClienteSupabase();
        supabase.auth.onAuthStateChange(event => {
            if (event === 'PASSWORD_RECOVERY') {
                window.dispatchEvent(new Event('app-password-recovery'));
            }
            if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
                setTimeout(() => window.refreshAuthNavigation().catch(console.error), 0);
            }
        });
    }).catch(() => {});
})();
