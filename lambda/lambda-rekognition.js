var AWS = require('aws-sdk');
AWS.config.update({
    region: 'ap-northeast-1'
});
var lambda = new AWS.Lambda({
    "endpoint": "https://lambda.ap-northeast-1.amazonaws.com"
});
AWS.config.update({
    region: 'us-west-2'
});
var s3 = new AWS.S3();
var async = require('async');
var rekognition = new AWS.Rekognition();
var gm = require('gm').subClass({
    imageMagick: true
});

exports.handler = (event, context, callback) => {
    async.eachLimit(event.Records, 5, function(record, callback) {
        if (record.eventName == "ObjectCreated:Put" || record.eventName == "ObjectCreated:Post") {
            var S3Object = decodeURIComponent(record.s3.object.key);
            var S3Bucket = record.s3.bucket.name;
            async.waterfall([
                function downloadImage(next) {
                    s3.getObject({
                        Bucket: S3Bucket,
                        Key: S3Object
                    }, next);
                },
                function recognizeLabels(response, next) {
                    var params = {
                        Image: {
                            S3Object: {
                                Bucket: S3Bucket,
                                Name: S3Object
                            }
                        },
                        MaxLabels: 10
                    };
                    console.log("Recognizing labels for " + S3Object);
                    rekognition.detectLabels(params, function(err, data) {
                        if (err) next(err);
                        next(null, data.Labels, response.Metadata, response.Body);
                    });
                },
                function recognizeFaces(labels, metadata, image, next) {
                    console.log("Detecting faces for " + S3Object);
                    rekognition.detectFaces({
                        Image: {
                            S3Object: {
                                Bucket: S3Bucket,
                                Name: S3Object
                            }
                        },
                        Attributes: ['ALL']
                    }, function(err, data) {
                        if (err) next(err);
                        next(null, data.FaceDetails, labels, metadata, image);
                    });
                },
                function cropFaces(faces, labels, metadata, image, next) {
                    var width = 0;
                    var height = 0;
                    gm(image).size(function(err, size) {
                        width = size.width;
                        height = size.height;
                        async.eachOfLimit(faces, 5, function(record, key, callback) {
                            var x = width * record.BoundingBox.Left;
                            var y = height * record.BoundingBox.Top;
                            var facewidth = width * record.BoundingBox.Width;
                            var faceheight = height * record.BoundingBox.Height;
                            console.log("Cropping face number " + key + " on the following x:" + x + " y:" + y);
                            gm(image).crop(facewidth, faceheight, x, y).toBuffer("jpg", function(err, buffer) {
                                if (err) next(err);
                                s3.putObject({
                                    Bucket: S3Bucket,
                                    Key: S3Object.replace('uploads/', 'crops/face-' + key + '-'),
                                    Body: buffer,
                                    ContentType: 'image/jpeg',
                                    Metadata: metadata
                                }, callback)
                            });
                        }, function(err) {
                            if (err) next(err);
                            next(null, faces, labels, metadata);
                        });
                    });
                },
                function notify(faces, labels, metadata, next) {
                    console.log("contacting slack-channel");
                    console.log(faces);
                    var message;
                    if (faces.length > 0) {
                        if (faces.length == 1)
                            message = "Detected a person in your vincinity (https://s3-us-west-2.amazonaws.com/edison-hackday/" + S3Object + ")";
                        else
                            message = "Detected people in your vincinity: (https://s3-us-west-2.amazonaws.com/edison-hackday/" + S3Object + ")";
                        for (i = 0; i < faces.length; i++) {
                            message = message + "\n\n";
                            message = message + "Person Number " + (i + 1) + ": https://s3-us-west-2.amazonaws.com/edison-hackday/" + S3Object.replace('uploads/', 'crops/face-' + i + '-');
                        }
                        //console.log(message);
                        message = message + "\n\n";
                        var params = {
                            FunctionName: 'slack-demo-incoming-webhook',
                            Payload: JSON.stringify({
                                message: message
                            })
                        };
                        lambda.invoke(params, function(err, data) {
                            if (err) next(err);
                            else {
                                next(null);
                            }
                        });
                    }
                }
            ], function(err) {
                if (err) callback(err)
                else callback(null);
            });
        }
    }, function(err) {
        if (err) callback(err);
        callback(null);
    });
};
