/**
 * class that represents HTTP requests. Based on HTTP/1.1.
 * @author John-Henry Lim (Interpause@Github)
 */
class Request {
    method: string
    URI: string
    host: string
    headers: string
    body: string
    protocol: string
    reply: string
    req: string
    timein: number
    timeout: number
    slot: number
    id: number
    seen: boolean
    sent: boolean

    /**
     * The Request object is used to send http requests to webhost easily via sendRequest().
     * @param method "GET","POST",etc
     * @param URI The URI to make the request to.
     * @param body If using "POST", body is the data being sent to the webhost.
     * @param timeout The timeout before the request is given up on. Default is 30,000ms.
     * @param clear_immediately Whether the response should be cached or immediately discarded.
     * @param protocol Allows switching to protocol other than "TCP". This currently probably does not work.
     */
    constructor(method: string, URI: string, body: string = null, timeout: number = null, clear_immediately: boolean = true, protocol: string = null) {
        this.method = method
        this.headers = ""
        this.body = body
        this.timein = -1
        this.timeout = (timeout == null) ? default_http_timeout : timeout
        this.protocol = protocol
        this.sent = false
        this.reply = null
        this.id = input.runningTime()
        this.seen = clear_immediately
        this.slot = 0
        this.req = null

        //As microbit doesnt have regex, the below effectively is regex.
        let slashes = 0
        this.host = ""
        this.URI = ""
        let next = ''
        let http_included = URI.substr(0, 4) == "http" || URI.substr(0, 4) == "HTTP"
        for (let i = 0; i < URI.length; i++) {
            next = URI.charAt(i)
            if (next == '/' || next == '\\') slashes = slashes + 1
            if (http_included && slashes >= 3) this.URI = this.URI + next
            else if (!http_included && slashes >= 1) this.URI = this.URI + next
            else if (http_included && slashes == 2) this.host = this.host + next
            else if (!http_included && slashes == 0) this.host = this.host + next
        }
        if (http_included) this.host = this.host.substr(1, this.host.length - 1)
    }

    /** Generates the request to be sent. TODO: user headers*/
    sendRequest(slot: connectionSlot): void {
        //Generating request text
        let text = ""
        text = text + `${this.method} ${(this.URI == "") ? '/' : this.URI} HTTP/1.1` + '\u000D' + '\u000A'
        text = text + `Host: ${this.host}` + '\u000D' + '\u000A'
        text = text + `Connection: close` + '\u000D' + '\u000A'
        if ((this.method == 'POST' || this.method == 'PUT') && this.body != null && this.body != "") {
            text = text + `Content-Type: text/plain` + '\u000D' + '\u000A' //expand this
            text = text + `Content-Length: ${this.body.length}`
            text = text + '\u000D' + '\u000A'
            text = text + this.body
        }
        text = text + '\u000D' + '\u000A'
        this.slot = slot
        this.timein = input.runningTime()
        this.req = text
    }

    /** Sets the response from the webhost. */
    setResponse(msg: string) {
        let past = false
        let next = ''
        let rep = ""
        for (let i = 0; i < msg.length; i++) {
            next = msg.charAt(i)
            if (past) rep = rep + next
            if (next == ':') past = true
        }
        this.reply = rep
    }

    /** Returns response. */
    getResponse(): string {
        if (this.reply != null) this.seen = true
        return this.reply
    }

    /** If not timed out, not already sent or not replied to, attempts to send the request. */
    update() {
        if (this.req == null) return
        if (this.timein == -1) return
        if (input.runningTime() - this.timein > this.timeout && this.reply == null) this.reply = "timed out"
        if (this.reply != null) return
        if (this.timeout == -1) return
        if (this.sent) return
        if (Wifi.connectSite(this.host, this.slot, this.protocol)) {
            Wifi.command(`AT+CIPSEND=${this.slot},${this.req.length + 2}`, ['>'], null, 100)
            if (Wifi.waitfor(this.req, nresps) == "SEND OK") this.sent = true
        }
    }
}

//request queue functionality
let request_queue: Request[][] = [[], [], [], []]
let request_cache: Request[] = []
basic.forever(function () {
    for (let i = 0; i < request_cache.length; i++) {
        if (request_cache[i].seen) {
            request_cache.splice(i, 1)
        }
    }
    for (let n = 0; n < request_queue.length; n++) {
        if (request_queue[n].length != 0) {
            if (request_queue[n][0].timein == -1) request_queue[n][0].sendRequest(n)
            request_queue[n][0].update()
            if (request_queue[n][0].reply != null) {
                Wifi.disconnectSite(n)
                request_cache.push(request_queue[n].shift())
            }
        }
    }
})

//HTTP request queue functions
namespace Wifi {
    let usedSlots: boolean[] = [false, false, false, false]
    /**
     * Connects to webhost. Returns true if successful.
     * @param url The domain name of the webhost. e.g. www.google.com, 192.168.1.1, api.thingspeak.com:314
     * @param slot The ESP8266 supports 4 simultaneous connections. Pick which to use.
     */
    //% weight=95
    //% advanced=true
    //% blockId="web_connect" block="connect to %url| via %slot"
    export function connectSite(url: string, slot: connectionSlot, protocol: string = null): boolean {
        protocol = (protocol == null) ? web_protocol : protocol
        disconnectSite(slot)

        //Extracts port number from url
        let pass = false
        let raw = ""
        let urlnew = ""
        let next = ''
        for (let i = 0; i < url.length; i++) {
            next = url.charAt(i)
            if (pass) {
                if (parseInt(next).toString() == 'NaN') pass = false
                else raw = raw + next
            } else if (next == ':' && raw == "") {
                pass = true
            } else {
                urlnew = urlnew + next
            }
        }
        let port: number
        if (raw == "") port = 80
        else port = parseInt(raw)
        let result = ""
        result = waitfor(`AT+CIPSTART=${slot},"${protocol}","${urlnew}",${port}`, nresps)
        if (result != "ERROR" && result != "timed out") {
            usedSlots[slot] = true
            return true
        } else return false
    }

    /**
     * Disconnects from webhost.
     * @param slot The ESP8266 supports 4 simultaneous connections. Pick which one to close.
     */
    //% weight=94
    //% advanced=true
    //% blockId="web_disconnect" block="disconnect %slot"
    export function disconnectSite(slot: connectionSlot): void {
        if (!usedSlots[slot]) return
        waitfor(`AT+CIPCLOSE=${slot}`, nresps)
        usedSlots[slot] = false
    }

    /** A way to access usedSlots from other parts of the code */
    export function closed(slot: number): void {
        usedSlots[slot] = false
    }

    /** Decides which queue to put Request in */
    function putRequestQueue(req: Request): void {
        let smallest = 0
        let cur = 999
        for (let i = 0; i < request_queue.length; i++) {
            if (request_queue[i].length < cur) {
                cur = request_queue[i].length
                smallest = i
            }
        }
        request_queue[smallest].push(req)
    }

    /**
     * Queues http request. Immediately returns id:number for http response retrieval via requestRetrieve(id)
     * @param method "GET","POST",etc.
     * @param uri URI of webhost to request to.
     * @param data Used in "POST" requests. Optional.
     * @param timeout Time in milliseconds before queue moves on. Set to -1 for no time out. Default 30,000ms.
     */
    //% weight=96
    //% blockId="web_request_request" block="request Request via %method|URI %uri|data %data "
    export function requestRequest(method: httpMethod, uri: string, data: string = null, timeout: number = null): number {
        let req = new Request(getHttpMethodFromEnum(method), uri, data, timeout, false)
        putRequestQueue(req)
        return req.id
    }

    /** Retrieves http response by ID given from requestRequest(). Returns null if ID doesn't exist and blocks until retrieval. */
    //% weight=95
    //% blockId="web_request_retrieve" block="retrieve Request by id %id"
    export function requestRetrieve(id: number): string {
        let req: Request
        for (let entry of request_cache) {
            if (entry.id == id) req = entry
        }
        for (let queue of request_queue) {
            for (let entry of queue) {
                if (entry.id == id) req = entry
            }
        }
        let reply: string = null
        while (reply == null) {
            reply = req.getResponse()
            basic.pause(20)
        }
        return reply
    }

    /** Retrieves http response by ID given from requestRequest(). Returns null if ID doesn't exist or if there is no response yet. */
    //% weight=94
    //% blockId="web_request_check" block="check Request by id %id"
    export function requestCheck(id: number): string {
        for (let req of request_cache) {
            if (req.id == id) return req.getResponse()
        }
        return null
    }

    /**
     * Queues http request. Does not block nor return response.
     * @param method "GET","POST",etc.
     * @param uri URI of webhost to request to.
     * @param data Used in "POST" requests. Optional.
     * @param timeout Time in milliseconds before queue moves on. Set to -1 for no time out. Default 30,000ms.
     */
    //% weight=98
    //% blockId="web_request_send" block="send Request via %method|URI %uri|data %data"
    export function requestSend(method: httpMethod, uri: string, data: string = null, timeout: number = null): void {
        putRequestQueue(new Request(getHttpMethodFromEnum(method), uri, data, timeout, true))
        return
    }

    /**
     * Queues http request. Does not block nor return response.
     * @param method "GET","POST",etc.
     * @param uri URI of webhost to request to.
     * @param data Used in "POST" requests. Optional.
     * @param timeout Time in milliseconds before queue moves on. Set to -1 for no time out. Default 30,000ms.
     */
    //% weight=96
    //% blockId="web_request_waitfor" block="wait for Request via %method|URI %uri|data %data"
    export function requestWaitfor(method: httpMethod, uri: string, data: string = null, timeout: number = null): string {
        let req = new Request(getHttpMethodFromEnum(method), uri, data, timeout, false)
        putRequestQueue(req)
        let reply: string = null
        while (reply == null) {
            reply = req.getResponse()
            basic.pause(20)
        }
        return reply
    }

}