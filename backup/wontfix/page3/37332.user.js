// ==UserScript==
// @name           SnowTigers : Registration Alerter
// @namespace      https://gm.wesley.eti.br/snowtigers
// @description    Opens the Account Signup page when registration is open
// @include        *
// @grant          GM_log
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @icon           https://gm.wesley.eti.br/icon.php?desc=37332
// ==/UserScript==

(function recursive() {
  // script scope

  var user = {
    interval: 15 * 60 * 1000, // every 15 minutes
  };

  var script = {
    lastCheck: parseInt(GM_getValue("lastCheck", "0"), 10),
    currentDate: parseInt(new Date().valueOf(), 10),
  };

  if (script.lastCheck + user.interval < script.currentDate) {
    GM_log("Requesting https://www.snowtigers.net/account-signup.php ...");
    GM_setValue("lastCheck", "" + (script.lastCheck = script.currentDate));
    GM_xmlhttpRequest({
      url: "https://www.snowtigers.net/account-signup.php",
      method: "get",
      onload: function (e) {
        if (/^2/.test(e.status)) {
          if (!/Le nombre maximum de membres est atteint/i.test(e.responseText))
            GM_openInTab(e.finalUrl);
        } else GM_log("An error has occurred while requesting " + e.finalUrl);
      },
      onerror: function (e) {
        GM_log("An error has occurred while requesting " + e.finalUrl);
      },
    });
  }

  setTimeout(
    recursive,
    script.lastCheck + user.interval - script.currentDate + 1000 * Math.random()
  );
})();
