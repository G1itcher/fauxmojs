var FauxBase = require("./FauxBase");

const TYPE_NAME = "FauxHue";
const TARGET = "urn:schemas-upnp-org:device:basic:1";

class FauxHue extends FauxBase{
    
    static get Type(){return TYPE_NAME;}
    static get Target(){return TARGET;}

    constructor(name, port, handler, ipAddress)
    {
        this.name = option.name;
        this.ipAddress = ipAddress || require("ip").address();
        super(name, FauxHue.Type, port, )
    }
}