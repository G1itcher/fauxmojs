var _ = require("lodash");

const _setupXML = Symbol("setupXML");
const _searchResponse = Symbol("searchresponse");

class FauxBase{

    constructor(name, port, target, handler, uid, bootUid, setupXML, searchResponse)
    {
        if(typeof name != "string" ||
           typeof port != "number" ||
           typeof handler != "function" ||
           typeof target != "string" ||
           typeof setupXML != "string" ||
           typeof searchResponse != "string")
        {
            throw new FauxBaseArgumentException("Invalid parameters types for FauxBase");
        }

        this.name = name;
        this.target = target;
        this.port = port;
        this.handler = handler;
        this.uid = uid;
        this.bootUid = bootUid;
        this[_setupXML] = setupXML;
        this[_searchResponse] = searchResponse;
    }

    doAction(...args){
        return handler(...args);
    }

    get setupXml(){
        return this[_setupXML]
    }

    get searchResponse(){
        return this[_searchResponse];
    }

    static buildRoutes(devices){
        return [];
    }
}

class FauxBaseArgumentException extends Error{
    constructor(message, innerException){
        super(message)
        this.innerException = innerException;
    }
}

module.exports = FauxBase;