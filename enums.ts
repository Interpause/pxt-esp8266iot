/** Human-readable representation of numbers for different ESP8266 wifi modes. */
enum WifiMode {
    client = 1,
    hotspot = 2,
    both = 3
}
/** Forces user to acknowledge there are only 4 connections max. */
enum connectionSlot {
    alpha = 0,
    beta = 1,
    charlie = 2,
    delta = 3
}
/** The four common http methods. */
enum httpMethod {
    GET = 0,
    POST = 1,
    PUT = 2,
    DELETE = 3

}
/** Component function for enum httpMethod */
function getHttpMethodFromEnum(method:httpMethod):string{
    switch(method){
        case 0: return 'GET'
        case 1: return 'POST'
        case 2: return 'PUT'
        case 3: return 'DELETE'
        default: return 'GET'
    }
}