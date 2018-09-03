/** 
 * Wrapper class for commands sent to ESP8266 wifi module.
 * Check out ESP8266's documentation here: 
 * https://www.espressif.com/en/support/download/documents?keys=&field_type_tid%5B%5D=14
 * If experimental mode doesn't work, try flashing ESP8266 with newer firmware: 
 * https://bbs.espressif.com/viewtopic.php?f=57&t=433
 * http://wiki.aprbrother.com/en/Firmware_For_ESP8266.html
 * @author John-Henry Lim (Interpause@Github)
 */
class Command {
    msg: string
    reply: string
    whitelist: string[]
    blacklist: string[]
    rejected: string
    seen: boolean
    timein: number
    timeout: number
    id: number
    /**
     * Wrapper for commands being sent to ESP8266 wifi module.
     * Helpful reference for commands: https://room-15.github.io/blog/2015/03/26/esp8266-at-command-reference/
     * @param msg Actual command being sent. Carriage return is unnecessary.
     * @param whitelist List of replies expected from module. Set as null to accept all replies.
     * @param blacklist List of replies from module that are ignored. Set as null to not ignore any.
     * @param timeout Time in milliseconds before queue stops waiting for reply. Set to -1 for no time out.
     * @param clear_immediately Whether the command should be not be cached for reading.
     */
    constructor(msg: string, whitelist: string[], blacklist: string[], timeout: number, clear_immediately: boolean) {
        this.msg = msg
        this.whitelist = (whitelist == null) ? [] : whitelist
        this.blacklist = (blacklist == null) ? [] : blacklist
        this.reply = null
        this.rejected = null
        this.seen = clear_immediately
        this.timein = -1
        this.timeout = timeout
        this.id = input.runningTime() //unique enough for most uses
    }
    /** Used by command queue to set replies to command. */
    setReply(reply: string): void {
        if (reply == this.msg) return
        if (this.whitelist != [] && this.whitelist.indexOf(reply) == -1) {
            this.rejected = reply
        } else if (this.blacklist != []) {
            if (this.blacklist.indexOf(reply) == -1) this.reply = reply
        } else this.reply = reply
        return
    }
    /** Returns latest accepted reply. */
    getReply(): string {
        if (this.reply != null) this.seen = true
        return this.reply
    }
    /** Returns latest rejected reply. */
    getRejected(): string {
        return this.rejected
    }
    /** Used by command queue to flag timed out commands. */
    update(): void {
        if (this.timein == -1) return
        if (this.timeout == -1) return
        if (input.runningTime() - this.timein < this.timeout) return
        this.reply = 'timed out'
        return
    }
    /** Sends the command to the ESP8266 wifi module. TODO: use uBit.serial instead. */
    send(): void {
        for (let i = 0; i < this.msg.length; i++) {
            serial.writeString(this.msg.charAt(i))
        }
        serial.writeString('\u000D' + '\u000A')
        this.timein = input.runningTime()
        return
    }
}

//variables
let cmd_queue: Command[] = [] //Queue for commands to be sent to ESP8266
let cmd_cache: Command[] = [] //Cache for commands that have been replied to

//Command Queue Functionality
basic.forever(function () {
    for (let i = 0; i < cmd_cache.length; i++) {
        if (cmd_cache[i].seen) {
            cmd_cache.splice(i, 1)
        }
    }
    if (cmd_queue.length != 0) {
        cmd_queue[0].update()
        if (cmd_queue[0].timein == -1) cmd_queue[0].send()
        if (cmd_queue[0].reply != null) cmd_cache.push(cmd_queue.shift())
    }
})

//Handler for serial input from ESP8266
function sendReply(msg: string) {
    if (msg.length == 8 && msg.substr(2, 6) == "CLOSED") Wifi.closed(parseInt(msg.charAt(0))) //ESP8266 announces when ports close
    else if (msg.length>4 && msg.substr(0,4)=="+IPD") request_queue[parseInt(msg.charAt(5))][0].setResponse(msg) //Handles http response
    else if (cmd_queue.length != 0) cmd_queue[0].setReply(msg) //Handles command feedback
    radio.sendString(msg)
    radio.sendString('\u000D' + '\u000A')
}

let whitespaces = ['\u0009', '\u000B', '\u0020', '\u200E', '\u200F', '\u2028', '\u2029']
let nextlines = ['\u000A', '\u000C', '\u000D', '\u0085']
let serial_input = ""
let raw_input = ""
let intermediate = ""
let past_start = false
let cur_char = ''
serial.onDataReceived('\u000D' + '\u000A', () => {
    //Below is simply to make sure serial inputs are received correctly.
    //Probs should remove once i verify serial is working properly/use uBit.serial
    raw_input = serial.readString()
    if (raw_input.length > 0) {
        for (let i = 0; i < raw_input.length; i++) {
            cur_char = raw_input.charAt(i)
            if (past_start) {
                if (nextlines.indexOf(cur_char) > -1) {
                    if (serial_input != "") sendReply(serial_input)
                    serial_input = ""
                    intermediate = ""
                    past_start = false
                } else if (whitespaces.indexOf(cur_char) > -1) {
                    intermediate = intermediate + cur_char
                } else {
                    serial_input = serial_input + intermediate + cur_char
                    intermediate = ""
                }
            } else {
                if (nextlines.indexOf(cur_char) == -1 && whitespaces.indexOf(cur_char) == -1) {
                    past_start = true
                    serial_input = serial_input + cur_char
                }
            }
        }
    }
    raw_input = ""
    cur_char = ''
})

//Command Queue control functions
namespace Wifi {
	/**
     * Queues ESP8266 command. Immediately returns id:number for reply retrieval via retrieve(id)
     * @param msg Actual command being sent. Carriage return is unnecessary.
     * @param whitelist List of replies expected from module. Optional.
     * @param blacklist List of replies from module ignored. Optional.
     * @param timeout Time in milliseconds before queue stops waiting for reply. Set to -1 for no time out. Default 5000ms.
     */
    //% weight=100
    //% advanced=true
    //% blockId="wifi_esp8266_request" block="send request command %msg"
    export function request(msg: string, whitelist: string[] = null, blacklist: string[] = null, timeout: number = null): number {
        if (timeout == null) timeout = default_timeout
        let cmd = new Command(msg, whitelist, blacklist, timeout, false)
        cmd_queue.push(cmd)
        return cmd.id
    }

    /** Retrieves reply from ESP8266 command by ID given from request(msg). Returns null if ID doesn't exist and blocks until retrieval. */
    //% weight=99
    //% advanced=true
    //% blockId="wifi_esp8266_retrieve" block="retrieve reply by command id %id"
    export function retrieve(id: number): string {
        let cmd: Command
        for (let entry of cmd_cache) {
            if (entry.id == id) cmd = entry
        }
        for (let entry of cmd_queue) {
            if (entry.id == id) cmd = entry
        }
        let reply:string = null
        while (reply == null) {
            reply = cmd.getReply()
            basic.pause(20)
        }
        return reply
    }

    /** Retrieves reply from ESP8266 command by ID given from request(msg). Returns null if ID doesn't exist or if command hasn't been replied to. */
    //% weight=99
    //% advanced=true
    //% blockId="wifi_esp8266_check_request" block="check reply by command id %id"
    export function check(id: number): string {
        for (let cmd of cmd_cache) {
            if (cmd.id == id) return cmd.getReply()
        }
        return null
    }

    /**
     * Queues ESP8266 command. Does not block nor return reply.
     * @param msg Actual command being sent. Carriage return is unnecessary.
     * @param whitelist List of replies expected from module. Optional.
     * @param blacklist List of replies from module ignored. Optional.
     * @param timeout Time in milliseconds before queue stops waiting for reply. Set to -1 for no time out. Default 5000ms.
     */
    //% weight=97
    //% advanced=true
    //% blockId="wifi_esp8266_command" block="send command %msg"
    export function command(msg: string, whitelist: string[] = null, blacklist: string[] = null, timeout: number = null): void {
        if (timeout == null) timeout = default_timeout
        cmd_queue.push(new Command(msg, whitelist, blacklist, timeout, true))
        return
    }

    /**
     * Queues ESP8266 command. Blocks until there is a reply to return. 
     * @param msg Actual command being sent. Carriage return is unnecessary.
     * @param whitelist List of replies expected from module. Optional.
     * @param blacklist List of replies from module ignored. Optional.
     * @param timeout Time in milliseconds before queue stops waiting for reply. Set to -1 for no time out. Default 5000ms.
     */
    //% weight=96
    //% advanced=true
    //% blockId="wifi_esp8266_waitfor" block="wait for reply command %msg"
    export function waitfor(msg: string, whitelist: string[] = null, blacklist: string[] = null, timeout: number = null): string {
        if (timeout == null) timeout = default_timeout
        let cmd = new Command(msg, whitelist, blacklist, timeout, false)
        cmd_queue.push(cmd)
        let reply: string = null
        while (reply == null) {
            reply = cmd.getReply()
            basic.pause(20)
        }
        return reply
    }
}