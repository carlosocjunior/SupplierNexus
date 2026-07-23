// ==========================================
// SupplierNexus - shared.js
// Funções comuns usadas pelo hub do SupplierNexus e por todos os módulos
// (Fornecedores, Avaliação, e os que vierem depois). Mesmo padrão do
// shared.js do FlowSuite — corrigir um bug aqui corrige em todos os
// módulos ao mesmo tempo.
//
// Hospedado no repositório do SupplierNexus; os módulos carregam via URL absoluta:
// <script src="https://carlosocjunior.github.io/SupplierNexus/shared.js"></script>
//
// IMPORTANTE: esse arquivo precisa ser carregado ANTES do script
// principal de cada página.
// ==========================================

// ==========================================
// PROTEÇÃO CONTRA XSS
// ==========================================
function escapeHtml(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// LEITURA DE PARÂMETROS DA URL (token e empresa "ver como", vindos do
// hub do SupplierNexus quando abre um módulo a partir de um card)
// ==========================================
function getTokenDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('sn_token');
}

function getEmpresaVisualizandoDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('sn_empresa') || 'todas';
}

// ==========================================
// PERMISSÃO — cada módulo declara sua própria variável
// `permissaoUsuario` (definida depois de validar o token no hub).
// ==========================================
function podeEditar(nivelExplicito) {
    const nivel = nivelExplicito !== undefined
        ? nivelExplicito
        : (typeof permissaoUsuario !== 'undefined' ? permissaoUsuario : null);
    return nivel === 'admin' || nivel === 'editor' || nivel === 'dev' || nivel === 'master' || nivel === 'supervisor';
}

function podeExcluir(nivelExplicito) {
    const nivel = nivelExplicito !== undefined
        ? nivelExplicito
        : (typeof permissaoUsuario !== 'undefined' ? permissaoUsuario : null);
    return nivel === 'admin' || nivel === 'dev' || nivel === 'master';
}

function podeVerDashboard(nivelExplicito) {
    const nivel = nivelExplicito !== undefined
        ? nivelExplicito
        : (typeof permissaoUsuario !== 'undefined' ? permissaoUsuario : null);
    return nivel === 'supervisor' || nivel === 'admin' || nivel === 'dev' || nivel === 'master';
}

// ==========================================
// TRADUÇÃO — o mecanismo é compartilhado, mas cada ferramenta continua
// com seu próprio dicionário `I18N` e sua própria variável `idiomaAtual`.
// ==========================================
function t(chave) {
    if (typeof I18N === 'undefined' || typeof idiomaAtual === 'undefined') return chave;
    return (I18N[idiomaAtual] && I18N[idiomaAtual][chave]) || (I18N.pt && I18N.pt[chave]) || chave;
}

function tf(chave, params) {
    let texto = t(chave);
    if (params) {
        Object.keys(params).forEach(p => {
            texto = texto.split(`{${p}}`).join(params[p]);
        });
    }
    return texto;
}

function aplicarIdioma() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('.seletor-idioma-btn').forEach(btn => {
        if (typeof idiomaAtual !== 'undefined') {
            btn.classList.toggle('ativo', btn.dataset.lang === idiomaAtual);
        }
    });
}

// ==========================================
// CACHE LOCAL POR EMPRESA
// ==========================================
function chaveCache(nomeBase) {
    const empresa = (typeof usuarioMgf !== 'undefined' && usuarioMgf && usuarioMgf.empresaVisualizando)
        || 'default';
    return `${nomeBase}_${empresa}`;
}

// ==========================================
// REVALIDAÇÃO PERIÓDICA DE SESSÃO — cada módulo define sua própria
// `validarAcessoMgf()` e `bloquearAcesso()`.
// ==========================================
function iniciarRevalidacaoPeriodicaSessao(intervaloMs) {
    const intervalo = intervaloMs || 15000;
    setInterval(async () => {
        if (typeof validarAcessoMgf !== 'function') return;
        const aindaValido = await validarAcessoMgf();
        if (!aindaValido && typeof bloquearAcesso === 'function') {
            bloquearAcesso();
        }
    }, intervalo);
}

// ==========================================
// CARREGAMENTO SOB DEMANDA DE BIBLIOTECAS PESADAS
// ==========================================
const _scriptsCarregados = {};

function carregarScript(url) {
    if (_scriptsCarregados[url]) return _scriptsCarregados[url];
    _scriptsCarregados[url] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return _scriptsCarregados[url];
}

async function garantirChartJS() {
    if (typeof Chart === 'undefined') {
        await carregarScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
    }
}

// Observação: o widget de chatbot de dúvidas (igual ao do FlowSuite) foi
// deixado de fora por enquanto — o mgf-plus-api ainda não tem a ação
// 'chatDuvida'. Dá pra portar depois seguindo o mesmo padrão.
