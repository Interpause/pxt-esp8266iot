radio.setGroup(4)
Wifi.initWifi(SerialPin.P12, SerialPin.P13, WifiMode.client)
basic.showIcon(IconNames.Heart)
while (!(Wifi.connectWifi("wifirofl", "secret"))) {
    basic.pause(1000)
}
while (!(Wifi.connectSite("api.thingspeak.com", connectionSlot.alpha))) {
    basic.pause(1000)
}
basic.showIcon(IconNames.SmallDiamond)
Wifi.tosendtext(
"verysecret",
input.acceleration(Dimension.X),
input.acceleration(Dimension.Y),
input.acceleration(Dimension.Z)
)
basic.showIcon(IconNames.Diamond)
