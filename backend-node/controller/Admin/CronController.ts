import cron from "node-cron";
import { releasePayment } from "../ContractController";
import { closeTicket } from "./TicketsController";

cron.schedule("* * * * *",async ()=>{
    console.log("🚀 Cron Started: Checking for completed contracts...");
    await releasePayment();
})

cron.schedule("0 1 * * *",async ()=>{
    console.log("🚀 Cron Started: Checking for Tickets...");
    await closeTicket();
})
