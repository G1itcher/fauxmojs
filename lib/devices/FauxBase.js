var printf = require("printf");
var aguid = require("aguid");

const _discoverXML = Symbol("discoverXML");
const _searchResponse = Symbol("searchresponse");

class FauxBase{

    constructor(name, type, port, target, handler, discoverXML, searchResponse)
    {
        if(typeof name != "string" || typeof port != "number" || typeof handler != "function")
        {
            throw new FauxBaseArgumentException("Invalid parameters types for FauxBase");
        }

        this.name = name;
        this.type = type;
        this.target = target;
        this.port = port;
        this.handler = handler;
        this.uid = aguid(name);
        this.bootUid = aguid();
        this[_discoverXML] = discoverXML;
        this[_searchResponse] = searchResponse;
    }

    doAction(...args){
        return handler(...args);
    }

    get discoverXml(){
        return this[_discoverXML]
    }

    get searchResponse(){
        return this[_searchResponse];
    }
}

class FauxBaseArgumentException extends Error{
    constructor(message, innerException){
        super(message)
        this.innerException = innerException;
    }
}

module.exports = FauxBase;