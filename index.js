require("dotenv").config()
const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const puppeteer = require('puppeteer');
const opts = require("./options");

let active = false;

const sendMessage = async (name, role, message) => {
    try {
        setTimeout(async () => {
            if (role == "Moderator" || role == "Owner" || role == "Developer") {
                await bot.telegram.sendMessage(opts.mainChatId, `Nickname: ${name}\nTag: ${role}\nMessage: ${message}`);
            } else {
                await bot.telegram.sendMessage(opts.secondaryChatId, `Nickname: ${name}\nTag: ${role}\nMessage: ${message}`);
            }
        }, 201);
    } catch (error) {
        console.log(error);
    }
}

const parseChat = async () => {
    const browser = await puppeteer.launch(opts.LAUNCH_PUPPETEER_OPTS);
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });
    page.setDefaultNavigationTimeout(0);
    await page.goto("https://www.csgoroll.com/");
    await page.waitForSelector("body > cw-root > mat-sidenav-container > mat-sidenav.mat-drawer.mat-sidenav.cw-sidenav.ng-tns-c2296848742-0.ng-trigger.ng-trigger-transform.mat-sidenav-fixed.ng-star-inserted.mat-drawer-side.mat-drawer-opened > div > cw-sidebar > cw-async-loader > cw-chat > div > cw-message-list");
    await page.exposeFunction('sendMessage', sendMessage);

    await page.evaluate(async () => {
        const target = document.getElementsByClassName("pretty-scrollbar")[0];
        const observer = new MutationObserver(async (mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type == "childList" && mutation.addedNodes.length && mutation.nextSibling.nodeType != 1) {
                    mutation.addedNodes.forEach(async element => {
                        if (element.children && element.children[0].tagName != "CW-SYSTEM-MESSAGE") {
                            let className = element.children[0].children[0].children[0].children[1].children[0].children[0].classList[0];
                            if (className == "flare") {
                                let message = element.children[0].children[0].children[0].children[1].children[1].children[0].innerText;
                                let role = element.children[0].children[0].children[0].children[1].children[0].children[0].innerText;
                                let name = element.children[0].children[0].children[0].children[1].children[0].children[1].innerText;
                                await sendMessage(name, role, message);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(target, { childList: true });
    })



}

bot.start((ctx) => {
    if(active == false){
        active = true;
        ctx.reply("- Activated -")
        parseChat();
    } else {
        ctx.reply("The bot has already been activated");
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
bot.launch();