// ==UserScript==
// @namespace      br.com.wesley
// @name           SmartThings : Zigbee Route Devices
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2020+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.1
// @grant          GM_xmlHttpRequest
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_deleteValue
// @grant          GM.xmlHttpRequest
// @grant          GM.setValue
// @grant          GM.getValue
// @grant          GM.deleteValue
// @include        https://*.api.smartthings.com/device/list
// @require        https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

//GM.deleteValue("route")

const graphFn = data => {
  const nodes = data.nodes.map(({ id, group, value }) => ({
    id,
    sourceLinks: [],
    targetLinks: [],
    group,
    value
  }));

  const nodeById = new Map(nodes.map(d => [d.id, d]));

  const links = data.links.map(({ source, target, value }) => ({
    source: nodeById.get(source),
    target: nodeById.get(target),
    value
  }));

  for (const link of links) {
    const { source, target } = link;
    source.sourceLinks.push(link);
    target.targetLinks.push(link);
  }

  return { nodes, links };
}
const step = 14
const margin = {top: 20, right: 20, bottom: 20, left: 300}
const width = 600
function arc (d) {
  const y1 = d.source.y;
  const y2 = d.target.y;
  const r = Math.abs(y2 - y1) / 2;
  return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${margin.left},${y2}`;
}
let currentOption = 0

function render (data) {
  const graph = graphFn(data)
	const color = d3.scaleOrdinal(graph.nodes.map(d => d.group.id).sort(d3.ascending), d3.schemeCategory10)
	height = (data.nodes.length - 1) * step + margin.top + margin.bottom

  //const svg = d3.select(DOM.svg(width, height));
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  svg.append("style").text(`

.hover path {
  stroke: #ccc;
}

.hover text {
  fill: #ccc;
}

.hover g.primary text {
  fill: black;
  font-weight: bold;
}

.hover g.secondary text {
  fill: #333;
}

.hover path.primary {
  stroke: #333;
  stroke-opacity: 1;
}

`);

  const y = d3.scalePoint(graph.nodes.map(d => d.id).sort(d3.ascending), [margin.top, height - margin.bottom])

  const label = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
      .attr("transform", d => `translate(${margin.left},${d.y = y(d.id)})`)
      .call(g => g.append("text")
          .attr("x", -6)
          .attr("dy", "0.35em")
          .attr("fill", d => d3.lab(color(d.group.id)).darker(2))
          .text(d => d.value + " ↔ " + d.group.name))
      .call(g => g.append("circle")
          .attr("r", 3)
          .attr("fill", d => color(d.group.id)));

  const path = svg.insert("g", "*")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(graph.links)
    .join("path")
      .attr("stroke", d => d.source.group.id === d.target.group.id ? color(d.source.group.id) : "#aaa")
      .attr("d", arc);

  const overlay = svg.append("g")
      .attr("fill", "none")
      .attr("pointer-events", "all")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
      .attr("width", margin.left + 40)
      .attr("height", step)
      .attr("y", d => y(d.id) - step / 2)
      .on("mouseover", d => {
        svg.classed("hover", true);
        label.classed("primary", n => n === d);
        label.classed("secondary", n => n.sourceLinks.some(l => l.target === d) || n.targetLinks.some(l => l.source === d));
        path.classed("primary", l => l.source === d || l.target === d).filter(".primary").raise();
      })
      .on("mouseout", d => {
        svg.classed("hover", false);
        label.classed("primary", false);
        label.classed("secondary", false);
        path.classed("primary", false).order();
      });

  const orderByName = (a, b) => d3.ascending(a.value, b.value)
  const orderByGroup = (a, b) => -(a.group.name < b.group.name) || +(a.group.name !== b.group.name)
  const orderByDegree = (a, b) => d3.sum(b.sourceLinks, l => l.value) + d3.sum(b.targetLinks, l => l.value) - d3.sum(a.sourceLinks, l => l.value) - d3.sum(a.targetLinks, l => l.value)
  const options = [
    { name: "Order by name", value: orderByName },
    { name: "Order by group", value: (a, b) => orderByGroup(a, b) || orderByName(a, b) },
    { name: "Order by degree", value: (a, b) => orderByDegree(a, b) || orderByName(a, b) }
  ]

  function update() {
    currentOption = (1+currentOption)%options.length

    y.domain(graph.nodes.sort(options[currentOption].value).map(d => d.id));

    const t = svg.transition()
        .duration(750);

    label.transition(t)
        .delay((d, i) => i * 20)
        .attrTween("transform", d => {
          const i = d3.interpolateNumber(d.y, y(d.id));
          return t => `translate(${margin.left},${d.y = i(t)})`;
        });

    path.transition(t)
        .duration(750 + graph.nodes.length * 20)
        .attrTween("d", d => () => arc(d));

    overlay.transition(t)
        .delay((d, i) => i * 20)
        .attr("y", d => y(d.id) - step / 2);
  }

	document.addEventListener("keyup", function (event) {
    if (event.ctrlKey && event.altKey && event.keyCode === "E".charCodeAt(0)) {
      update()
    }
  }, false)  
  //viewof order.addEventListener("input", update);
  //invalidation.then(() => viewof order.removeEventListener("input", update));

  return svg.node();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function draw (data) {
  let mesh = document.getElementById("meshRoute")
  if (mesh) {
    mesh.replaceChild(render(data), mesh.firstElementChild)
  } else {
    let route = document.createElement("div")
    route.setAttribute("id", "meshRoute")
    route.setAttribute("style", "width: 600px")
    route.appendChild(render(data))
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
        target: 1+i === a.length?null:a[1 + i].id,
        value: 1
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
          target: id,
          value: 1
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
  if (event.ctrlKey && event.altKey && event.keyCode === "R".charCodeAt(0)) {
		request()
  }
}, false)

GM.getValue("route", "{}")
  .then(v => JSON.parse(v))
  .then(data => {
  if (data.nodes) {
    draw(data)
  } else {
    request(draw)
  }
})
