var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var morgan     = require('morgan');

// INITIALIZATION
// =============================================================================
app.set('port', (process.env.PORT || 8080)); // Set the port

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('combined'));

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://registry:dip999@ds042459.mlab.com:42459/krdo_joke_registry');

var ServiceModel = require('./models/service');

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

// Opening up API for cors (Cross-origin resource sharing)
router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Welcome route
router.get('/', function(req, res) {
    res.json({ message: 'Welcome to the Joke Registry API!' });
});

router.route('/services')
    .get(function (req, res) {
        ServiceModel.find().exec(function(err, services) {
            if (err) {
                res.status(500);
                res.send(err);
            } else {
                // Remove secret from putput
                var output = JSON.parse(JSON.stringify(services));
                output.forEach(function(item, index) {
                    delete item.secret;
                });
                res.json(output);
            }
        });
    })

    .post(function(req, res) {
        var service = new ServiceModel();
        service.address = req.body.address;
        service.secret = req.body.secret;
        service.name = req.body.name;
        service.timestamp = Date.now();

        // check for duplicates
        ServiceModel.find({address: req.body.address}).exec(function(err, services) {
            if (services.length > 0) {
                res.send({message : "Service already registered!"});
            } else {
                // save the message and check for errors
                service.save(function(err) {
                    if (err) {
                        res.status(500);
                        res.send(err);
                    } else {
                        res.json({message: 'Service saved!'});
                    }
                });
            }
        });
    })

    .delete(function(req, res)  {
        ServiceModel.find({address: req.body.address}).exec(function(err, services) {
            if (err) res.send(err);
            else {
                if (services.length > 1) {
                    res.status(400);
                    res.send({message : "Error! Duplicate services in the registry!"});
                } else if (services.length == 0) {
                    res.status(400);
                    res.send({message : "Error! Service not found!"});
                } else if (services[0].secret != req.body.secret) {
                    res.status(400);
                    res.send({message : "Error! Secret does not match!"});
                } else {
                    var service = services[0];
                    service.remove(function(err) {
                        if (err)
                            res.send(err);
                        else
                            res.json({ message: 'Service deleted!' });
                    });
                }
            }
        });
    });


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


// START THE SERVER
// =============================================================================
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
