/**
* @Date:   2017-01-23T23:00:14-05:00
* @Filename: server.js
* @Last modified time: 2017-01-29T18:04:55-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/


var app = require('./src/app');
var pkg = require('./package.json');

app.set('port', process.env.PORT || 8081);

var server = app.listen(app.get('port'), function() {
    console.log(pkg.name, 'app listening on port ', server.address().port);
});
