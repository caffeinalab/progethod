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

  chrome.tabs.create({'url': `https://progethod.caffeina.io/login?token=${biscottino.value}`}, function(tab) {});
});