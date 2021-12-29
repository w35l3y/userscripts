// ==UserScript==
// @namespace      br.com.wesley
// @name           SmartThings : Lista dispositivos ZigBee
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2021+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0
// @grant          GM_xmlHttpRequest
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_deleteValue
// @grant          GM_setClipboard
// @grant          GM_openInTab
// @grant          GM.xmlHttpRequest
// @grant          GM.setValue
// @grant          GM.getValue
// @grant          GM.deleteValue
// @grant          GM.setClipboard
// @grant          GM.openInTab
// @include        https://*.api.smartthings.com/device/list
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

function complete (data) {
  if (data.length) {
    GM.setClipboard(data.map(({
      manufacturer = "",
      model = "",
      //label = "",
      //rawDescription = "",
      //deviceData: { manufacturer = "", model = "", zigbeeNodeType = "" },
      //children = 0,
      type
    }) => [/*rawDescription, */manufacturer, model/*, zigbeeNodeType, children*/, type/*, label*/].join("\t")).join("\n"))
    if (confirm("Dispositivos únicos localizados: " + data.length + "\n\nEles foram copiados para a sua área de transferência.\n\nA sugestão é que compartilhe o resultado colando na aba que será aberta.")) {
    	GM.openInTab("https://docs.google.com/spreadsheets/d/1OHk3qQNE0ruGLozLUTpCsnioikH2yYOKV8WI5k3tWHY/edit?usp=sharing")
    }
  } else {
    alert("Nenhum dispositivo ZigBee encontrado")
  }
}

function execute (cb = complete) {
  Promise.all(Array.from(document.querySelectorAll("tr[data-device-id] td:nth-child(5):not(:empty)"))
                                  .map(({ parentNode : { firstElementChild }}) => firstElementChild.querySelector("a"))
                                  .map(url => new Promise((resolve, reject) => GM.xmlHttpRequest({
    method: "GET",
    url: url.href,
    onerror: ({ responseText }) => reject(responseText),
    onload: ({ responseText }) => {
      let doc = document.implementation.createHTMLDocument("")
      doc.documentElement.innerHTML = responseText

      const {manufacturer, model} = Array.from(doc.querySelectorAll("li[aria-labelledby='deviceData-label']")).reduce((acc, node) => ({
          ...acc,
          [node.querySelector("span").textContent.trim()]: node.querySelector("strong").textContent.trim()
        }), {})

      resolve({
        manufacturer,
        model,
        //label: doc.querySelector("td[aria-labelledby='label-label']").textContent.trim(),
        //rawDescription: doc.querySelector("td[aria-labelledby='rawDescription-label']").textContent.trim(),
				//deviceData: { manufacturer, model },
        //children: doc.querySelectorAll("td[aria-labelledby='children-label'] li").length,
        type: doc.querySelector("td[aria-labelledby='type-label']").textContent.trim(),
      })
    }
  }))))
  .then(devices => {
    const filteredDevices = devices.filter((value, index, arr) => index === arr.findIndex(({ manufacturer, model, type }) => value.manufacturer === manufacturer && value.model === model && value.type === type))
    filteredDevices.sort((a,b) => -(a.manufacturer < b.manufacturer) || +(a.manufacturer !== b.manufacturer) || -(a.model < b.model) || +(a.model !== b.model))

    GM.setValue("devices", JSON.stringify(filteredDevices))
    cb(filteredDevices)
  }, err => {
    alert("Falha ao requisitar página\n" + err)
  })
}

function request () {
  if (confirm("Listar dispositivos ZigBee?")) {
    execute()
  }
}

document.addEventListener("keyup", function (event) {
  if (event.ctrlKey && event.altKey && event.keyCode === "R".charCodeAt(0)) {
		request()
  }
}, false)

GM.getValue("devices", "[]")
  .then(v => JSON.parse(v))
  .then(data => {
  if (!data.length) {
    request(complete)
  }
})
