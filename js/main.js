/* Landing QUADRA: tema, banco di esempio, modulo demo. */

/* URL dell'app web Apps Script (finisce con /exec). Vedi apps-script/Code.gs. */
const ENDPOINT_FOGLIO = 'https://script.google.com/macros/s/AKfycby9MQmyxY0ucEz8FpoPK6o_TNuTnvrfmqcZACoBYixYV7bMiC07ZCm9L0xPBW-YGYww/exec';
const CONTATTO = 'info@esconsulting.it';

/* Tema: senza preferenza salvata segue il sistema */
const radice = document.documentElement;
document.getElementById('theme-btn').addEventListener('click', () => {
    const attuale = radice.getAttribute('data-theme')
        || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const prossimo = attuale === 'light' ? 'dark' : 'light';
    radice.setAttribute('data-theme', prossimo);
    try { localStorage.setItem('esc-theme', prossimo); } catch (e) { /* storage non disponibile */ }
});

/* Banco di esempio: la selezione di un cliente cambia le estrazioni mostrate */
const entityButtons = document.querySelectorAll('.entity');
const entityBodies = document.querySelectorAll('.bench tbody');
entityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        entityButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        entityBodies.forEach((t) => { t.hidden = t.dataset.entity !== btn.dataset.entity; });
    });
});

/* Modulo demo: valida e registra la richiesta sul Google Foglio */
const form = document.getElementById('demoForm');
const feedback = document.getElementById('formFeedback');
const invia = document.getElementById('submitBtn');
const etichettaInvio = invia.textContent;

function messaggioErrore(campo) {
    if (campo.validity.valueMissing) {
        return campo.type === 'checkbox'
            ? 'Serve il consenso per poterti ricontattare.'
            : 'Campo obbligatorio.';
    }
    if (campo.validity.typeMismatch) return 'Controlla l\'indirizzo email.';
    return '';
}

function controllaCampo(campo) {
    const testo = messaggioErrore(campo);
    const box = document.getElementById(campo.id + '-err');
    if (box) box.textContent = testo;
    if (testo) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
    return !testo;
}

const obbligatori = Array.from(form.querySelectorAll('[required]'));
obbligatori.forEach((campo) => {
    campo.addEventListener(campo.type === 'checkbox' ? 'change' : 'blur', () => controllaCampo(campo));
});

function mostraEsito(testo, errore) {
    feedback.textContent = testo;
    feedback.classList.toggle('is-error', errore);
}

/* urlencoded e' una richiesta "semplice": niente preflight, che Apps Script non gestisce */
function corpoRichiesta() {
    return new URLSearchParams(new FormData(form));
}

async function registraRichiesta() {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), 20000);
    try {
        const risposta = await fetch(ENDPOINT_FOGLIO, {
            method: 'POST',
            body: corpoRichiesta(),
            signal: timeout.signal,
        });
        const esito = await risposta.json();
        if (!esito.ok) throw new Error(esito.error || 'invio_rifiutato');
    } finally {
        clearTimeout(timer);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostraEsito('', false);

    const nonValidi = obbligatori.filter((campo) => !controllaCampo(campo));
    if (nonValidi.length) {
        nonValidi[0].focus();
        return;
    }

    invia.disabled = true;
    invia.textContent = 'Invio in corso…';
    try {
        await registraRichiesta();
        form.reset();
        mostraEsito('Richiesta ricevuta. Ti ricontattiamo per fissare la demo.', false);
    } catch (err) {
        mostraEsito('Invio non riuscito: i dati sono ancora nel modulo. Riprova o scrivici a ' + CONTATTO + '.', true);
    } finally {
        invia.disabled = false;
        invia.textContent = etichettaInvio;
    }
});
