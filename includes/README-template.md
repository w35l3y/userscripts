%{meta}
# [%{name/}](.)
%{description}
**Summary:** %{value/}<br />%{/description}%{license}
**License:** %{value/}<br />%{/license}
[![PayPal - The safer, easier way to pay online!](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif "PayPal - The safer, easier way to pay online!")](http://goo.gl/Fv19S)
### Usage
```
%{grant}// @grant		%{value/}
%{/grant}%{resource}// @resource	%{key/} %{value|!^http}https://github.com/w35l3y/userscripts/raw/master/scripts/X/%{/value}%{value/}
%{/resource}%{require}// @require		%{value|!^http}https://github.com/w35l3y/userscripts/raw/master/scripts/X/%{/value}%{value/}
%{/require}%{/meta}// @require	https://github.com/w35l3y/userscripts/raw/master/scripts/%{raw/}
```
%{sshots|>0}
### Screenshots
%{values}![%{fname/}](%{name/})
%{/values}%{/sshots}%{issues.list|>0}
### Issues
State|Topic|Replies|Author|Updated
:---:|:---|:---:|:---:|---:
%{values}%{state/}|#%{number/}: [%{title/}](%{html_url/})|%{comments/}|[%{user.login/}](%{user.html_url/})|%{updated_at/}
%{/values}%{/issues.list}
This file was generated automatically at `%{updated_at/}`