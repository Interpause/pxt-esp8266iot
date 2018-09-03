//config
let web_protocol = 'TCP'
let experimental_mode = true
let wifi_mode = WifiMode.client
let nresps = ['OK', 'no change', 'SEND OK', 'ERROR', 'SEND FAIL', 'link is builded'] //most common responses from ESP8266
let default_timeout = 5000
let default_http_timeout = 30000

/** @author John-Henry Lim (Interpause@Github) */
//% color=#0fbc11 icon="\uf1eb" weight=90
namespace Wifi {
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
        command(`ATE0`, nresps)
        command(`AT+CIPMUX=1`, nresps)
        waitfor(`AT+CWMODE=${wifi_mode}`, nresps, null)
    }

    /**
     * Connects to wifi. Returns true if connection is successful.
     * @param the network's SSID
     * @param the network's password
     */
    //% weight=99
    //% blockId="wifi_connect" block="connect wifi SSID %ssid|passwd %key"
    export function connectWifi(ssid: string, key: string): boolean {
        let result = waitfor(`AT+CWJAP="${ssid}","${key}"`, nresps)
        return result != "ERROR" && result != "timed out"
    }
}