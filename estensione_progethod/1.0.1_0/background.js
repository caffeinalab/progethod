chrome.action.onClicked.addListener(async () => {
  let biscottino = await chrome.cookies.get({ name: "SF6SESSID", url: "https://wethod.com" })

  if(biscottino) {
    const response = await fetch('https://progethod.caffeina.io/api/me', {
      'headers': {
        'accept': 'application/json',
        'x-sf-sess-id': biscottino.value
      },
      'method': 'GET'
    });

    if(response.status !== 200) {
      biscottino = null
    }
  }

  if(!biscottino) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/images/icon-128.png',
      title: 'Non trovo la sessione',
      message: 'Fai il login su Wethod e riprova.',
      priority: 1
    });
    chrome.tabs.create({'url': `https://caffeina.wethod.com`}, function(tab) {});
    return
  }

  // Hand the token over via a short-lived first-party cookie set before the
  // tab opens, so it never leaks into the URL (address bar, tab hover, history).
  // The login page reads and deletes it; the 60s expiry covers abandoned tabs.
  chrome.cookies.set({
    url: 'https://progethod.caffeina.io',
    name: 'progethod_login_token',
    value: biscottino.value,
    secure: true,
    sameSite: 'strict',
    expirationDate: Math.floor(Date.now() / 1000) + 60,
  }, (cookie) => {
    if (chrome.runtime.lastError || !cookie) {
      // Fall back to the legacy URL handoff; the login page strips it immediately
      chrome.tabs.create({'url': `https://progethod.caffeina.io/login?token=${biscottino.value}`}, function(tab) {});
      return
    }
    chrome.tabs.create({'url': 'https://progethod.caffeina.io/login'}, function(tab) {});
  });
});