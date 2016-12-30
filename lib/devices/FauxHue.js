var FauxBase = require("./FauxBase");
var printf = require("printf");
var aguid = require("aguid");

const TYPE_NAME = "FauxHue";
const TARGET = "urn:schemas-upnp-org:device:basic:1";

//String Values in order:
//ip, port
//name
//uid
const DISCOVER_XML =
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
const SEARCH_RESPONSE = "HTTP/1.1 200 OK\r\nCACHE-CONTROL: max-age=86400\r\nDATE: %(date)s\r\nEXT:\r\nLOCATION: %(ip)s:%(port)s\r\nOPT: \"http://schemas.upnp.org/upnp/1/0/\"; ns=01\r\n01-NLS: %(bootUid)s\r\nSERVER: Unspecified, UPnP/1.0, Unspecified\r\nST: %(target)s\r\nUSN: uuid:Socket-1_0-%(uid)s::%(target)s\r\n";


class FauxHue extends FauxBase{
    
    static get Type(){return TYPE_NAME;}
    static get Target(){return TARGET;}

    constructor(name, port, handler, ipAddress)
    {
        var ipAddress = ipAddress || require("ip").address();
        var uid = aguid(name);
        var bootUid = aguid();
        var discoverXml = printf(DISCOVER_XML, {
            ip: ipAddress,
            port: port,
            name: name,
            uid: uid
        });
        var searchResponse = printf(SEARCH_RESPONSE, {
            data: new Date().toUTCString(),
            ip: ipAddress,
            port: port,
            bootUid: bootUid,
            target: FauxHue.Target,
            uid: uid
        })

        super(name, FauxHue.Type, port, FauxHue.Target, handler, uid, bootUid, discoverXml, searchResponse);

        self.lights = [];
    }
}