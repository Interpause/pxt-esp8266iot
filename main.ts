let item = ""
radio.setGroup(1)
Wifi.initWifi(SerialPin.P0, SerialPin.P1, WifiMode.client)
basic.showIcon(IconNames.Heart)
while (!(Wifi.connectWifi("your-wifi", "your-passwd"))) {
    basic.pause(1000)
}
while (true) {
    basic.showIcon(IconNames.SmallDiamond)
    item = Wifi.requestWaitfor(
    httpMethod.GET,
    "api.thingspeak.com/update?api_key=" + "not-my-key" + "&field1=" + input.acceleration(Dimension.X) + "&field2=" + input.acceleration(Dimension.Y) + "&field3=" + input.acceleration(Dimension.Z),
    ""
    )
    basic.showIcon(IconNames.Diamond)
    basic.pause(2000)
}
