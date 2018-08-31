//config
let web_protocol = 'TCP'
let experimental_mode = true
let wifi_mode = WifiMode.client
let nresps = ['OK', 'no change', 'SEND OK', 'ERROR', 'link is builded'] //most common responses from ESP8266
let default_timeout = 5000

//% color=#0fbc11 icon="\uf1eb" weight=90
namespace Wifi {
    //NECESSARY. ACCESS C++ uBit.serial NOT ONLY FOR MULTI SERIAL BUT ALSO TO ALLOW BETTER SERIAL READING

    //TODO:Advanced Commands
    //More detailed setup(wifi_mode:enum) (DONE)
    //Debug via Radio (DONE, but commented out in command_wrapper.ts)
    //A command function that does not block but allows easy retrieval of values later (DONE)
    //Investigate multiple connections (DONE)
    //Experimental mode for old firmware versus cur firmware (DONE)
    //^DO FURTHER EXTENSIVE TESTING OF WHAT IS AND IS NOT SUPPORTED. Arduino serial helps.
    //DEBUG: why do so responses cause the handler to hang??? (DONE)
    //Close connections (DONE)
    //Support POST requests
    //Handle extra messages better (DONE???)
    //TODO: Split into multiple files? (DONE)
    //Javadocs and comments, everywhere (DONE)

    //Immediate TODO: DONE
    //Command Queue System: DONE
    //Utilizes feedback from ESP8266 instead of long delays DONE
    //Queuing of multiple commands for efficiency DONE
    //System to return replies to functions that need it DONE

    //Last TODO:
    //Expose lower level uBit.serial library so as to access multiple serial streams
    //^baudrate is locked across all streams however
    //AKA Currently serial is unuseable if this package is used

    //Future TODO:
    //Investigate using UDP protocol for this package
    //Investigate using hotspot mode for this package
    //What happens if a command times out? How does ESP8266 respond to a new command? Is there a cancel command?
    //^What if the command's response coincides with the cancel's OK return?

    /**
     * Initializes the ESP8266 wifi module. Note: Baudrate is set to 9600.
     * @param wifiRX The RX pin.
     * @param wifiTX The TX pin.
     * @param mode The operation mode of the module. 'client' connects to wifi networks. 'hotspot' provides a wifi network. 'both' does both.
     */
    //% weight=100
    //% blockId="wifi_init" block="init wifi RX %wifiRX|TX %wifiTX|in mode %mode|"
    export function initWifi(wifiRX: SerialPin, wifiTX: SerialPin, mode: WifiMode = WifiMode.client): void {
        serial.redirect(wifiRX, wifiTX, BaudRate.BaudRate9600)
        //serial.redirectToUSB()
        wifi_mode = mode
        command(`AT+RST`, ['ready'], null, 120000)
        waitfor(`ATE0`, nresps)
        waitfor(`AT+CIPMUX=1`, nresps)
        waitfor(`AT+CWMODE=${wifi_mode}`, nresps, null)
    }

    /**
     * Connects to wifi.
     * @param the network's SSID
     * @param the network's password
     */
    //% weight=99
    //% blockId="wifi_connect" block="connect wifi SSID %ssid|passwd %key"
    export function connectWifi(ssid: string, key: string): boolean {
        let result = waitfor(`AT+CWJAP="${ssid}","${key}"`, nresps)
        return result != "ERROR" && result != "timed out"
    }

    let usedSlots: connectionSlot[] = []
    /**
     * Connects to webhost.
     * @param url The domain name of the webhost. e.g. www.google.com, 192.168.1.1, api.thingspeak.com:314
     * @param slot The connection slot to use. Note ESP8266 supports only 4 simultanous connections.
     */
    //% weight=98
    //% blockId="web_connect" block="connect to %url| via %slot"
    export function connectSite(url: string, slot: connectionSlot, protocol: string = null): boolean {
        protocol = (protocol == null) ? web_protocol : protocol
        disconnectSite(slot)

        //Static typecode wont let me pass tuples as function return
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
        if (experimental_mode) result = waitfor(`AT+CIPSTART=${slot},"${protocol}","${urlnew}",${port}`, nresps)
        else result = waitfor(`AT+CIPSTART="${protocol}","${urlnew}",${port}`, nresps)
        if (result != "ERROR" && result != "timed out") {
            usedSlots.push(slot)
            return true
        } else return false
    }

    /**
     * Disconnects from webhost. Connection slot matters only in experimental mode.
     */
    //% weight=98
    //% blockId="web_disconnect" block="disconnect %slot"
    export function disconnectSite(slot: connectionSlot): void {
        if (!experimental_mode) slot = connectionSlot.alpha
        for (let i = 0; i < usedSlots.length; i++) {
            if (usedSlots[i] == slot) {
                usedSlots.splice(i, 1)
                if (experimental_mode) waitfor(`AT+CIPCLOSE=${slot}`, nresps)
                else waitfor(`AT+CIPCLOSE`, nresps)
            }
        }
    }

    /**
     * Send data to webhost. TODO: Make more generic. Replace with request_queue system when done.
     * @param write_api_key test: thinkspeak API key
     * @param n1 field 1
     * @param n2 field 2
     * @param n3 field 3
     */
    //% weight=97
    //% blockId="send_data" block="Send Data to Webhost Write API Key %write_api_key|field1 %n1|field2 %n2|field3 %n3|"
    export function tosendtext(write_api_key: string,
        n1: number,
        n2: number,
        n3: number): void {
        let text = ""
        text = "GET https://api.thingspeak.com/update?api_key="
            + write_api_key
            + "&field1="
            + n1
            + "&field2="
            + n2
            + "&field3="
            + n3
            + " HTTP/1.0"
            + '\u000D' + '\u000A'
            + '\u000D' + '\u000A'
            + '\u000D' + '\u000A'
        command(`AT+CIPSEND=0,${text.length + 2}`, ['>'], null, 10000)
        waitfor(text, nresps)
    }
}
