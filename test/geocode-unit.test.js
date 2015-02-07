var queue = require('queue-async');
var fs = require('fs');
var util = require('util');
var Carmen = require('..');
var index = require('../lib/index');
var feature = require('../lib/util/feature');
var mem = require('../lib/api-mem');
var UPDATE = process.env.UPDATE;
var test = require('tape');

(function() {
    var conf = {
        province: new mem(null, function() {}),
        city: new mem(null, function() {}),
        street: new mem({ maxzoom:6, geocoder_address:1 }, function() {})
    };
    var c = new Carmen(conf);
    test('index province', function(t) {
        var province = {
            _id:1,
            _text:'new york, ny',
            _zxy:['6/32/32','6/33/32'],
            _center:[0,0]
        };
        conf.province.putGrid(6, 32, 32, solidGrid(province));
        conf.province.putGrid(6, 33, 32, solidGrid(province));
        index.update(conf.province, [province], 6, t.end);
    });
    test('index city 1', function(t) {
        var city = {
            _id:1,
            _text:'new york, ny',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.city.putGrid(6, 32, 32, solidGrid(city));
        index.update(conf.city, [city], 6, t.end);
    });
    test('index city 2', function(t) {
        var city = {
            _id:2,
            _text:'tonawanda',
            _zxy:['6/33/32'],
            _center:[360/64,0]
        };
        conf.city.putGrid(6, 33, 32, solidGrid(city));
        index.update(conf.city, [city], 6, t.end);
    });
    test('index street 1', function(t) {
        var street = {
            _id:1,
            _text:'west st',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.street.putGrid(6, 32, 32, solidGrid(street));
        index.update(conf.street, [street], 6, t.end);
    });
    test('index street 2', function(t) {
        var street = {
            _id:2,
            _text:'west st',
            _zxy:['6/33/32'],
            _center:[360/64,0]
        };
        conf.street.putGrid(6, 33, 32, solidGrid(street));
        index.update(conf.street, [street], 6, t.end);
    });
    test('west st, tonawanda, ny', function(t) {
        c.geocode('west st tonawanda ny', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'west st, tonawanda, new york');
            t.end();
        });
    });
    test('west st, new york, ny', function(t) {
        c.geocode('west st new york ny', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'west st, new york, new york');
            t.end();
        });
    });
    test('new york', function(t) {
        c.geocode('new york', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'new york');
            t.deepEqual(res.features[0].id, 'province.1');
            t.end();
        });
    });
    test('new york new york', function(t) {
        c.geocode('new york new york', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'new york, new york');
            t.deepEqual(res.features[0].id, 'city.1');
            t.end();
        });
    });
    test('ny ny', function(t) {
        c.geocode('ny ny', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'new york, new york');
            t.deepEqual(res.features[0].id, 'city.1');
            t.end();
        });
    });
    // failing
    test.skip('new york ny', function(t) {
        c.geocode('new york ny', { limit_verify:2 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'new york, new york');
            t.deepEqual(res.features[0].id, 'city.1');
            t.end();
        });
    });
})();

// Confirm that for equally relevant features across three indexes
// the first in hierarchy beats the others. (NO SCORES)
(function() {
    var conf = {
        country: new mem(null, function() {}),
        province: new mem(null, function() {}),
        city: new mem(null, function() {}),
    };
    var c = new Carmen(conf);
    test('index country', function(t) {
        var country = {
            _id:1,
            _text:'china',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.country.putGrid(6, 32, 32, solidGrid(country));
        index.update(conf.country, [country], 6, t.end);
    });
    test('index province', function(t) {
        var province = {
            _id:1,
            _text:'china',
            _zxy:['6/33/32'],
            _center:[360/64,0]
        };
        conf.province.putGrid(6, 33, 32, solidGrid(province));
        index.update(conf.province, [province], 6, t.end);
    });
    test('index city', function(t) {
        var city = {
            _id:1,
            _text:'china',
            _zxy:['6/34/32'],
            _center:[360/64*2,0]
        };
        conf.city.putGrid(6, 34, 32, solidGrid(city));
        index.update(conf.city, [city], 6, t.end);
    });
    test('china', function(t) {
        c.geocode('china', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'china');
            t.deepEqual(res.features[0].id, 'country.1');
            t.end();
        });
    });
})();

// Confirm that for equally relevant features across three indexes
// the one with the highest score beats the others.
(function() {
    var conf = {
        country: new mem(null, function() {}),
        province: new mem(null, function() {}),
        city: new mem(null, function() {}),
    };
    var c = new Carmen(conf);
    test('index country', function(t) {
        var country = {
            _id:1,
            _score: 5,
            _text:'china',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.country.putGrid(6, 32, 32, solidGrid(country));
        index.update(conf.country, [country], 6, t.end);
    });
    test('index province', function(t) {
        var province = {
            _id:2,
            _score: 10,
            _text:'china',
            _zxy:['6/33/32'],
            _center:[360/64,0]
        };
        conf.province.putGrid(6, 33, 32, solidGrid(province));
        index.update(conf.province, [province], 6, t.end);
    });
    test('index city', function(t) {
        var city = {
            _id:3,
            _score: 6,
            _text:'china',
            _zxy:['6/34/32'],
            _center:[360/64*2,0]
        };
        conf.city.putGrid(6, 34, 32, solidGrid(city));
        index.update(conf.city, [city], 6, t.end);
    });
    test('china', function(t) {
        c.geocode('china', { limit_verify:3 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].id, 'province.2');
            t.deepEqual(res.features[1].id, 'city.3');
            t.deepEqual(res.features[2].id, 'country.1');
            t.end();
        });
    });
})();

(function() {
    var conf = {
        province: new mem(null, function() {}),
        postcode: new mem(null, function() {}),
        city: new mem(null, function() {}),
        street: new mem({ maxzoom:6, geocoder_address:1 }, function() {})
    };
    var c = new Carmen(conf);
    test('index province', function(t) {
        var province = {
            _id:1,
            _text:'connecticut, ct',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.province.putGrid(6, 32, 32, solidGrid(province));
        index.update(conf.province, [province], 6, t.end);
    });
    test('index city', function(t) {
        var city = {
            _id:1,
            _text:'windsor',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.city.putGrid(6, 32, 32, solidGrid(city));
        index.update(conf.city, [city], 6, t.end);
    });
    test('index street', function(t) {
        var street = {
            _id:1,
            _text:'windsor ct',
            _zxy:['6/33/32'],
            _center:[360/64,0]
        };
        conf.street.putGrid(6, 33, 32, solidGrid(street));
        index.update(conf.street, [street], 6, t.end);
    });
    // failing
    // city beats street at spatialmatch
    test.skip('windsor ct (limit 1)', function(t) {
        c.geocode('windsor ct', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'windsor, connecticut');
            t.deepEqual(res.features[0].id, 'city.1');
            t.end();
        });
    });
    // failing
    // city beats street at context sort
    test.skip('windsor ct (limit 2)', function(t) {
        c.geocode('windsor ct', { limit_verify:2 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'windsor, connecticut');
            t.deepEqual(res.features[0].id, 'city.1');
            t.end();
        });
    });
})();


//Ensure that results that have equal relev in phrasematch
//are matched against the 0.5 relev bar instead of 0.75
(function() {
    var conf = {
        country: new mem({ maxzoom:6 }, function() {})
    };
    var c = new Carmen(conf);
    test('index country', function(t) {
        var country = {
            _id:1,
            _text:'czech republic',
            _zxy:['6/32/32'],
            _center:[0,0]
        };
        conf.country.putGrid(6, 32, 32, solidGrid(country));
        index.update(conf.country, [country], 6, t.end);
    });
    test('index country2', function(t) {
        var country = {
            _id:2,
            _text:'fake country two',
            _zxy:['7/32/32'],
            _center:[0,0]
        };
        conf.country.putGrid(7, 32, 32, solidGrid(country));
        index.update(conf.country, [country], 7, t.end);
    });
    test('czech => czech repblic', function(t) {
        c.geocode('czech', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.deepEqual(res.features[0].place_name, 'czech republic');
            t.deepEqual(res.features[0].id, 'country.1');
            t.end();
        });
    });

    //Is not above 0.5 relev so should fail.
    test('fake => [fail]', function(t) {
        c.geocode('fake', { limit_verify:1 }, function(err, res) {
            t.ifError(err);
            t.notOk(res.features[0]);
            t.end();
        });
    });
})();

//Ensures that relev takes into house number into consideration
(function() {
    var conf = {
        address: new mem({maxzoom: 6, geocoder_address: 1}, function() {})
    };
    var c = new Carmen(conf);
    test('index address', function(t) {
            var address = {
                _id:1,
                _text:'fake street',
                _zxy:['6/32/32'],
                _center:[0,0],
                _cluster: {
                    9: { type: "Point", coordinates: [0,0] },
                    10: { type: "Point", coordinates: [0,0] },
                    7: { type: "Point", coordinates: [0,0] }
                }
            };
            conf.address.putGrid(6, 32, 32, solidGrid(address));
            index.update(conf.address, [address], 6, t.end);
    });
    test('test address index for relev', function(t) {
        c.geocode('9 fake street', { limit_verify: 1 }, function (err, res) {
            t.ifError(err);
            t.equals(res.features[0].relevance, 1);
            t.end();
        });
    });
})();

(function() {
    var conf = {
        address: new mem({maxzoom: 6, geocoder_address: 1}, function() {})
    };
    var c = new Carmen(conf);
    test('index alphanum address', function(t) {
            var address = {
                _id:1,
                _text:'fake street',
                _zxy:['6/32/32'],
                _center:[0,0],
                _cluster: {
                    '9b': { type: "Point", coordinates: [0,0] },
                    '10c': { type: "Point", coordinates: [0,0] },
                    '7': { type: "Point", coordinates: [0,0] }
                }
            };
            conf.address.putGrid(6, 32, 32, solidGrid(address));
            index.update(conf.address, [address], 6, t.end);
    });
    test('test address index for alphanumerics', function(t) {
        c.geocode('9b fake street', { limit_verify: 1 }, function (err, res) {
            t.ifError(err);
            t.equals(res.features[0].place_name, '9b fake street', 'found 9b fake street');
            t.equals(res.features[0].relevance, 1);
            t.end();
        });
    });
})();

(function() {
    var conf = {
        address: new mem({maxzoom: 6, geocoder_address: 1}, function() {})
    };
    var c = new Carmen(conf);
    test('index address', function(t) {
            var address = {
                _id:1,
                _text:'fake street',
                _zxy:['6/32/32'],
                _center:[0,0],
                _cluster: {
                    '9': { type: "Point", coordinates: [0,0] },
                    '10': { type: "Point", coordinates: [0,0] },
                    '7': { type: "Point", coordinates: [0,0] }
                }
            };
            conf.address.putGrid(6, 32, 32, solidGrid(address));
            index.update(conf.address, [address], 6, t.end);
    });
    test('test address query with alphanumeric', function(t) {
        c.geocode('9b fake street', { limit_verify: 1 }, function (err, res) {
            t.ifError(err);
            t.equals(res.features[0].place_name, '9b fake street', 'found 9b fake street');
            t.equals(res.features[0].relevance, 1);
            t.end();
        });
    });
})();

(function() {
    var conf = {
        address: new mem({maxzoom: 6, geocoder_address: 1}, function() {})
    };
    var c = new Carmen(conf);
    test('index address', function(t) {
            var address = {
                _id:1,
                _text:'fake street',
                _zxy:['6/32/32'],
                _center:[0,0],
                _rangetype:'tiger',
                _lfromhn: '0',
                _ltohn: '100',
                _geometry: {
                    type:'LineString',
                    coordinates:[[0,0],[0,100]]
                }
            };
            conf.address.putGrid(6, 32, 32, solidGrid(address));
            index.update(conf.address, [address], 6, t.end);
    });
    test('test address query with address range', function(t) {
        c.geocode('9 fake street', { limit_verify: 1 }, function (err, res) {
            t.ifError(err);
            t.equals(res.features[0].place_name, '9 fake street', 'found 9 fake street');
            t.equals(res.features[0].relevance, 1);
            t.end();
        });
    });
})();
