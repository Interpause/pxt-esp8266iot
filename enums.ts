/** Human-readable representation of numbers for different ESP8266 wifi modes. */
enum WifiMode {
    client = 1,
    hotspot = 2,
    both = 3
}
/** Forces user to acknowledge there are only 5 connections max. */
enum connectionSlot {
    alpha = 0,
    beta = 1,
    charlie = 2,
    delta = 3
}