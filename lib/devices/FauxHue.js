var FauxBase = require("./FauxBase");
var printf = require("printf");
var aguid = require("aguid");
var Boom = require('boom');
var _ = require("lodash");

const FAKE_FULL_STATE = {
	"lights": {
		"1": {
			"state": {
				"on": false,
				"bri": 0,
				"hue": 0,
				"sat": 0,
				"xy": [0.0000, 0.0000],
				"ct": 0,
				"alert": "none",
				"effect": "none",
				"colormode": "hs",
				"reachable": true
			},
			"type": "Extended color light",
			"name": "test hue",
			"modelid": "LCT001",
			"swversion": "65003148",
			"pointsymbol": {
				"1": "none",
				"2": "none",
				"3": "none",
				"4": "none",
				"5": "none",
				"6": "none",
				"7": "none",
				"8": "none"
			}
		}
	}
}

const TARGET = "urn:schemas-upnp-org:device:basic:1";

//String Values in order:
//ip, port
//name
//uid
const SETUP_XML =
`<?xml version="1.0"?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
	<specVersion>
		<major>1</major>
		<minor>0</minor>
	</specVersion>
	<URLBase>http://%(ip)s:%(port)s/</URLBase>
	<device>
		<deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>
		<friendlyName>%(name)s</friendlyName>
		<manufacturer>Royal Philips Electronics</manufacturer>
		<manufacturerURL>http://www.philips.com</manufacturerURL>
		<modelDescription>Philips hue Personal Wireless Lighting</modelDescription>
		<modelName>Philips hue bridge 2012</modelName>
		<modelNumber>929000226503</modelNumber>
		<modelURL>http://www.meethue.com</modelURL>
		<serialNumber>001788102201</serialNumber>
		<UDN>uuid:%(uid)s</UDN>
		<serviceList>
			<service>
				<serviceType>(null)</serviceType>
				<serviceId>(null)</serviceId>
				<controlURL>(null)</controlURL>
				<eventSubURL>(null)</eventSubURL>
				<SCPDURL>(null)</SCPDURL>
			</service>
		</serviceList>
		<presentationURL>index.html</presentationURL>
		<iconList>
			<icon>
				<mimetype>image/png</mimetype>
				<height>48</height>
				<width>48</width>
				<depth>24</depth>
				<url>hue_logo_0.png</url>
			</icon>
			<icon>
				<mimetype>image/png</mimetype>
				<height>120</height>
				<width>120</width>
				<depth>24</depth>
				<url>hue_logo_3.png</url>
			</icon>
		</iconList>
	</device>
</root>`;

//String Values in order:
//date (new Date().toUTCString())
//ip, port
//bootUid
//target
//uid, target
//const SEARCH_RESPONSE = "HTTP/1.1 200 OK\r\nCACHE-CONTROL: max-age=86400\r\nDATE: %(date)s\r\nEXT:\r\nLOCATION: %(ip)s:%(port)s\r\nOPT: \"http://schemas.upnp.org/upnp/1/0/\"; ns=01\r\n01-NLS: %(bootUid)s\r\nSERVER: Unspecified, UPnP/1.0, Unspecified\r\nST: %(target)s\r\nUSN: uuid:Socket-1_0-%(uid)s::%(target)s\r\n";
const SEARCH_RESPONSE = `HTTP/1.1 200 OK
CACHE-CONTROL: max-age=86400
DATE: ${new Date().toUTCString()}
EXT:
LOCATION: %(setupUrl)s
OPT: "http://schemas.upnp.org/upnp/1/0/"; ns=01
01-NLS: %(bootUid)s
SERVER: Unspecified, UPnP/1.0, Unspecified
ST: %(target)s
USN: uuid:Socket-1_0-%(uid)s::%(target)s\r\n\r\n`;

const SETUP_URL = "http://%(ip)s:%(port)s/%(uid)s/fauxhue/setup.xml"


class FauxHue extends FauxBase{
    
    static get Target(){return TARGET;}

    constructor(name, port, handler, ipAddress)
    {
        ipAddress = ipAddress || require("ip").address();
        let uid = aguid(name);
        let bootUid = "0a75ccf5-2910-4a5b-beab-dacd65c69da7"//aguid();
        let setupXml = printf(SETUP_XML, {
            name: name,
            uid: uid,
            ip: ipAddress,
            port: port
        });
        let searchResponse = printf(SEARCH_RESPONSE, {
            setupUrl: printf(SETUP_URL,{
                ip:ipAddress,
                port:port,
                uid: uid
            }),
            bootUid: bootUid,
            target: FauxHue.Target,
            uid: uid
        });

        super(name, port, FauxHue.Target, handler, uid, bootUid, setupXml, searchResponse);

        this.light = {
            "state": {
                "on": 0,
                "bri": 0,
                "hue": 0,
                "sat": 0,
                "xy": [0.0000, 0.0000],
                "ct": 0,
                "alert": "none",
                "effect": "none",
                "colormode": "hs",
                "reachable": true
            },
            "type": "Extended color light",
            "name": this.name,
            "modelid": "LCT001",
            "swversion": "65003148",
            "pointsymbol": {
                "1": "none",
                "2": "none",
                "3": "none",
                "4": "none",
                "5": "none",
                "6": "none",
                "7": "none",
                "8": "none"
            }
        }
        console.log(this.light)
        FauxHue.lights = FauxHue.lights || []
        FauxHue.lights.push(this.light);
        console.log(FauxHue.lights)
        
    }
    //STATIC
    //TODO: This is different from the version on git. Make sure that it still works.
    static buildRoutes(devices)
    {
        let routes = [
            {
                method: 'GET',
                path: '/{deviceId}/fauxhue/setup.xml',
                handler: (request, reply) => {
                    if (!request.params.deviceId) {
                        return Boom.badRequest();
                    }

                    console.log('>> sending device setup response for device:', request.params.deviceId);
                    var response = devices[request.params.deviceId].setupXml;
                    reply(devices[request.params.deviceId].setupXml);
                }
            },
            
            {   //Get all the ligts
                method: 'GET',
                path: '/api/{userId}/lights',
                handler: (request, reply) => {
                    //console.log('>> sending device setup response for device:', request.params.deviceId);
                    var response = FauxHue.lights;
                    console.log(response)
                    reply(response);
                }
            },
            {   //Get all devices
                method: 'GET',
                path: '/api/{userId}',
                handler: (request, reply) => {
                    console.log('>> sending fake full state list');
                    var response = {lights:{}};
                    for(var i = 0; i < FauxHue.lights.length; i++){
                        response.lights[""+i] = FauxHue.lights[i];
                    }
                    reply(response);
                }
            },
            {   //catch all
                method: '*',
                path: '/{userId*}',
                handler: (request, reply) => {
                    console.log('>> catchall');
                    var response = {lights:{}};
                    for(var i = 0; i < FauxHue.lights.length; i++){
                        response.lights[""+i] = FauxHue.lights[i];
                    }
                    reply(response);
                }
            },
            {   //Get speciic light status
                method: 'GET',
                path: '/api/{userId}/lights/{lightId}',
                handler: (request, reply) => {
                    var lightId = parseInt(request.params.lightId);
                    //console.log('>> sending device setup response for device:', request.params.deviceId);
                    var response = JSON.stringify(FauxHue.lights[lightId]);
                    reply(response);
                }
            },
            {   //create a new user
                method: 'POST',
                path: '/{x*}',
                handler: (request, reply) => {
                    var response = JSON.stringify([{
                        success:{
                            username:"fauxHue"
                        }
                    }]);
                    reply(response);
                }
            },
            {
                method: 'PUT',
                path: '/api/{userId}/lights/{lightId}/state',
                handler: (request, reply) => {
                    var device = FauxHue.lights ? FauxHue.lights[parseInt(request.params.lightId)] : null;

                    if (!device) {
                        return Boom.notFound();
                    }

                    if (!request.payload) {
                        return Boom.badRequest();
                    }

                    console.log(request.payload);
                    var payload = fixHuePayload(request.payload);

                    reply({success: true});
                }
            }
        ];

        return routes;
    }
}

function fixHuePayload(payload){
    var fixedObject = {};
    _.forOwn(payload, (v, k) => {
        var subObj = JSON.parse(k);
        _.forOwn(subObj, (subV, subK) => {
            fixedObject[subK] = subV;
        });
    });
    return fixedObject;
}
module.exports = FauxHue;