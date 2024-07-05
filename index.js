const express = require("express");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const app = express();
const port = 35803;
// const { SocksProxyAgent } = require('socks-proxy-agent');
let token, device_id = Array.from({ length: 15 }, () => "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))).join('');
const valcanid = "9149487891715698987934";
const appver = "3.6.2", protocolver = 548;
// const agent_proxy = new SocksProxyAgent("socks5://127.0.0.1:8085");
// fetch("http://httpbin.org/ip")
//     .then(response => response.json())
//     .then(data => console.log("Your IP: " + data.origin))
//     .catch(error => console.error("Error fetching the IP info:", error));

async function refleshtoken() {
    fetch("https://chatgpt-au.vulcanlabs.co/api/v1/token", {
        method: 'POST',
        agent: agent_proxy,
        headers: {
            'Host': 'chatgpt-au.vulcanlabs.co',
            'X-Vulcan-Application-Id': 'com.smartwidgetlabs.chatgpt',
            'Accept': 'application/json',
            'User-Agent': `Chat Smith Android, Version ${appver}(${protocolver})`,
            'X-Vulcan-Request-Id': valcanid,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept-Encoding': 'gzip'
        },
        body: JSON.stringify({
            "device_id": device_id,
            "order_id": "",
            "product_id": "",
            "purchase_token": "",
            "subscription_id": ""
        })
    }).then(response => {
        console.log("TOKEN LOGIN Done", response.status)
        if (!response.ok) return console.log("JSONエラー")
        return response.json()
    }).then(
        data => {
            token = data.AccessToken;
            setTimeout(() => {
                refleshtoken();
            }, 1 * 1000 * 60 * 60);
        }
    ).catch(error => {
        console.error('Error:', error)
        setTimeout(() => {
            refleshtoken();
        }, 5000);
    });
}

refleshtoken();

app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "php")
    next();
})

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get("/robots.txt", (req, res) => {
    res.sendFile(__dirname + "/robots.txt");
})

app.post("/generate", async (req, res) => {
    if (Array.isArray(req.body["messages"])) {
        let messages = []

        if (req.headers["accept-language"]) messages.push({
            content: `Please answer in ${req.headers["accept-language"]} language`,
            role: "system"
        });

        let images = []

        for (const msg of req.body["messages"])
            messages.push(msg)

        if (Array.isArray(req.body["images"])) {
            for (const image of req.body["images"])
                images.push(image)
        }
        const curl = await fetch("https://prod-smith.vulcanlabs.co/api/v6/chat", {
            method: 'POST',
            // agent: agent_proxy,
            headers: {
                'Host': 'prod-smith.vulcanlabs.co',
                'X-Vulcan-Application-Id': 'com.smartwidgetlabs.chatgpt',
                'Accept': 'application/json',
                'User-Agent': `Chat Smith Android, Version ${appver}(${protocolver})`,
                'X-Vulcan-Request-Id': valcanid,
                'Content-Type': 'application/json; charset=utf-8',
                'Accept-Encoding': 'gzip',
                'authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages,
                images,
                model: "gpt-4-vision-preview",
                nsfw_check: false,
                stream: false,
                temperature: 1,
                max_tokens: 2000,
                user: device_id
            })
        })
        if (!curl.ok) return res.send("JSONエラー")
        const json = await curl.json()
        messages.push(json.choices[0]?.Message)
        res.json(messages)
    }
    else return res.sendStatus(400);
});

app.listen(port, () => {
    console.log(`0.0.0.0:${port}`);
});