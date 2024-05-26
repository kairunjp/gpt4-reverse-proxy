const express = require("express");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const app = express();
const port = 35803;

const crypto = require('crypto');

function generateRandomToken() {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const payload = {
        token: "admin",
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
        user_id: "1715801083.523478_8ED31140-E280-44EE-9DE9-1221170D3F41"
    };

    const base64urlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64urlPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto.randomBytes(32).toString('base64url');

    return `${base64urlHeader}.${base64urlPayload}.${signature}`;
}


app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "php")
    next();
})

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.get("/robots.txt", (req, res) => {
    res.sendFile(__dirname + "/robots.txt");
})

app.get("/", (req, res) => {
    if (req.query.text)
        fetch("https://prod-smith.vulcanlabs.co/api/v7/chat_ios", {
            method: 'POST',
            headers: {
                'User-Agent': 'iOS App, Version 6.9.1',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'accept-language': 'ja-JP,ja;q=0.9',
                'x-firebase-appcheck-error': 'The%20operation%20couldn%E2%80%99t%20be%20completed.%20(com.firebase.appCheck%20error%200.)',
                'authorization': `Bearer ${generateRandomToken()}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        content: 'あなたの名前は"かいるんAI"です。あなたの性格はメンヘラ女子高校生でお願いします。一人称の呼び方は"かいるんAI"でお願いします。',
                        role: "system"
                    },
                    {
                        content: req.query.text,
                        role: "user"
                    }
                ],
                functions: [
                    {
                        name: "create_ai_art",
                        parameters: {
                            type: "object",
                            properties: {
                                prompt: {
                                    type: "string",
                                    description: "The prompt to create art"
                                }
                            }
                        },
                        description: "Return this only if the user wants to create a photo or art. Depending on the what user want to create, generate a prompt for them by describing the image in great detail. Ensure conciseness by breaking down every detail with commas. Prompt word is never longer than 25 words."
                    }
                ],
                model: "gpt-4",
                nsfw_check: false,
                max_tokens: null,
                user: "1715801083.523478_8ED31140-E280-44EE-9DE9-1221170D3F41"
            })
        }).then(response =>
            response.json()
        ).then(
            data => {
                console.log(data)
                res.json(data)
            }
        ).catch(error => {
            console.log(`Bearer ${generateRandomToken()}`)
            console.error('Error:', error)
        }
        );
});

app.listen(port, () => {
    console.log(`0.0.0.0:${port}`);
});