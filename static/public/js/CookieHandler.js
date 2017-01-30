/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: CookieHandler.js
* @Last modified time: 2017-01-29T18:00:45-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



/**
 *
 */

var CookieHandler = (function(oConfig) {
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            var nested = "";
            var nestedField = "";
            if (this.name.includes("_-_")) {
                nested = this.name.split("_-_")[0];
                nestedField = this.name.split("_-_")[1];
                if (o[nested] !== undefined) {
                    if (o[nested][nestedField] !== undefined) {
                        o[nested][nestedField] = [].concat(o[nested][nestedField]);
                    } else {
                        o[nested][nestedField] = this.value || "";
                    }
                } else {
                    o[nested] = {};
                    o[nested][nestedField] = this.value || "";
                }
            } else {
                if (o[this.name] !== undefined) {

                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }

                    o[this.name].push(this.value || "");
                } else {
                    o[this.name] = this.value || "";
                }
            }
        });
        return o;
    };

    return { // publicly accessible API

        //@getCookie is a helper function to grab a cookie, by name, from the user's computer
        getCookie: function(c_name) {
            var value = "; " + document.cookie;
            var parts = value.split("; " + c_name + "=");
            if (parts.length == 2) {
                return parts.pop().split(";").shift();
            }
        },

        //@setupCSRF inserts a middleware function that attaches a CSRF token cookie to all AJAX requests.
        setupCSRF: function() {
            var csrfToken = this.getCookie('_csrfToken');
            $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
                options.xhrFields = {
                    withCredentials: true
                };

                if (csrfToken) {
                    return jqXHR.setRequestHeader('X-CSRF-Token', csrfToken);
                }
            });
        },

        //@setupFormMiddleware hijacks form submissions at submit-time, converts them to a
        // JSON AJAX request. This allows the setupCSRF ajaxPrefilter to work with forms.

        setupFormMiddleware: function() {
            // this is the id of the form
            $("form").submit(function(e) {
                var self = this;
                var url = "path/to/your/script.php"; // the script where you handle the form input.

                $.ajax({
                    type: self.method,
                    url: self.action,
                    data: $(self).serializeObject(), // serializes the form's elements.
                    success: self.onsuccess,
                });

                e.preventDefault(); // avoid to execute the actual submit of the form.
            });
        },

        setup: function() {
            this.setupFormMiddleware();
            this.setupCSRF();
        }
    };
})();
