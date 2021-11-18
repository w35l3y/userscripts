Baixe um plugin do Firefox chamado [Greasemonkey](https://addons.mozilla.org/pt-BR/firefox/addon/greasemonkey/)<br />
Talvez funcione também no Chrome com um plugin chamando [Tampermonkey](https://addons.mozilla.org/pt-BR/firefox/addon/tampermonkey/), mas não tenho certeza.<br />
<br />
Estes plugins permitem injetar código JavaScript em qualquer página.<br />
Por este motivo, é preciso ter muito cuidado com os scripts que rodam nestes plugins.<br />
<br />
Depois que instalar, acesse este endereço:<br />
https://github.com/w35l3y/userscripts/blob/master-greasemonkey/scripts/SmartThings_Device_Routes/main.user.js<br />
<br />
O plugin deverá reconhecer este link e questionar se deseja instalar o script.<br />
O código do script é aberto, então você pode verificar que não há perigo algum.<br />
<br />
Feito isso, acesse a [lista de Devices do Groovy IDE](https://graph-na04-useast2.api.smartthings.com/device/list).<br />
O endereço da minha região é "graph-na04-useast2", o seu pode ser outro. Então, atente para este detalhe!<br />
<br />
Assim que o script terminar o processamento, deverá ser exibido um gráfico no final da lista.<br />
<br />
<br />
```
Ctrl + Alt + R : Atualiza a lista
Ctrl + Alt + E : Alterna ordenação
```
