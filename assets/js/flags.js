// assets/js/flags.js
// Country name -> flag image. Copied from the achievement dashboard (cabinet.js) so both pages agree.
// Exposes window.getFlagUrl(country) -> image URL or null.
(() => {
  const countryFlags = {
    'argentina': 'ar', 'ar': 'ar', 'australia': 'au', 'au': 'au',
    'austria': 'at', 'at': 'at', 'belgium': 'be', 'be': 'be',
    'brazil': 'br', 'br': 'br', 'bulgaria': 'bg', 'bg': 'bg',
    'canada': 'ca', 'ca': 'ca', 'china': 'cn', 'cn': 'cn',
    'croatia': 'hr', 'hr': 'hr', 'czech republic': 'cz', 'czech_republic': 'cz', 'cz': 'cz',
    'denmark': 'dk', 'dk': 'dk', 'ecuador': 'ec', 'ec': 'ec',
    'finland': 'fi', 'fi': 'fi', 'france': 'fr', 'fr': 'fr',
    'germany': 'de', 'de': 'de', 'greece': 'gr', 'gr': 'gr',
    'hungary': 'hu', 'hu': 'hu', 'india': 'in', 'in': 'in',
    'iraq': 'iq', 'iq': 'iq', 'ireland': 'ie', 'ie': 'ie',
    'israel': 'il', 'il': 'il', 'italy': 'it', 'it': 'it',
    'japan': 'jp', 'jp': 'jp', 'mexico': 'mx', 'mx': 'mx',
    'moldova': 'md', 'md': 'md', 'new zealand': 'nz', 'new_zealand': 'nz', 'nz': 'nz',
    'norway': 'no', 'no': 'no', 'poland': 'pl', 'pl': 'pl',
    'portugal': 'pt', 'pt': 'pt', 'romania': 'ro', 'ro': 'ro',
    'russia': 'ru', 'ru': 'ru', 'saudi arabia': 'sa', 'saudi_arabia': 'sa', 'sa': 'sa',
    'serbia': 'rs', 'rs': 'rs', 'south korea': 'kr', 'south_korea': 'kr', 'korea': 'kr', 'kr': 'kr',
    'spain': 'es', 'es': 'es', 'sweden': 'se', 'se': 'se',
    'switzerland': 'ch', 'ch': 'ch', 'syria': 'sy', 'sy': 'sy',
    'taiwan': 'tw', 'tw': 'tw', 'the netherlands': 'nl', 'netherlands': 'nl', 'the_netherlands': 'nl', 'nl': 'nl',
    'turkey': 'tr', 'tr': 'tr', 'uk': 'gb', 'united kingdom': 'gb', 'united_kingdom': 'gb', 'gb': 'gb',
    'ukraine': 'ua', 'ua': 'ua', 'usa': 'us', 'us': 'us', 'united states': 'us', 'united_states': 'us',
    'chile': 'cl', 'cl': 'cl', 'bosnia and herzegovina': 'ba', 'bosnia': 'ba', 'ba': 'ba',
    'slovakia': 'sk', 'sk': 'sk', 'slovenia': 'si', 'si': 'si', 'lithuania': 'lt', 'lt': 'lt'
  };

  function getFlagUrl(c) {
    if (!c) return null;
    const clean = c.toLowerCase().trim().replace(/_/g, ' ');
    if (clean === 'youtubers') return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png';
    if (clean === 'staff') return 'https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs2/317699597/original/fb21937c8742ee5d3de5c9e02b4d340d80a39513/setup-minecraft-server-that-you-pay.jpg';
    if (countryFlags[clean]) return `https://flagcdn.com/w640/${countryFlags[clean]}.png`;
    return null;
  }

  window.getFlagUrl = getFlagUrl;
})();