// ==UserScript==
// @namespace      br.com.wesley
// @name           SmartThings : Zigbee Route Devices
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2020+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0
// @grant          GM_xmlHttpRequest
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM.xmlHttpRequest
// @grant          GM.setValue
// @grant          GM.getValue
// @include        https://*.api.smartthings.com/device/list
// @require        https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

function draw (data) {
  let mesh = document.getElementById("meshRoute")
  if (mesh) {
    mesh.replaceChild(chart(data), mesh.firstElementChild)
  } else {
    let route = document.createElement("div")
    route.setAttribute("id", "meshRoute")
    route.setAttribute("style", "width: 400px")
    route.appendChild(chart(data))
    document.getElementById("list-device").parentNode.appendChild(route)
  }
}

function execute (cb = draw) {
  Promise.all(Array.from(document.querySelectorAll("tr[data-device-id] td:nth-child(5)"))
                                  .filter(n => n.textContent)
                                  .map(({ parentNode : { firstElementChild }}) => firstElementChild.querySelector("a"))
                                  .map(url => new Promise((resolve, reject) => GM.xmlHttpRequest({
    method: "GET",
    url: url.href,
    onerror: ({ responseText }) => reject(responseText),
    onload: ({ responseText }) => {
      console.log("Done", url.href, url.textContent)
      let doc = document.implementation.createHTMLDocument("")
      doc.documentElement.innerHTML = responseText
      let route = Array.from(doc.querySelectorAll("td[aria-labelledby='meshRoute-label'] a"))
      let grp = doc.querySelector("td[aria-labelledby='group-label'] a")
      let id = url.parentNode.parentNode.getAttribute("data-device-id")
      let group = grp?{
        id: /\/([\w-]+)$/.test(grp.href) && RegExp.$1,
        name: grp.textContent.trim()
      }:{}
      let routes = route[0].parentNode.textContent.replace(/\s{2,}/g, "").trim().split("↔").map((value, i, a) => ({
        final: !i || i === a.length - 1,
        group,
        ...(/(\w+)\/show\/([\w-]+)/.test((route.find(({ textContent }) => ~textContent.indexOf(value))||{}).href)?{
          id: RegExp.$2,
          type: RegExp.$1
        }:{
          id: id + " ↔ " + value,
          type: "device",
          final: true
        }),
        value: i?value:url.textContent
      }))
      let links = routes.map((v, i, a) => ({
        source: v.id || id + " ↔ " + v.value,
        target: 1+i === a.length?null:a[1 + i].id
      })).filter(({target}) => target)
      Array.from(doc.querySelectorAll("td[aria-labelledby='children-label'] a")).forEach(child => {
        let childId = /\/([\w-]+)$/.test(child.href) && RegExp.$1
        routes.push({
          final: true,
          group,
          id: childId,
          type: "device",
          value: child.textContent.trim()
        })
        links.push({
          source: childId,
          target: id
        })
      })
      resolve({
        id,
        name: url.textContent,
        group,
        routes,
        links
      })
    }
  }))))
  .then(devices => {
    let output = {
      groups: devices.map(({ group }) => group.id).filter((v, i, a) => v && i === a.findIndex(x => x === v)),
      nodes: devices.map(({ routes }) => routes).flat().filter(({id, final}, i, a) => i === a.findIndex(x => x.id === id/* && final*/)),
      links: devices.map(({ links }) => links).flat()
    }
    GM.setValue("route", JSON.stringify(output))
    cb(output)
  }, err => {
    alert("Falha ao requisitar página\n" + err)
  })
}

function request () {
  if (confirm("Calculate route?")) {
    execute()
  }
}

document.addEventListener("keyup", function (event) {
  console.log(event.keyCode)
  if (event.ctrlKey && event.altKey && event.keyCode === "R".charCodeAt(0)) {
		request()
  }
}, false)

color = domain => d => {
  const scale = d3.scaleOrdinal(d3.schemeCategory10).domain(domain);
  return scale(d.group.id);
}
width = 300
height = 300
drag = simulation => {
  
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}
chart = data => {
  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(1/*d.value*/));

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 5)
      .attr("fill", color(data.groups || []))
      .call(drag(simulation));

  node.append("title")
      .text(d => d.value);

  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });

  //invalidation.then(() => simulation.stop());

  return svg.node();
}

GM.getValue("route", "{}")
  .then(v => JSON.parse(v))
  .then(data => {
  if (data.nodes) {
    draw(data)
  } else {
    request(draw)
  }
})
