// ==UserScript==
// @name         Export/Import devices
// @description  Export/Import devices
// @version      1.0.0
// @include      https://*.api.smartthings.com/device/list
// @grant        GM.xmlHttpRequest
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

/*

IT DOES DO
 - Restore devices
 - Restore device preferences
 - Restore child devices

IT DOESN'T DO
 - Restore locations
 - Restore hubs
 - Restore groups
 - Restore device current states

*/

function obj2str (obj) {
  return Object.entries(obj).map(([key, value]) => key + "=\"" + (value + "").trim() + "\"").join(" ")
}

function link2obj (a) {
  if (!a) return { id: "", label: "" }

  return {
    id: /([\w-]+)$/.test(a.href) && RegExp.$1.trim() || "",
    label: a.textContent.trim()
  }
}

function mountDocument (response) {
  let doc = document.implementation.createHTMLDocument("");
  doc.documentElement.innerHTML = response.responseText;
  return doc
}

function csrf (doc) {
  return {
    _csrf: doc.querySelector("meta[name = '_csrf']").getAttribute("content")
  }
}

function deviceList (doc) {
  let _csrf = csrf(doc)
  let output = {
    ..._csrf,
    list: Array.prototype.slice.apply(doc.querySelectorAll("td:nth-child(1) > a")).map(item => {
      let device = link2obj(item)

      let row = item.parentNode.parentNode
      let location = link2obj(row.cells[2].firstElementChild)
      let hub = link2obj(row.cells[3].firstElementChild)

      return {
        name: "",
        handlerVersion: "",
        groupId: "",
        groupLabel: "",
        properties: [],
        children: [],
        ..._csrf,
        id: device.id,
        label: device.label,
        zigbeeId: row.cells[4].textContent.trim(),
        deviceNetworkId: row.cells[5].textContent.trim(),
        type: row.cells[1].textContent.trim(),
        locationId: location.id,
        locationLabel: location.label,
        hubId: hub.id,
        hubLabel: hub.label
      }
    })
  }
  console.log("Parsing Device List...", output)

  return output
}

function deviceDetail (doc) {
  let group = link2obj(doc.querySelector("#group + td.property-value a"))
  let hub = link2obj(doc.querySelector("#hub-label + td.property-value a"))
  let parent = link2obj(doc.querySelector("#parent-device-label + td.property-value a"))

	let labels = { version: "handlerVersion" }
  let output = {
    ...csrf(doc),
    id: doc.querySelector("#delete-button[data-id]").getAttribute("data-id"),
    label: "",
    name: "",
    zigbeeId: "",
    deviceNetworkId: "",
    type: "",
    handlerVersion: "",
    groupId: group.id,
    groupLabel: group.label,
    hubId: hub.id,
    hubLabel: hub.label,
    parentId: parent.id,
    parentLabel: parent.label,
    ...Array.prototype.slice.apply(doc.querySelectorAll("#name-label, #label-label, #zigbeeId-label, #deviceNetworkId-label, #type-label, #version-label")).reduce((s, label) => {
			let key = label.id.split("-")[0]
      s[labels[key] || key] = label.nextElementSibling.textContent.trim()
      return s
    }, {}),
    properties: Array.prototype.slice.apply(doc.querySelectorAll("#preferences-label + td.property-value tr > td:nth-child(1)")).map(property => ({
      name: property.textContent.trim(),
      value: property.parentNode.cells[2].textContent.trim()
    })),
    children: Array.prototype.slice.apply(doc.querySelectorAll("#children-label + td.property-value a")).map(link2obj)
  }
  console.log("Parsing Device Detail...", output)

  return output
}

function json2url(obj) {
  return Object.entries(obj).map(([key, value]) => key + "=" + encodeURIComponent(value)).join("&")
}

function searchFromDomain(lenient, list, text, id = text) {
  let found = list.filter(({ value, label }) => (value === id && (!text || label === text)) || (label === text && (!id || id === text || value !== id)))
  if (found.length === 1) {
    return found[0].value
  }
  console.error("Missing domain...", lenient, text, id, found, list)
  if (lenient && id !== text) {
  	return id
  }
  return list.find(({ label }) => label === "").value
}

function saveProperties({ _csrf, id, properties }) {
  return new Promise((resolve, reject) => {
    console.log("Saving properties...", id, properties)
    GM.xmlHttpRequest({
      method: "post",
      url: location.origin + "/device/list",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      data: json2url({
        _csrf,
        "device.id": id,
        ...properties.reduce((s, v, i) => {
          Object.entries(v).forEach(([key, value]) => {
            s["preferences." + i + "." + key] = value
          })
          return s
        }, {}),
        _action_savePreferences: "Save"
      }),
      onload: response => {
        resolve(deviceDetail(mountDocument(response)))
      }
    })
  })
}

function updateChildren(newDevice, devices) {
  if (!newDevice.children.length) {
    console.log("Empty list")
    return Promise.resolve({})
  }

  let { label, ...newChild } = newDevice.children.shift()
  let { id, ...oldChild } = devices.find(oldChild => {
    if (oldChild.deviceNetworkId === newChild.deviceNetworkId) {
      return true
    }
    return false
  })
	if (!oldChild) {
    console.log("Missing child device...", newChild)
    ++newDevice.index
    return updateChildren(newDevice, devices)
  }

  return new Promise((resolve, reject) => {
    change_title("Editing child device...", ++newDevice.index, newDevice.total, newChild.id, newChild, oldChild)
    GM.xmlHttpRequest({
      method: "get",
      url: location.origin + "/device/edit/" + newChild.id,
      onload: response => {
        let doc = mountDocument(response)
        let version = null

        try {
        	version = doc.querySelector("#version").value
        } catch (e) {
          reject(e)
        }

        let { name, label, zigbeeId, deviceNetworkId, type, handlerVersion, hubLabel, hubId, groupLabel, groupId } = { ...newChild, ...oldChild }
        let { _csrf, types, versions, hubs, groups } = getDomains(doc)

        let data = {}
        try {
          data = {
            _csrf,
            id: newChild.id,
            version,
            name,
            label,
            zigbeeId,
            deviceNetworkId,
            "type.id": searchFromDomain(false, types, type),
            handlerVersion: searchFromDomain(false, versions, handlerVersion),
            hubId: searchFromDomain(false, hubs, hubLabel, hubId),
            groupId: searchFromDomain(false, groups, groupLabel, groupId),
            _action_update: "Alterar"
          }
        } catch (e) {
          return updateChildren(newDevice, devices).then(() => resolve({ _csrf }), reject)
        }

        console.log("Updating child...", data)
        GM.xmlHttpRequest({
          method: "post",
          url: location.origin + "/device/update",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          data: json2url(data),
          onload: response => {
            updateChildren(newDevice, devices).then(() => resolve({ _csrf }), reject)
          }
        })
      }
    })
  })
}

function showAndUpdateChildren ({ children, ...detail }, list) {
  return showDetails(children)
    .then(children => updateChildren({ ...detail, index: 0, total: children.length, children }, list))
}

function createParentDevices(result, list, filteredList) {
  if (!filteredList.length) {
    console.log("Empty list")
    return Promise.resolve(result)
  }

  let { id, ...device } = filteredList.shift()
  let { _csrf, groupLenient = false, types, versions, locations, hubs, groups } = result
  let { name, label = "", zigbeeId = "", deviceNetworkId, type, handlerVersion, locationLabel, locationId, hubLabel, hubId, groupLabel, groupId } = device
  let data = {}
  try {
    data = {
      _csrf,
      name,
      label,
      zigbeeId,
      deviceNetworkId,
      "type.id": searchFromDomain(false, types, type),
      handlerVersion: searchFromDomain(false, versions, handlerVersion),
      locationId: searchFromDomain(false, locations, locationLabel, locationId),
      hubId: searchFromDomain(false, hubs, hubLabel, hubId),
      groupId: searchFromDomain(groupLenient, groups, groupLabel, groupId),
      create: "Criar"
    }
  } catch (e) {
    console.log("Invalid parent", e.message)
    ++result.index
    return createParentDevices(result, list, filteredList)
  }
  
  return new Promise((resolve, reject) => {
    change_title("Saving device...", ++result.index, result.total, data)
    GM.xmlHttpRequest({
      method: "post",
      url: location.origin + "/device/save",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      data: json2url(data),
      onload: response => {
        let { _csrf, ...detail } = deviceDetail(mountDocument(response))

        console.log("Checking conditions...", detail.children.length, device.children.length, device.properties.length)
        if (detail.children.length && device.children.length) {
          if (device.properties.length) {
          	return saveProperties({ ...detail, ...device, _csrf })
              .then(data => showAndUpdateChildren(detail, list))
              .then(data => createParentDevices({ ...result, ...data }, list, filteredList))
              .then(resolve, reject)
          }

          return showAndUpdateChildren(detail, list)
            .then(resolve, reject)
        } else if (device.properties.length) {
          return saveProperties({ ...detail, ...device, _csrf })
            .then(data => createParentDevices({ ...result, ...data }, list, filteredList))
            .then(resolve, reject)
        }

        return createParentDevices({ ...result, _csrf }, list, filteredList)
          .then(resolve, reject)
      }
    })
  })
}

function getDomains(doc) {
  return {
    ...csrf(doc),
    types: Array.prototype.slice.apply(doc.querySelectorAll("select[name = 'type.id'] > option")).map(({ value, label, selected = "" }) => ({ value, label, selected })),
    versions: Array.prototype.slice.apply(doc.querySelectorAll("select[name = 'handlerVersion'] > option")).map(({ value, label, selected = "" }) => ({ value, label, selected })),
    locations: Array.prototype.slice.apply(doc.querySelectorAll("select[name = 'locationId'] > option")).map(({ value, label, selected = "" }) => ({ value, label, selected })),
    hubs: Array.prototype.slice.apply(doc.querySelectorAll("select[name = 'hubId'] > option")).map(({ value, label, selected = "" }) => ({ value, label, selected })),
    groups: Array.prototype.slice.apply(doc.querySelectorAll("select[name = 'groupId'] > option")).map(({ value, label, selected = "" }) => ({ value, label, selected })),
  }
}

function getDomainsWhenCreatingDevice() {
  return new Promise((resolve, reject) => {
    change_title("Requesting domains...", 0, 1)
    GM.xmlHttpRequest({
      method: "get",
      url: newDevice.href,
      onload: response => resolve(getDomains(mountDocument(response))),
      onerror: response => reject()
    })
  })
}

function showDevice(device) {
  return new Promise((resolve, reject) => {
    console.log("Showing device...", device)
    GM.xmlHttpRequest({
      method: "GET",
      url: location.origin + "/device/show/" + device.id,
      onload: response => resolve({ ...device, ...deviceDetail(mountDocument(response)) }),
      onerror: response => reject()
    })      
  })
}

let title = document.title
function change_title(prefix, index, total, ...args) {
  console.log(prefix, index, "/", total, ...args)
  document.title = title + " - " + prefix + " " + Math.floor(100 * (index / total)) + "%"
}

function showDetails(list) {
  let counter = 0

  return Promise.all(list.map((device, index, array) => {
    return showDevice(device).then(data => {
    	change_title("Requesting device detail...", ++counter, array.length)
      return data
    })
  })).then(data => {
    document.title = title
    return data
  })
}

function getDefaultLabel(type, index) {
  if (index) {
    return type + " " + index
  }
  return type
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

let newDevice = document.querySelector("a.create.btn.btn-small.btn-success.pull-right")

let exportList = newDevice.cloneNode(true)
exportList.href = "#export"
exportList.innerHTML = '<span class="glyphicon glyphicon-export"></span>'
let importList = newDevice.cloneNode(true)
importList.href = "#import"
importList.innerHTML = '<span class="glyphicon glyphicon-import"></span>'

let page = deviceList(document)

function export_json (list) {
  return showDetails(list).then(values => {
    let json = {
      createdAt: new Date().toISOString(),
      groupLenient: true,
      devices: values.map(({ _csrf, ...x }) => x)
    }

    GM.setClipboard(JSON.stringify(json, null, 2))
    GM.setValue("backup", JSON.stringify(json))
    alert("All done!\n\nSaved to your clipboard.")
  }, () => alert("Something went wrong."))
}

exportList.addEventListener("click", e => {
  e.preventDefault()
  e.stopPropagation()
  
  if (confirm("Do you want to export your list of devices?\n\nThis will be saved to your clipboard and may take some minutes depending on the total of devices to export.")) {
    return export_json(page.list)
  }
}, false)

importList.addEventListener("click", e => {
  e.preventDefault()
  e.stopPropagation()

  GM.getValue("backup", "{}").then(value => {
    let list = deviceList(document).list
    let existingDevices = list.map(({ id, label }) => id + "/" + label)
    let existingDevicesNetworkIds = list.map(({ deviceNetworkId }) => deviceNetworkId)

    let x = {}
    try {
      x = JSON.parse(prompt("Import devices", value)) || {}
    } catch (e) {}

    let { devices = [], ...json } = x
    let filteredDevices = devices
    .filter(({ parentId, parentLabel, id, name, deviceNetworkId, type, label = getDefaultLabel(type, deviceNetworkId.split(":")[1]), handlerVersion, locationLabel, hubLabel }) => {
      if ((parentId || parentLabel) && (!name || !deviceNetworkId || !type || !handlerVersion || !(locationLabel || hubLabel))) {
        console.log("Filtered out - Missing required fields", { name, deviceNetworkId, type, handlerVersion, locationLabel, hubLabel })
        return false
      }
      if (~existingDevices.indexOf(id + "/" + label)) {
        console.log("Filtered out - Existing device", { id, label })
        return false
      }
      if (~existingDevicesNetworkIds.indexOf(deviceNetworkId)) {
        console.log("Filtered out - Existing device network id", { deviceNetworkId })
        return false
      }

      return true
    })


    if (filteredDevices.length > 0) {
      let parentDevices = filteredDevices.filter(({ parentId, parentLabel }) => !(parentId || parentLabel))

      getDomainsWhenCreatingDevice()
      .then(data => createParentDevices({ ...data, ...json, index: 0, total: parentDevices.length }, filteredDevices, parentDevices))
      .then(() => {
        document.title = title
        alert("Devices imported successfully.")
      })
    } else {
      alert("No new devices found.")
    }
  })
}, false)

newDevice.parentNode.insertBefore(importList, newDevice)
newDevice.parentNode.insertBefore(exportList, newDevice)
