// ==UserScript==
// @name        Peixe Urbano : Coupon Page Title
// @namespace   http://gm.wesley.eti.br
// @include     https://www.peixeurbano.com.br/Passe/Codigo?*
// @version     1.0.0
// @require     ../../includes/Includes_XPath/63808.user.js
// ==/UserScript==

document.title = "PU " + xpath("string(.//tr/td[2]/strong/text())") + " - " + xpath("string(.//tr[2]/td/div/span/strong/text())");