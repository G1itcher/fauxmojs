var FauxBase = require("./FauxBase");
var printf = require("printf");
var aguid = require("aguid");
var Boom = require('boom');
var _ = require("lodash");

const TARGET = "urn:schemas-upnp-org:device:basic:1";

//String Values in order:
//ip, port
//name
//uid
const SETUP_XML =
`<?xml version="1.0" encoding="UTF-8" ?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
    <specVersion>
        <major>1</major>
        <minor>0</minor>
    </specVersion>
    <URLBase>%(ip)s:%(port)s/</URLBase>
    <device>
        <deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>
        <friendlyName>Fauxlips hue (%(name)s)</friendlyName>
        <manufacturer>Royal Philips Electronics</manufacturer>
        <manufacturerURL>http://www.philips.com</manufacturerURL>
        <modelDescription>Philips hue Personal Wireless Lighting</modelDescription>
        <modelName>Philips hue bridge 2012</modelName>
        <modelNumber>929000226503</modelNumber>
        <modelURL>http://www.meethue.com</modelURL>
        <serialNumber>0017880ae670</serialNumber>
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

const SETUP_URL = "http://%(ip)s:%(port)s/%(uid)s/setup.xml"


class FauxHue extends FauxBase{
    
    static get Target(){return TARGET;}

    constructor(name, port, handler, ipAddress)
    {
        ipAddress = ipAddress || require("ip").address();
        let uid = aguid(name);
        let bootUid = "0a75ccf5-2910-4a5b-beab-dacd65c69da7"//aguid();
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

        super(name, port, FauxHue.Target, handler, uid, bootUid, setupXml, searchResponse);

        this.lights = []; //Todo Implement once I know what this is for
    }
    //STATIC
    //TODO: This is different from the version on git. Make sure that it still works.
    static buildRoutes(devices)
    {
        let routes = [
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

        return routes;
    }
}