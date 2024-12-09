/**
 * Get a cookie by name
 *
 * @param name
 * @returns {string}
 */
export function cookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

/**
 * Get the authentication hash, whether from the URL hash or from the GenePatternAccess cookie.
 * The cookie is accessible only from the genepattern.org domain, the hash must be used elsewhere (e.g. notebook)
 *
 * @returns {string}
 */
export function auth_token() {
    return window.location.hash && window.location.hash.length > 0 ? window.location.hash.slice(1) : cookie('GenePatternAccess');
}

/**
 * Get the value of the specified task parameter, passed in as input to this visualizer
 *
 * @returns {string}
 */
export function param(name) {
    const params = new URLSearchParams(new URL(window.location).search);
    return params.get(name);
}