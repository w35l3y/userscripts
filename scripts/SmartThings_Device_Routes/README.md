Baixe um plugin do Firefox chamado [Greasemonkey](https://addons.mozilla.org/pt-BR/firefox/addon/greasemonkey/)<br />
Talvez funcione também com um plugin chamando [Tampermonkey](https://addons.mozilla.org/pt-BR/firefox/addon/tampermonkey/).<br />
Esses plugins permitem injetar código JavaScript em qualquer página.<br />
Por este motivo, é preciso ter muito cuidado com os scripts rodam nesses plugins.<br />

Depois que instalar, acessa esse endereço:
https://github.com/w35l3y/userscripts/blob/master-greasemonkey/scripts/SmartThings_Device_Routes/main.user.js

O plugin deverá reconhecer este link e questionar se você quer instalar o script.
O código do script é aberto, então você pode verificar que não há perigo algum.

Feito isso, acesse a [lista de Devices do Groovy IDE](https://graph-na04-useast2.api.smartthings.com/device/list).
O endereço da minha região é "graph-na04-useast2", o seu pode ser outro. Então, atente para este detalhe!

Assim que o script terminar o processamento, um gráfico no final da lista dever ser exibido.


```
Ctrl + Alt + R : Atualiza a lista
Ctrl + Alt + E : Alterna ordenação
```
