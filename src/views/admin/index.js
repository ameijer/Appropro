/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: index.js
* @Last modified time: 2017-01-29T16:18:25-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports.init = function(req, res, next) {
    return res.render('admin/index');
};
