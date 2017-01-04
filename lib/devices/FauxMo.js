var FauxBase = require("./FauxBase");
var printf = require("printf");
var aguid = require("aguid");
var _ = require("lodash");
var debug = require("debug")("ssdp-server"); //TODO: Is this right? How does the debug command work?
var Boom = require('boom');

const TARGET = "urn:Belkin:device:**";

//String Values in order:
//ip, port
//name
//uid
const SETUP_XML =
`<?xml version="1.0"?>
<root>
    <device>
        <deviceType>urn:Fauxmo:device:controllee:1</deviceType>
        <friendlyName>%(name)s</friendlyName>
        <manufacturer>Belkin International Inc.</manufacturer>
        <modelName>Emulated Socket</modelName>
        <modelNumber>3.1415</modelNumber>
        <UDN>uuid:Socket-1_0-%(uid)s</UDN>
    </device>
</root>`;

//String Values in order:
//date (new Date().toUTCString())
//ip, port
//bootUid
//target
//uid, target
//TODO: Can the search response template be put on the base?
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

const SETUP_URL = "http://%(ip)s:%(port)s/%(uid)s/setup.xml"

class FauxMo extends FauxBase{
    
    static get Target(){return TARGET;}

    constructor(name, port, handler, ipAddress)
    {
        ipAddress = ipAddress || require("ip").address();
        let uid = aguid(name);
        let bootUid = "0a75ccf5-2910-4a5b-beab-dacd65c69da7"//aguid(); //TODO: Test that it still works after removing this
        let setupXml = printf(SETUP_XML, {
            name: name,
            uid: uid
        });
        let searchResponse = printf(SEARCH_RESPONSE, {
            setupUrl: printf(SETUP_URL,{
                ip:ipAddress,
                port:port,
                uid: uid
            }),
            bootUid: bootUid,
            target: FauxMo.Target,
            uid: uid
        });

        super(name, port, FauxMo.Target, handler, uid, bootUid, setupXml, searchResponse);
        
        this.on = false;
    }

    //STATIC
    static buildRoutes(devices){
        let routes = 
        [
            {
                method: 'GET',
                path: '/{deviceId}/setup.xml',
                handler: (request, reply) => {
                    if (!request.params.deviceId) {
                        return Boom.badRequest();
                    }

                    console.log('>> sending device setup response for device:', request.params.deviceId);
                    var response = devices[request.params.deviceId].setupXml;
                    reply(devices[request.params.deviceId].setupXml);
                }
            },
            {
                method: 'POST',
                path: '/upnp/control/basicevent1',
                handler: (request, reply) => {
                    let portNumber = Number(request.raw.req.headers.host.split(':')[1]),
                        device = _.find(devices, (d) => d.port === portNumber),
                        action;

                    if (!device) {
                    return Boom.notFound();
                    }

                    if (!request.payload) {
                    return Boom.badRequest();
                    }

                    if (request.payload.indexOf('<BinaryState>1</BinaryState>') > 0) {
                    action = 'on';
                    } else if (request.payload.indexOf('<BinaryState>0</BinaryState>') > 0) {
                    action = 'off';
                    }

                    console.log('!! Action received for device:\n', device, '\naction:\n', action);

                    if (device.handler) {
                    device.handler(action);
                    } else {
                    console.log('Warning, device has no handler:', device);
                    }

                    reply({ok: true});
                }
            }
        ];

        return routes
    }
}

module.exports = FauxMo;