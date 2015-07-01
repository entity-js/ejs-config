# EntityJS - Components

## Config

A component which provides a JSON config object using the data to maniuplate
the data.

### Usage

```javascript
var Config = require('ejs-config');

config = new Config('../configs/config.json');
config.get('my.config.value');
```
