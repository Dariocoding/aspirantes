import { setDefaultResultOrder } from "node:dns";

// Neon publica AAAA; en Windows el TCP a :5432 por IPv6 suele fallar.
setDefaultResultOrder("ipv4first");
